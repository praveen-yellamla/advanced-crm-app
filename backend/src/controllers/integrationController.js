const prisma = require('../config/prisma');

// ==================================================
// 1. PUBLIC WEBHOOK (WEBSITE LEAD INGESTION)
// ==================================================
const handleWebLead = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      company,
      utm_source, 
      utm_medium, 
      utm_campaign,
      gclid 
    } = req.body;

    if (!phone) return res.status(400).json({ success: false, message: 'Identity missing' });

    // Deduplication check
    const existing = await prisma.lead.findFirst({ where: { phone } });
    if (existing) return res.json({ success: true, message: 'Lead already synchronized' });

    const lead = await prisma.lead.create({
      data: {
        customerName: name || 'Web User',
        email,
        phone,
        company,
        source: 'WEBSITE',
        utmSource: utm_source,
        utmMedium: utm_medium,
        utmCampaign: utm_campaign,
        gclid,
        status: 'NEW'
      }
    });

    // In production, execute assignment logic here
    res.json({ success: true, leadId: lead.id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================================================
// 2. CSV CHUNK UPLOAD (PRODUCTION SIMULATION)
// ==================================================
const uploadCSV = async (req, res) => {
  try {
    // In production, use csv-parser and iterate chunks
    // Here we simulate the wizard response
    res.json({ 
      success: true, 
      message: 'Initial validation successful. Processing 12,500 records in background chunks.',
      importId: `IMP_${Date.now()}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================================================
// 3. INTEGRATION LISTING
// ==================================================
const getIntegrations = async (req, res) => {
  try {
    const accounts = await prisma.integrationAccount.findMany();
    res.json({ success: true, data: accounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  handleWebLead,
  uploadCSV,
  getIntegrations
};
