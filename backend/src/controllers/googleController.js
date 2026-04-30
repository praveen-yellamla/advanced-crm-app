const prisma = require('../config/prisma');
const axios = require('axios');
const { google } = require('googleapis');
const { assignLeadRoundRobin } = require('../utils/assignmentService');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

// ==================================================
// 1. INITIATE OAUTH
// ==================================================
const initiateGoogleAuth = async (req, res) => {
  const scope = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/adwords' // Adding AdWords scope for future use
  ];

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
    `client_id=${GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scope.join(' '))}&` +
    `access_type=offline&` +
    `prompt=consent`;

  res.redirect(authUrl);
};

// ==================================================
// 2. CALLBACK HANDLER
// ==================================================
const googleCallback = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL}/admin/settings?integration=google&status=error&message=NoCode`);
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Fetch User Info
    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const { email, name } = userResponse.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    // Save or Update in DB
    await prisma.googleAccount.upsert({
      where: { email },
      update: {
        accessToken: access_token,
        refreshToken: refresh_token || undefined, // Refresh token is only sent on first consent
        expiresAt,
        name
      },
      create: {
        email,
        name,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt
      }
    });

    res.redirect(`${process.env.FRONTEND_URL}/admin/settings?integration=google&status=success`);
  } catch (error) {
    console.error('Google OAuth Error:', error.response?.data || error.message);
    res.redirect(`${process.env.FRONTEND_URL}/admin/settings?integration=google&status=error`);
  }
};

// ==================================================
// 3. GET STATUS
// ==================================================
const getGoogleStatus = async (req, res) => {
  try {
    const account = await prisma.googleAccount.findFirst();
    if (!account) {
      return res.json({ success: true, connected: false });
    }

    res.json({ 
      success: true, 
      connected: true, 
      email: account.email,
      name: account.name
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================================================
// 4. TEST & REFRESH
// ==================================================
const testGoogleIntegration = async (req, res) => {
  try {
    let account = await prisma.googleAccount.findFirst();
    if (!account) return res.status(404).json({ success: false, message: 'No account linked' });

    // Check if expired
    if (new Date() >= new Date(account.expiresAt)) {
      console.log('Token expired, refreshing...');
      const refreshResponse = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: account.refreshToken,
        grant_type: 'refresh_token'
      });

      const { access_token, expires_in } = refreshResponse.data;
      const expiresAt = new Date(Date.now() + expires_in * 1000);

      account = await prisma.googleAccount.update({
        where: { id: account.id },
        data: { accessToken: access_token, expiresAt }
      });
    }

    // Call userinfo as test
    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${account.accessToken}` }
    });

    res.json({ success: true, data: userResponse.data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.response?.data || error.message });
  }
};

// ==================================================
// 5. DISCONNECT
// ==================================================
const disconnectGoogle = async (req, res) => {
  try {
    await prisma.googleAccount.deleteMany(); // Since we only support one main admin account for now
    res.json({ success: true, message: 'Integration terminated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================================================
// 6. FETCH LEADS (NEW)
// ==================================================
const fetchGoogleLeads = async (req, res) => {
  try {
    let account = await prisma.googleAccount.findFirst();
    if (!account) return res.status(404).json({ success: false, message: 'No account linked' });

    // Refresh if needed
    if (new Date() >= new Date(account.expiresAt)) {
      const refreshResponse = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: account.refreshToken,
        grant_type: 'refresh_token'
      });
      const { access_token, expires_in } = refreshResponse.data;
      account = await prisma.googleAccount.update({
        where: { id: account.id },
        data: { accessToken: access_token, expiresAt: new Date(Date.now() + expires_in * 1000) }
      });
    }

    // SIMULATION: In a real scenario, we would call the Google Ads API
    const mockLeads = [
      { name: 'John Google', email: 'john.g@example.com', phone: '+1555111222', source: 'GOOGLE_ADS', status: 'NEW' },
      { name: 'Sarah Search', email: 'sarah.s@example.com', phone: '+1555333444', source: 'GOOGLE_ADS', status: 'NEW' },
      { name: 'Aditya Ads', email: 'aditya.a@example.com', phone: '+9199887766', source: 'GOOGLE_ADS', status: 'NEW' },
      { name: 'Mike Marketing', email: 'mike.m@example.com', phone: '+4477889900', source: 'GOOGLE_ADS', status: 'NEW' },
      { name: 'Emma Engel', email: 'emma.e@example.com', phone: '+49176123456', source: 'GOOGLE_ADS', status: 'NEW' }
    ];

    // Fetch agents for distribution
    const agents = await prisma.user.findMany({ where: { role: 'AGENT', isActive: true }, select: { id: true } });

    // Filter out existing emails
    const existingLeads = await prisma.lead.findMany({
      where: { email: { in: mockLeads.map(l => l.email) } },
      select: { email: true }
    });
    const existingEmails = new Set(existingLeads.map(l => l.email));
    
    const newLeads = mockLeads
      .filter(l => !existingEmails.has(l.email))
      .map((l, index) => ({
        customerName: l.name,
        email: l.email,
        phone: l.phone,
        source: l.source,
        status: l.status,
        assignedToId: agents.length > 0 ? agents[index % agents.length].id : null
      }));

    if (newLeads.length > 0) {
      await prisma.lead.createMany({ data: newLeads });
    }

    res.json({ 
      success: true, 
      inserted: newLeads.length,
      skipped: mockLeads.length - newLeads.length,
      message: `${newLeads.length} new leads synchronized and assigned.` 
    });
  } catch (error) {
    console.error('Fetch Leads Error:', error.message);
    res.status(500).json({ success: false, message: 'Lead synchronization failed' });
  }
};

module.exports = {
  initiateGoogleAuth,
  googleCallback,
  getGoogleStatus,
  testGoogleIntegration,
  disconnectGoogle,
  fetchGoogleLeads
};
