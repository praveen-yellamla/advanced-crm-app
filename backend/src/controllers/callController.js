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

// Active Outbound Call Map: AgentCallSid <-> CustomerCallSid
const activeOutboundCalls = new Map();

/**
 * 2. MASTER VOICE WEBHOOK (TwiML GENERATOR)
 * CRITICAL: This must return valid XML every time.
 */
const handleVoiceWebhook = async (req, res) => {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();
  
  // Twilio sends data in POST body or Query
  const params = { ...req.query, ...req.body };
  const { From, CallSid, isMonitor, agentId, leadId, organizationId } = params;

  // Smart resolution of To: Prevent standard Twilio POST 'To' (like 'client:agentId')
  // from overwriting the custom customer phone number passed in query string 'To'
  let To = req.body.To;
  if (req.body.To && req.body.To.startsWith('client:')) {
    To = req.query.To || req.body.To;
  } else if (!req.body.To && req.query.To) {
    To = req.query.To;
  }

  console.log(`--- VOICE WEBHOOK START ---`);
  console.log(`SID: ${CallSid}`);
  console.log(`To (Resolved): ${To}`);
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
    if (To && To !== callerId && !To.startsWith('client:')) {
      const cleanTo = formatToE164(To);
      console.log(`TELEPHONY: Handling OUTGOING call from Browser to ${cleanTo}`);

      // We bridge via Conference to enable monitoring
      const conferenceName = `conf_${cleanTo.replace(/[^a-zA-Z0-9]/g, '')}`;
      const baseUrl = (process.env.BACKEND_URL || '').replace(/\/$/, '');

      // 1. Log the call start in DB with robust integer parsing
      const fallbackOrgId = 1;
      const parsedOrgId = (organizationId && !isNaN(parseInt(organizationId))) ? parseInt(organizationId) : (req.user?.organizationId || fallbackOrgId);
      const parsedAgentId = (agentId && !isNaN(parseInt(agentId))) ? parseInt(agentId) : (req.user?.id || 1);
      const parsedLeadId = (leadId && !isNaN(parseInt(leadId))) ? parseInt(leadId) : null;

      await prisma.call.create({
        data: {
          sid: CallSid,
          from: callerId,
          phone: cleanTo,
          status: 'Connecting',
          organizationId: parsedOrgId,
          agentId: parsedAgentId,
          leadId: parsedLeadId,
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
      }).then(customerCall => {
        console.log(`TELEPHONY: Customer leg initiated successfully. SID: ${customerCall.sid}`);
        if (CallSid) {
          activeOutboundCalls.set(CallSid, customerCall.sid); // Agent -> Customer
          activeOutboundCalls.set(customerCall.sid, CallSid); // Bidirectional
        }
      }).catch(err => {
        console.error("TELEPHONY: Customer leg CRITICAL FAILURE:", {
          message: err.message,
          code: err.code
        });
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
  const orgId = req.user.organizationId;

  if (!isValidPhone(phoneNumber)) {
    return res.status(400).json({ success: false, message: "Invalid phone format." });
  }

  const formattedTo = formatToE164(phoneNumber);

  try {
    console.log(`TELEPHONY: API Triggered call from Agent ${agentId} to ${formattedTo}`);
    const call = await client.calls.create({
      url: `${process.env.BACKEND_URL}/api/call/voice?To=${encodeURIComponent(formattedTo)}&leadId=${leadId}&agentId=${agentId}&organizationId=${orgId}`,
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
  console.log(`TELEPHONY STATUS WEBHOOK: SID=${CallSid}, Status=${CallStatus}, Duration=${CallDuration}`);

  try {
    // 1. If agent leg is completed or terminated, terminate the paired customer leg immediately
    if (['completed', 'failed', 'busy', 'no-answer', 'canceled'].includes(CallStatus.toLowerCase())) {
      const pairedSid = activeOutboundCalls.get(CallSid);
      if (pairedSid) {
        console.log(`TELEPHONY: Active call termination detected for leg ${CallSid}. Disconnecting paired leg ${pairedSid} immediately.`);
        try {
          await client.calls(pairedSid).update({ status: 'completed' });
        } catch (err) {
          // Silent catch
        }
        activeOutboundCalls.delete(CallSid);
        activeOutboundCalls.delete(pairedSid);
      }
    }

    // 2. Map Twilio call statuses to professional CRM Call Statuses
    const statusMap = {
      'queued': 'Connecting',
      'ringing': 'Ringing',
      'in-progress': 'Connected',
      'completed': 'Completed',
      'busy': 'Busy',
      'failed': 'Failed',
      'no-answer': 'No Answer',
      'canceled': 'Canceled'
    };

    const dbStatus = statusMap[CallStatus.toLowerCase()] || CallStatus;

    // 3. Update call status in DB (DO NOT restrict by req.user organizationId since webhooks are public)
    const updated = await prisma.call.updateMany({
      where: { 
        OR: [
          { sid: CallSid },
          { phone: To, status: { in: ['Connecting', 'Ringing', 'initiated', 'ringing', 'queued'] } }
        ]
      },
      data: { 
        status: dbStatus,
        duration: CallDuration ? parseInt(CallDuration) : undefined
      }
    });

    // Fetch the updated Call with relation context for real-time dispatching
    const callRecord = await prisma.call.findFirst({
      where: { OR: [{ sid: CallSid }, { phone: To }] },
      include: { 
        agent: { select: { name: true, teamId: true } }, 
        lead: { select: { customerName: true } } 
      },
      orderBy: { createdAt: 'desc' }
    });

    if (callRecord) {
      const { triggerRealtimeEvent, logActivity } = require('../utils/realtimeHelper');

      if (dbStatus === 'Connected') {
        triggerRealtimeEvent(`org_${callRecord.organizationId}`, 'call:started', callRecord);
        if (callRecord.agent?.teamId) {
          triggerRealtimeEvent(`team_${callRecord.agent.teamId}`, 'call:started', callRecord);
        }
      } else if (dbStatus === 'Completed') {
        triggerRealtimeEvent(`org_${callRecord.organizationId}`, 'call:ended', callRecord);
        if (callRecord.agent?.teamId) {
          triggerRealtimeEvent(`team_${callRecord.agent.teamId}`, 'call:ended', callRecord);
        }

        await logActivity({
          actorId: callRecord.agentId,
          actorRole: 'AGENT',
          action: 'call.completed',
          entityType: 'CALL',
          entityId: callRecord.id,
          newValue: { duration: callRecord.duration, phone: callRecord.phone },
          teamId: callRecord.agent?.teamId || null
        });
      }
    }

    // 4. Handle Missed Calls
    if (['no-answer', 'failed', 'busy'].includes(CallStatus.toLowerCase())) {
      console.log(`TELEPHONY: Call failed/missed. Creating follow-up task.`);
      const callData = await prisma.call.findFirst({
        where: { OR: [{ sid: CallSid }, { phone: To }] },
        orderBy: { createdAt: 'desc' }
      });

      if (callData && callData.leadId) {
        await prisma.task.create({
          data: {
            title: `Missed Call Follow-up: ${callData.phone}`,
            description: `Automated follow-up task triggered by missed or busy telephony attempt. Call status: ${dbStatus}`,
            type: 'FOLLOW_UP',
            priority: 'HIGH',
            assignedToId: callData.agentId,
            organizationId: callData.organizationId,
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
  const { callSid, tags, notes, leadId, phone, duration } = req.body;
  try {
    let call = await prisma.call.findFirst({
      where: { 
        organizationId: req.user.organizationId,
        OR: [
          { sid: callSid }, 
          { id: parseInt(callSid) || -1 },
          { phone: callSid, status: 'completed' }
        ] 
      },
      orderBy: { createdAt: 'desc' }
    });

    // If call isn't found (e.g. mocked call, or webhook delayed), create it
    if (!call) {
      call = await prisma.call.create({
        data: {
          organizationId: req.user.organizationId,
          agentId: req.user.id,
          sid: callSid || `manual_${Date.now()}`,
          phone: phone || 'Unknown',
          leadId: leadId ? parseInt(leadId) : null,
          status: 'completed',
          duration: duration ? parseInt(duration) : 0,
        }
      });
    }

    const updatedCall = await prisma.call.update({
      where: { id: call.id },
      data: { 
        tags, 
        notes,
        status: 'completed',
        duration: duration ? parseInt(duration) : call.duration
      }
    });

    if (updatedCall.leadId) {
      const validStatuses = ['NEW', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'QUALIFIED', 'WON', 'LOST'];
      if (validStatuses.includes(tags)) {
        await prisma.lead.update({ where: { id: updatedCall.leadId }, data: { status: tags } });
      }
      
      await prisma.leadActivity.create({
        data: {
          organizationId: req.user.organizationId,
          leadId: updatedCall.leadId,
          action: `Call Logged: ${tags} - ${notes ? notes.substring(0, 50) + '...' : ''}`
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
    const where = { organizationId: req.user.organizationId };
    if (agentId !== 'all') {
      where.agentId = parseInt(agentId);
    }

    const history = await prisma.call.findMany({
      where,
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
      where: { 
        organizationId: req.user.organizationId,
        status: { in: ['initiated', 'ringing', 'in-progress', 'answered'] } 
      },
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

const toggleHold = async (req, res) => {
  const { phone, hold } = req.body;
  try {
    const formattedTo = formatToE164(phone);
    const conferenceName = `conf_${formattedTo.replace(/[^a-zA-Z0-9]/g, '')}`;
    
    // Find conference
    const conferences = await client.conferences.list({ friendlyName: conferenceName, status: 'in-progress', limit: 1 });
    if (conferences.length === 0) return res.status(404).json({ success: false, message: 'Conference not found' });
    
    const confSid = conferences[0].sid;
    const participants = await client.conferences(confSid).participants.list();
    
    // Hold/unhold everyone except the agent
    for (const p of participants) {
      // Typically agent is first participant or we hold all
      await client.conferences(confSid).participants(p.callSid).update({ hold: hold === true });
    }
    
    // Log Activity only if leadId exists and is valid
    if (req.body.leadId && !isNaN(parseInt(req.body.leadId))) {
      await prisma.leadActivity.create({
        data: {
          organizationId: req.user.organizationId,
          leadId: parseInt(req.body.leadId),
          action: `Call ${hold ? 'Placed on Hold' : 'Resumed'}`
        }
      }).catch(err => console.error("LeadActivity Log Error:", err));
    }

    res.json({ success: true, hold });
  } catch (error) {
    console.error("TELEPHONY HOLD ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const toggleRecord = async (req, res) => {
  const { callSid, record } = req.body;
  try {
    // Twilio REST API to start/stop recording dynamically
    if (record) {
      await client.calls(callSid).recordings.create({ recordingStatusCallback: `${process.env.BACKEND_URL}/api/call/recording` });
    } else {
      const recordings = await client.calls(callSid).recordings.list({ status: 'in-progress' });
      for (const rec of recordings) {
        await client.calls(callSid).recordings(rec.sid).update({ status: 'stopped' });
      }
    }
    
    // Log Activity only if leadId exists and is valid
    if (req.body.leadId && !isNaN(parseInt(req.body.leadId))) {
      await prisma.leadActivity.create({
        data: {
          organizationId: req.user.organizationId,
          leadId: parseInt(req.body.leadId),
          action: `Call Recording ${record ? 'Started' : 'Stopped'}`
        }
      }).catch(err => console.error("LeadActivity Log Error:", err));
    }

    res.json({ success: true, record });
  } catch (error) {
    console.error("TELEPHONY RECORD ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const transferCall = async (req, res) => {
  const { phone, targetAgentPhone } = req.body;
  try {
    const formattedTo = formatToE164(phone);
    const conferenceName = `conf_${formattedTo.replace(/[^a-zA-Z0-9]/g, '')}`;
    
    // Add target agent to the conference
    const targetE164 = formatToE164(targetAgentPhone);
    await client.calls.create({
      to: targetE164,
      from: callerId,
      twiml: `<Response><Dial><Conference>${conferenceName}</Conference></Dial></Response>`
    });
    
    // Log Activity only if leadId exists and is valid
    if (req.body.leadId && !isNaN(parseInt(req.body.leadId))) {
      await prisma.leadActivity.create({
        data: {
          organizationId: req.user.organizationId,
          leadId: parseInt(req.body.leadId),
          action: `Call Transferred to ${targetE164}`
        }
      }).catch(err => console.error("LeadActivity Log Error:", err));
    }

    res.json({ success: true, message: 'Transfer initiated' });
  } catch (error) {
    console.error("TELEPHONY TRANSFER ERROR:", error);
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
  getCallHistory,
  getActiveCalls,
  monitorCall,
  validateTelephonyConfig,
  toggleHold,
  toggleRecord,
  transferCall
};
