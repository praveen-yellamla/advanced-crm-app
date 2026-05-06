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
 * 1. GENERATE ACCESS TOKEN
 */
const getCallToken = async (req, res) => {
  try {
    const identity = req.user.id.toString();
    console.log(`TELEPHONY TOKEN: Generating for identity: ${identity}`);
    
    const accessToken = new twilio.jwt.AccessToken(accountSid, apiKey, apiSecret, { identity });
    const voiceGrant = new twilio.jwt.AccessToken.VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: true
    });
    
    accessToken.addGrant(voiceGrant);
    res.json({ success: true, token: accessToken.toJwt() });
  } catch (error) {
    console.error("TELEPHONY TOKEN ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 2. MASTER VOICE WEBHOOK (TwiML GENERATOR)
 * CRITICAL: This must return valid XML every time.
 */
const handleVoiceWebhook = async (req, res) => {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();
  
  // Twilio sends data in POST body or Query
  const params = { ...req.query, ...req.body };
  const { To, From, CallSid, isMonitor, agentId, leadId } = params;

  console.log(`--- VOICE WEBHOOK START ---`);
  console.log(`SID: ${CallSid}`);
  console.log(`To: ${To}`);
  console.log(`From: ${From}`);
  console.log(`Params:`, params);

  try {
    // A. SILENT MONITORING (MANAGER LISTENING)
    if (isMonitor === 'true' || isMonitor === true) {
      console.log(`TELEPHONY: Entering MONITOR mode for ${To}`);
      const dial = twiml.dial();
      dial.conference({
        muted: true,
        startConferenceOnEnter: false,
        endConferenceOnExit: false,
        beep: 'false'
      }, `conf_${To.replace(/[^a-zA-Z0-9]/g, '')}`);
      
      res.type('text/xml');
      return res.send(twiml.toString());
    }

    // B. INCOMING CALL TO TWILIO NUMBER
    if (To === callerId) {
      console.log(`TELEPHONY: Handling INCOMING call to ${callerId}`);
      const dial = twiml.dial({ 
        timeout: 20,
        record: 'record-from-answer'
      });
      dial.client('broadcast_all');
      
      res.type('text/xml');
      return res.send(twiml.toString());
    }

    // C. OUTGOING CALL FROM BROWSER
    // This is the leg from the AGENT browser to Twilio
    if (To && To !== callerId) {
      const cleanTo = formatToE164(To);
      console.log(`TELEPHONY: Handling OUTGOING call from Browser to ${cleanTo}`);

      // We bridge via Conference to enable monitoring
      const conferenceName = `conf_${cleanTo.replace(/[^a-zA-Z0-9]/g, '')}`;
      const baseUrl = (process.env.BACKEND_URL || '').replace(/\/$/, '');

      // 1. Log the call start in DB
      await prisma.call.create({
        data: {
          sid: CallSid,
          from: callerId,
          phone: cleanTo,
          status: 'initiated',
          agentId: agentId ? parseInt(agentId) : (req.user ? req.user.id : 1),
          leadId: leadId ? parseInt(leadId) : null,
          type: 'OUTBOUND'
        }
      }).catch(err => console.error("DB Log Error (Non-Fatal):", err));

      // 2. Put the Agent in the Conference
      const dial = twiml.dial({
        record: 'record-from-answer',
        recordingStatusCallback: `${baseUrl}/api/call/recording`
      });
      
      dial.conference({
        startConferenceOnEnter: true,
        endConferenceOnExit: true,
        statusCallback: `${baseUrl}/api/call/status`,
        statusCallbackEvent: ['start', 'end', 'join', 'leave']
      }, conferenceName);

      // 3. TRIGGER CUSTOMER LEG ASYNCHRONOUSLY
      // We call the customer and put them in the SAME conference
      console.log(`TELEPHONY: Triggering customer leg for ${cleanTo} via conference ${conferenceName}`);
      
      const customerTwiML = `<Response><Dial><Conference startConferenceOnEnter="true" endConferenceOnExit="true" statusCallback="${baseUrl}/api/call/status">${conferenceName}</Conference></Dial></Response>`;
      
      client.calls.create({
        to: cleanTo,
        from: callerId,
        twiml: customerTwiML,
        statusCallback: `${baseUrl}/api/call/status`,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
      }).then(call => {
        console.log(`TELEPHONY: Customer leg initiated successfully. SID: ${call.sid}`);
      }).catch(err => {
        console.error("TELEPHONY: Customer leg CRITICAL FAILURE:", {
          message: err.message,
          code: err.code,
          moreInfo: err.moreInfo
        });
        // If the customer leg fails (e.g. trial restrictions), we should probably end the agent leg too?
        // For now, logging is key.
      });

      res.type('text/xml');
      const xml = twiml.toString();
      console.log(`TwiML Response to Agent:\n${xml}`);
      return res.send(xml);
    }

    // D. FALLBACK (Empty response if nothing matches)
    console.warn(`TELEPHONY: Webhook fallback - no matching logic for To: ${To}`);
    res.type('text/xml');
    return res.send('<Response><Say>Communication node active. No destination specified.</Say></Response>');

  } catch (error) {
    console.error("TELEPHONY FATAL WEBHOOK ERROR:", error);
    res.type('text/xml');
    return res.send('<Response><Say>System internal error. Please retry.</Say></Response>');
  }
};

/**
 * 3. INITIATE OUTGOING CALL (CLICK-TO-CALL VIA API)
 */
const initiateOutgoingCall = async (req, res) => {
  const { phoneNumber, leadId } = req.body;
  const agentId = req.user.id;

  if (!isValidPhone(phoneNumber)) {
    return res.status(400).json({ success: false, message: "Invalid phone format." });
  }

  const formattedTo = formatToE164(phoneNumber);

  try {
    console.log(`TELEPHONY: API Triggered call from Agent ${agentId} to ${formattedTo}`);
    const call = await client.calls.create({
      url: `${process.env.BACKEND_URL}/api/call/voice?To=${encodeURIComponent(formattedTo)}&leadId=${leadId}&agentId=${agentId}`,
      to: `client:${agentId}`,
      from: callerId,
    });

    res.json({ success: true, callSid: call.sid });
  } catch (error) {
    console.error("TELEPHONY API CALL ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 4. STATUS CALLBACK
 */
const handleStatusWebhook = async (req, res) => {
  const { CallSid, CallStatus, CallDuration, To, From } = req.body;
  console.log(`TELEPHONY STATUS: ${CallStatus} | SID: ${CallSid} | Target: ${To}`);

  try {
    // Update call status in DB
    const updated = await prisma.call.updateMany({
      where: { 
        OR: [
          { sid: CallSid },
          { phone: To, status: { in: ['initiated', 'ringing', 'queued'] } }
        ]
      },
      data: { 
        status: CallStatus.toLowerCase(),
        duration: CallDuration ? parseInt(CallDuration) : undefined
      }
    });

    // Handle Missed Calls
    if (['no-answer', 'failed', 'busy'].includes(CallStatus.toLowerCase())) {
      console.log(`TELEPHONY: Call failed/missed. Creating task.`);
      const callData = await prisma.call.findFirst({
        where: { OR: [{ sid: CallSid }, { phone: To }] },
        orderBy: { createdAt: 'desc' }
      });

      if (callData && callData.leadId) {
        await prisma.task.create({
          data: {
            title: `Missed Call Follow-up: ${callData.phone}`,
            description: `Automated follow-up. Reason: ${CallStatus}`,
            type: 'FOLLOW_UP',
            priority: 'HIGH',
            userId: callData.agentId,
            leadId: callData.leadId
          }
        }).catch(e => console.error("Task Creation Error:", e));
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('TELEPHONY STATUS ERROR:', error);
    res.status(200).send('OK');
  }
};

/**
 * 5. RECORDING & OTHER HELPERS
 */
const handleRecordingWebhook = async (req, res) => {
  const { CallSid, RecordingUrl } = req.body;
  console.log(`TELEPHONY RECORDING: ${RecordingUrl} | SID: ${CallSid}`);
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

const tagCall = async (req, res) => {
  const { callSid, tags, notes } = req.body;
  try {
    const call = await prisma.call.findFirst({
      where: { OR: [
        { sid: callSid }, 
        { id: parseInt(callSid) || -1 },
        { phone: callSid, status: 'completed' }
      ] },
      orderBy: { createdAt: 'desc' }
    });

    if (!call) return res.status(404).json({ success: false, message: "Call record not found" });

    const updatedCall = await prisma.call.update({
      where: { id: call.id },
      data: { tags, notes }
    });

    if (updatedCall.leadId) {
      await prisma.lead.update({ where: { id: updatedCall.leadId }, data: { status: tags } });
      await prisma.activityLog.create({
        data: {
          leadId: updatedCall.leadId,
          userId: req.user.id,
          type: 'CALL',
          action: `Disposition: ${tags}`,
          details: notes
        }
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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

const getActiveCalls = async (req, res) => {
  try {
    const activeCalls = await prisma.call.findMany({
      where: { status: { in: ['initiated', 'ringing', 'in-progress', 'answered'] } },
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
    
    const conferenceName = `conf_${phone.replace(/[^a-zA-Z0-9]/g, '')}`;
    console.log(`TELEPHONY: Manager monitoring conference: ${conferenceName}`);

    dial.conference({
      muted: true,
      startConferenceOnEnter: false,
      endConferenceOnExit: false,
      beep: 'false'
    }, conferenceName);

    res.type('text/xml');
    res.status(200).send(twiml.toString());
  } catch (error) {
    console.error("MONITOR CALL ERROR:", error);
    res.status(500).send(error.message);
  }
};

const validateTelephonyConfig = async (req, res) => {
  const config = {
    accountSid: !!process.env.TWILIO_ACCOUNT_SID,
    authToken: !!process.env.TWILIO_AUTH_TOKEN,
    apiKey: !!process.env.TWILIO_API_KEY,
    apiSecret: !!process.env.TWILIO_API_SECRET,
    twimlAppSid: !!process.env.TWILIO_TWIML_APP_SID,
    phoneNumber: !!process.env.TWILIO_PHONE_NUMBER,
    backendUrl: !!process.env.BACKEND_URL
  };

  const missing = Object.keys(config).filter(k => !config[k]);
  
  if (missing.length > 0) {
    console.error("TELEPHONY CONFIG ERROR: Missing variables:", missing);
    return res.status(500).json({ success: false, message: `Missing config: ${missing.join(', ')}` });
  }

  try {
    // Test client connectivity
    await client.api.accounts(accountSid).fetch();
    res.json({ success: true, message: "Telephony configuration validated and online." });
  } catch (error) {
    console.error("TELEPHONY CONNECTIVITY ERROR:", error);
    res.status(500).json({ success: false, message: `Twilio Connectivity Failed: ${error.message}` });
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
  monitorCall,
  validateTelephonyConfig
};
