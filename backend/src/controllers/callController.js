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
  const response = new twilio.twiml.VoiceResponse();
  const dial = response.dial({ 
    callerId,
    record: 'record-from-answer',
    recordingStatusCallback: `${process.env.BACKEND_URL}/api/call/webhook/recording`
  });
  
  // If we have a 'To' number in the request, dial it
  let to = req.body.To;

  if (to) {
    const formattedTo = formatToE164(to);
    console.log("DIALING E.164 (Webhook):", formattedTo);
    dial.number(formattedTo);
  } else {
    response.say("Infrastructure Error: Destination missing.");
  }

  res.type('text/xml');
  res.send(response.toString());
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
    if (CallStatus === 'no-answer' || CallStatus === 'failed') {
      const call = await prisma.call.findUnique({ where: { sid: CallSid } });
      if (call) {
        await prisma.task.create({
          data: {
            title: `Missed Call Follow-up: ${call.phone}`,
            description: `Automated task created due to ${CallStatus} status.`,
            type: 'MISSED_CALL',
            userId: call.agentId,
            leadId: call.leadId
          }
        });
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
    await prisma.call.update({
      where: { sid: callSid },
      data: { tags, notes }
    });
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

module.exports = {
  getCallToken,
  initiateOutgoingCall,
  handleVoiceWebhook,
  handleStatusWebhook,
  handleRecordingWebhook,
  tagCall,
  getCallHistory
};
