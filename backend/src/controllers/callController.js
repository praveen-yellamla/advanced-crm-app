const prisma = require('../config/prisma');
const twilio = require('twilio');
const { formatToE164, isValidPhone } = require('../utils/phoneUtils');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const apiKey = process.env.TWILIO_API_KEY;
const apiSecret = process.env.TWILIO_API_SECRET;
const twimlAppSid = process.env.TWILIO_TWIML_APP_SID;
const callerId = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

/**
 * 1. GENERATE ACCESS TOKEN FOR BROWSER (WEBRTC)
 */
const getCallToken = async (req, res) => {
  try {
    const agentId = req.user.id.toString();
    const accessToken = new twilio.jwt.AccessToken(accountSid, apiKey, apiSecret, { identity: agentId });
    
    const voiceGrant = new twilio.jwt.AccessToken.VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: true
    });
    
    accessToken.addGrant(voiceGrant);
    res.json({ success: true, token: accessToken.toJwt() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 2. INITIATE OUTGOING CALL (API TRIGGERED - CLICK TO CALL)
 * This calls the AGENT'S browser first, then when they answer, it calls the CUSTOMER.
 */
const initiateOutgoingCall = async (req, res) => {
  const { phoneNumber, leadId } = req.body;
  const agentId = req.user.id;

  if (!isValidPhone(phoneNumber)) {
    return res.status(400).json({ success: false, message: "Invalid phone number format." });
  }

  const formattedTo = formatToE164(phoneNumber);

  try {
    // We call the client identity (agent's browser)
    const call = await client.calls.create({
      url: `${process.env.BACKEND_URL}/api/call/voice?To=${encodeURIComponent(formattedTo)}&leadId=${leadId}&agentId=${agentId}`,
      to: `client:${agentId}`,
      from: callerId,
    });

    res.json({ success: true, callSid: call.sid });
  } catch (error) {
    console.error("Initiate Outgoing Call Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 3. MASTER VOICE WEBHOOK (TwiML GENERATOR)
 * This handles both Outgoing (from browser) and Incoming (to number)
 */
const handleVoiceWebhook = async (req, res) => {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();

  try {
    const { To, From, CallSid, isMonitor, agentId, leadId } = { ...req.query, ...req.body };
    const cleanTo = To ? To.replace('client:', '') : '';
    
    console.log(`TELEPHONY ENGINE: Handling Voice for ${CallSid} | To: ${To} | Monitor: ${isMonitor}`);

    // CASE A: SILENT MONITORING (MANAGER LISTENING)
    if (isMonitor === 'true') {
      const dial = twiml.dial();
      dial.conference({
        muted: true,
        startConferenceOnEnter: false,
        endConferenceOnExit: false,
        beep: 'false'
      }, `call_${cleanTo.replace('+', '')}`);
      
      res.set("Content-Type", "text/xml");
      return res.status(200).send(twiml.toString());
    }

    // CASE B: INCOMING CALL TO TWILIO NUMBER
    if (To === callerId) {
      // In a real scenario, we'd route to an agent. For now, we broadcast to all browsers.
      const dial = twiml.dial({ 
        timeout: 20,
        record: 'record-from-answer',
        recordingStatusCallback: `${process.env.BACKEND_URL}/api/call/recording`
      });
      dial.client('broadcast_all'); // Or a specific agent identity
      
      res.set("Content-Type", "text/xml");
      return res.status(200).send(twiml.toString());
    }

    // CASE C: OUTGOING CALL FROM BROWSER OR CLICK-TO-CALL AGENT LEG
    // We bridge the call via a Conference to allow monitoring
    const conferenceName = `call_${cleanTo.replace('+', '')}`;
    
    // Create the DB record if it doesn't exist (optimistic logging)
    await prisma.call.upsert({
      where: { sid: CallSid },
      update: { status: 'ringing' },
      create: {
        sid: CallSid,
        from: From || callerId,
        phone: cleanTo,
        status: 'ringing',
        agentId: agentId ? parseInt(agentId) : 1,
        leadId: leadId ? parseInt(leadId) : null,
        type: 'OUTBOUND'
      }
    });

    const dial = twiml.dial({
      record: 'record-from-answer',
      recordingStatusCallback: `${process.env.BACKEND_URL}/api/call/recording`,
      statusCallback: `${process.env.BACKEND_URL}/api/call/status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
    });

    // We dial the customer and put them in the conference
    dial.number({
      statusCallback: `${process.env.BACKEND_URL}/api/call/status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
    }, cleanTo);

    // Also put the agent leg in the conference
    // But since this TwiML is returned TO the agent leg, 
    // we use Conference inside Dial if we want both in one.
    // Simpler: Just Dial the number. The agent is already connected.
    
    /* 
    NOTE: To support silent monitoring, we MUST use Conference. 
    The logic is: Agent calls -> enters Conference A. 
    Backend simultaneously calls Customer -> enters Conference A.
    */
    
    const response = new VoiceResponse();
    const dialC = response.dial();
    dialC.conference({
      startConferenceOnEnter: true,
      endConferenceOnExit: true,
      statusCallback: `${process.env.BACKEND_URL}/api/call/status`,
      statusCallbackEvent: ['start', 'end', 'join', 'leave']
    }, conferenceName);

    // Simultaneously trigger the customer leg if it hasn't been triggered
    // This is handled by Twilio's Dial command above if we use simple Dial.
    // For monitoring, we do:
    
    client.calls.create({
      to: cleanTo,
      from: callerId,
      twiml: `<Response><Dial><Conference startConferenceOnEnter="true" endConferenceOnExit="true">${conferenceName}</Conference></Dial></Response>`,
      statusCallback: `${process.env.BACKEND_URL}/api/call/status`,
    }).catch(err => console.error("Customer leg trigger failed:", err));

    res.set("Content-Type", "text/xml");
    return res.status(200).send(response.toString());

  } catch (error) {
    console.error("FATAL Voice Webhook Error:", error);
    res.set("Content-Type", "text/xml");
    return res.status(200).send('<Response><Say>Connection error. Please retry.</Say></Response>');
  }
};

/**
 * 4. STATUS CALLBACK WEBHOOK
 */
const handleStatusWebhook = async (req, res) => {
  const { CallSid, CallStatus, CallDuration, To } = req.body;
  console.log(`TELEPHONY STATUS: ${CallStatus} | SID: ${CallSid}`);

  try {
    await prisma.call.updateMany({
      where: { 
        OR: [
          { sid: CallSid },
          { phone: To, status: { in: ['ringing', 'queued'] } }
        ]
      },
      data: { 
        status: CallStatus,
        duration: parseInt(CallDuration) || undefined
      }
    });

    // MISSED CALL AUTOMATION (DAY 8)
    if (['no-answer', 'failed', 'busy'].includes(CallStatus)) {
      const callData = await prisma.call.findFirst({
        where: { sid: CallSid },
        include: { lead: true }
      });

      if (callData && callData.leadId) {
        await prisma.task.create({
          data: {
            title: `Missed Call: ${callData.phone}`,
            description: `Automated follow-up for ${callData.lead.customerName} (Status: ${CallStatus})`,
            type: 'FOLLOW_UP',
            priority: 'HIGH',
            userId: callData.agentId,
            leadId: callData.leadId
          }
        });
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Status Webhook Error:', error);
    res.status(200).send('OK');
  }
};

/**
 * 5. RECORDING CALLBACK
 */
const handleRecordingWebhook = async (req, res) => {
  const { CallSid, RecordingUrl } = req.body;
  try {
    await prisma.call.updateMany({
      where: { sid: CallSid },
      data: { recordingUrl: RecordingUrl }
    });
    res.status(200).send('OK');
  } catch (error) {
    res.status(200).send('OK');
  }
};

/**
 * 6. TAG & NOTES (DISPOSITION)
 */
const tagCall = async (req, res) => {
  const { callSid, tags, notes } = req.body;
  try {
    const call = await prisma.call.findFirst({
      where: { OR: [{ sid: callSid }, { id: parseInt(callSid) || -1 }] }
    });

    if (!call) return res.status(404).json({ success: false, message: "Call not found" });

    const updatedCall = await prisma.call.update({
      where: { id: call.id },
      data: { tags, notes }
    });

    if (updatedCall.leadId) {
      await prisma.lead.update({
        where: { id: updatedCall.leadId },
        data: { status: tags }
      });
      
      // Log activity
      await prisma.activityLog.create({
        data: {
          leadId: updatedCall.leadId,
          userId: req.user.id,
          type: 'CALL',
          action: `Call Logged: ${tags}`,
          details: notes
        }
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 7. CALL HISTORY
 */
const getCallHistory = async (req, res) => {
  const { agentId } = req.params;
  try {
    const history = await prisma.call.findMany({
      where: agentId !== 'all' ? { agentId: parseInt(agentId) } : {},
      include: { 
        lead: { select: { customerName: true, id: true } },
        agent: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 8. LIVE MONITORING
 */
const getActiveCalls = async (req, res) => {
  try {
    const activeCalls = await prisma.call.findMany({
      where: { status: { in: ['ringing', 'in-progress', 'answered'] } },
      include: { 
        agent: { select: { name: true, id: true } },
        lead: { select: { customerName: true, id: true } }
      }
    });
    res.json({ success: true, data: activeCalls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const monitorCall = async (req, res) => {
  const { phone } = req.query;
  try {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();
    const dial = twiml.dial();
    
    dial.conference({
      muted: true,
      startConferenceOnEnter: false,
      endConferenceOnExit: false,
      beep: 'false'
    }, `call_${phone.replace('+', '')}`);

    res.set("Content-Type", "text/xml");
    res.status(200).send(twiml.toString());
  } catch (error) {
    res.status(500).send(error.message);
  }
};

module.exports = {
  getCallToken,
  initiateOutgoingCall,
  handleVoiceWebhook,
  handleStatusWebhook,
  handleRecordingWebhook,
  tagCall,
  getCallHistory,
  getActiveCalls,
  monitorCall
};
