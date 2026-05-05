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

// 1. GENERATE ACCESS TOKEN FOR BROWSER (WEBRTC)
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

// 2. INITIATE OUTGOING CALL
const initiateOutgoingCall = async (req, res) => {
  const { phoneNumber, leadId } = req.body;
  const agentId = req.user.id;

  if (!isValidPhone(phoneNumber)) {
    return res.status(400).json({ success: false, message: "Invalid phone number format." });
  }

  const formattedTo = formatToE164(phoneNumber);
  console.log("DIALING E.164 (Direct):", formattedTo);

  try {
    const call = await client.calls.create({
      url: `${process.env.BACKEND_URL}/api/call/voice`, // Aligned with your request
      to: formattedTo,
      from: callerId,
      record: true, 
    });

    // Save initial call record
    await prisma.call.create({
      data: {
        sid: call.sid,
        agentId,
        leadId,
        phone: phoneNumber,
        status: 'ringing'
      }
    });

    res.json({ success: true, callSid: call.sid });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. VOICE WEBHOOK (TWIML GENERATOR)
const handleVoiceWebhook = (req, res) => {
  console.log("Incoming Twilio request body:", req.body);
  console.log("Incoming Twilio query:", req.query);
  
  try {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();

    // Get number from ANY possible place
    let to = 
      req.body.To || 
      req.body.to || 
      req.query.To || 
      req.query.to;

    console.log("Extracted target number:", to);

    // Fallback for testing as requested
    if (!to) {
      console.log("No number provided, using fallback: +919121605226");
      to = "+919121605226"; 
    }

    // Ensure E.164 format
    if (to && !to.startsWith("+")) {
      to = `+91${to}`;
    }

    const isMonitor = req.body.isMonitor === 'true' || req.query.isMonitor === 'true';

    const dial = twiml.dial({
      callerId: process.env.TWILIO_PHONE_NUMBER,
      record: isMonitor ? false : 'record-from-answer',
      recordingStatusCallback: isMonitor ? null : `${process.env.BACKEND_URL}/api/call/webhook/recording`,
      statusCallback: `${process.env.BACKEND_URL}/api/call/webhook/status`
    });

    // Use a unique Conference room per call for monitoring support
    const conferenceName = `call_${to.replace('+', '')}`;

    if (!isMonitor) {
      // TRIGGER THE OUTBOUND CALL TO THE CUSTOMER
      // This is what makes the customer's phone actually ring
      client.calls.create({
        to: to,
        from: process.env.TWILIO_PHONE_NUMBER,
        twiml: `<Response><Dial><Conference startConferenceOnEnter="true" endConferenceOnExit="true">${conferenceName}</Conference></Dial></Response>`
      }).catch(err => console.error("Outbound Call Error:", err));
    }

    dial.conference({
      muted: isMonitor, // SILENT LISTEN if manager
      startConferenceOnEnter: !isMonitor,
      endConferenceOnExit: !isMonitor,
      statusCallback: `${process.env.BACKEND_URL}/api/call/webhook/status`,
      statusCallbackEvent: 'start end join leave',
    }, conferenceName);

    res.set("Content-Type", "text/xml");
    return res.status(200).send(twiml.toString());
  } catch (error) {
    console.error("Voice webhook error:", error);

    res.set("Content-Type", "text/xml");
    return res.status(500).send(`
      <Response>
        <Say>Application error occurred</Say>
      </Response>
    `);
  }
};

// 4. STATUS CALLBACK WEBHOOK (STATE UPDATES)
const handleStatusWebhook = async (req, res) => {
  const { CallSid, CallStatus, CallDuration } = req.body;

  try {
    await prisma.call.update({
      where: { sid: CallSid },
      data: { 
        status: CallStatus,
        duration: parseInt(CallDuration) || 0
      }
    });

    // DAY 8: AUTO TASK CREATION FOR MISSED CALLS
    const missedStatuses = ['no-answer', 'failed', 'busy', 'canceled'];
    if (missedStatuses.includes(CallStatus)) {
      const call = await prisma.call.findUnique({ where: { sid: CallSid } });
      if (call) {
        await prisma.task.create({
          data: {
            title: `Missed Call Follow-up: ${call.phone}`,
            description: `Automated task created due to ${CallStatus} status. Please retry at the earliest.`,
            type: 'MISSED_CALL',
            priority: 'HIGH',
            userId: call.agentId,
            leadId: call.leadId
          }
        });
        console.log(`AUTOMATION: Created follow-up task for ${call.phone} (Status: ${CallStatus})`);
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).send(error.message);
  }
};

// 5. RECORDING CALLBACK WEBHOOK
const handleRecordingWebhook = async (req, res) => {
  const { CallSid, RecordingUrl } = req.body;

  try {
    await prisma.call.update({
      where: { sid: CallSid },
      data: { recordingUrl: RecordingUrl }
    });
    res.status(200).send('OK');
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// 6. TAG & NOTES API
const tagCall = async (req, res) => {
  const { callSid, tags, notes } = req.body;
  try {
    const updatedCall = await prisma.call.update({
      where: { sid: callSid },
      data: { tags, notes },
      include: { lead: true }
    });

    // If the call is linked to a lead, update the lead's status too
    if (updatedCall.leadId) {
      await prisma.lead.update({
        where: { id: updatedCall.leadId },
        data: { status: tags } // Sync lead status with call disposition
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. CALL HISTORY API
const getCallHistory = async (req, res) => {
  const agentId = parseInt(req.params.agentId);
  try {
    const history = await prisma.call.findMany({
      where: { agentId },
      include: { lead: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7.5 GET ACTIVE CALLS (FOR MANAGERS)
const getActiveCalls = async (req, res) => {
  try {
    const activeCalls = await prisma.call.findMany({
      where: {
        status: { in: ['ringing', 'in-progress'] }
      },
      include: { 
        agent: { select: { name: true } },
        lead: { select: { customerName: true } }
      }
    });
    res.json({ success: true, data: activeCalls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. LIVE MONITORING (SILENT LISTEN)
const monitorCall = (req, res) => {
  const { phone } = req.query; // The number of the active call to monitor
  try {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();

    const dial = twiml.dial();
    dial.conference({
      muted: true, // SILENT LISTEN
      startConferenceOnEnter: false,
      endConferenceOnExit: false
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
  monitorCall,
  getActiveCalls
};
