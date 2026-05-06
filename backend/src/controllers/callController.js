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
const handleVoiceWebhook = async (req, res) => {
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
    const conferenceName = `call_${to.replace('+', '')}`;

    // DAY 7: MASTER LOG CREATION
    if (!isMonitor && req.body.CallSid) {
      try {
        const agentId = req.query.agentId || req.body.agentId;
        const leadId = req.query.leadId || req.body.leadId;

        await prisma.call.upsert({
          where: { sid: req.body.CallSid },
          update: {
            status: 'ringing',
            leadId: leadId ? parseInt(leadId) : null,
          },
          create: {
            sid: req.body.CallSid,
            from: req.body.From || process.env.TWILIO_PHONE_NUMBER,
            phone: to,
            status: 'ringing',
            agentId: agentId ? parseInt(agentId) : 1, // Fallback to system agent
            leadId: leadId ? parseInt(leadId) : null,
          }
        });
      } catch (logError) {
        console.error("Master logging failed:", logError);
      }
    }

    if (!isMonitor) {
      // TRIGGER OUTBOUND TO CUSTOMER
      client.calls.create({
        to: to,
        from: process.env.TWILIO_PHONE_NUMBER,
        twiml: `<Response><Dial><Conference startConferenceOnEnter="true" endConferenceOnExit="true">${conferenceName}</Conference></Dial></Response>`,
        // Important: We use the SAME status callback to track the customer side too
        statusCallback: `${process.env.BACKEND_URL}/api/call/webhook/status`,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
      }).catch(err => console.error("Outbound Call Error:", err));
    }

    dial.conference({
      muted: isMonitor,
      startConferenceOnEnter: !isMonitor,
      endConferenceOnExit: !isMonitor,
      statusCallback: `${process.env.BACKEND_URL}/api/call/webhook/status`,
      statusCallbackEvent: 'start end join leave',
    }, conferenceName);

    res.set("Content-Type", "text/xml");
    return res.status(200).send(twiml.toString());
  } catch (error) {
    console.error("FATAL Voice Webhook Error:", error);
    
    // FAIL-SAFE: Always return valid TwiML to Twilio
    res.set("Content-Type", "text/xml");
    return res.status(200).send(`
      <Response>
        <Say>System temporarily unavailable. Please try again.</Say>
      </Response>
    `);
  }
};

// 4. STATUS CALLBACK WEBHOOK (STATE UPDATES)
const handleStatusWebhook = async (req, res) => {
  const { CallSid, CallStatus, CallDuration, To } = req.body;
  console.log(`WEBHOOK: Status ${CallStatus} for ${CallSid} (To: ${To})`);

  try {
    const call = await prisma.call.findUnique({ where: { sid: CallSid } });

    if (call) {
      await prisma.call.update({
        where: { sid: CallSid },
        data: { 
          status: CallStatus,
          duration: parseInt(CallDuration) || call.duration
        }
      });
    } else {
      const masterCall = await prisma.call.findFirst({
        where: { phone: To, status: 'ringing' },
        orderBy: { createdAt: 'desc' }
      });

      if (masterCall) {
        await prisma.call.update({
          where: { id: masterCall.id },
          data: { 
            status: CallStatus,
            duration: parseInt(CallDuration) || 0
          }
        });
      }
    }

    // DAY 8: AUTO TASK CREATION FOR MISSED CALLS
    const missedStatuses = ['no-answer', 'failed', 'busy', 'canceled'];
    if (missedStatuses.includes(CallStatus)) {
      const callData = await prisma.call.findFirst({
        where: { OR: [{ sid: CallSid }, { phone: To }] },
        orderBy: { createdAt: 'desc' }
      });

      if (callData && callData.leadId) {
        // Prevent duplicate tasks for the same logical call within 1 minute
        const existingTask = await prisma.task.findFirst({
          where: { 
            leadId: callData.leadId,
            type: 'MISSED_CALL',
            createdAt: { gte: new Date(Date.now() - 60000) } 
          }
        });

        if (!existingTask) {
          await prisma.task.create({
            data: {
              title: `Missed Call: ${callData.phone}`,
              description: `Automated follow-up due to ${CallStatus} status.`,
              type: 'MISSED_CALL',
              priority: 'HIGH',
              userId: callData.agentId,
              leadId: callData.leadId
            }
          });
          console.log(`AUTOMATION: Task created for missed call to ${callData.phone}`);
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('WEBHOOK ERROR (Status):', error);
    // FAIL-SAFE: Always return 200 to Twilio to stop retries/errors
    return res.status(200).send('OK (Handled with Error)');
  }
};

// 5. RECORDING CALLBACK WEBHOOK
const handleRecordingWebhook = async (req, res) => {
  const { CallSid, RecordingUrl } = req.body;
  console.log(`WEBHOOK: Recording for ${CallSid}: ${RecordingUrl}`);

  try {
    if (CallSid) {
      await prisma.call.update({
        where: { sid: CallSid },
        data: { recordingUrl: RecordingUrl }
      });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('WEBHOOK ERROR (Recording):', error);
    // FAIL-SAFE: Always return 200
    return res.status(200).json({ success: false, error: 'Internal logging error' });
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

    if (updatedCall.leadId) {
      await prisma.lead.update({
        where: { id: updatedCall.leadId },
        data: { status: tags }
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

const getAllCalls = async (req, res) => {
  try {
    const history = await prisma.call.findMany({
      include: { 
        lead: true,
        agent: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. LIVE MONITORING (FOR MANAGERS)
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

const monitorCall = (req, res) => {
  const { phone } = req.query;
  try {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();
    const dial = twiml.dial();
    dial.conference({
      muted: true,
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
  getAllCalls,
  getActiveCalls,
  monitorCall
};
