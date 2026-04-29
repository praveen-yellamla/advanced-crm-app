const prisma = require('../config/prisma');
const csv = require('csv-parser');
const stream = require('stream');

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

const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

// ==================================================
// 2. CSV CHUNK UPLOAD
// ==================================================
const uploadCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Identity missing: No dataset detected' });
    }

    const mapping = req.body.mapping ? JSON.parse(req.body.mapping) : null;
    const allRows = [];
    
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    // Phase 1: Parse all rows into an array
    await new Promise((resolve, reject) => {
      bufferStream
        .pipe(csv())
        .on('data', (row) => allRows.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    console.log("Total rows:", allRows.length);

    if (allRows.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid rows found' });
    }

    // Phase 2: Fetch existing identities for deduplication
    const existingLeads = await prisma.lead.findMany({
      select: { email: true, phone: true }
    });
    
    const existingEmails = new Set(existingLeads.map(l => l.email?.toLowerCase().trim()).filter(Boolean));
    const existingPhones = new Set(existingLeads.map(l => l.phone?.trim()).filter(Boolean));

    const newLeads = [];
    const duplicates = [];
    const errors = [];

    // Phase 3: Classification Loop
    allRows.forEach((row, index) => {
      let name, email, phone;

      if (mapping) {
        name = row[mapping.name]?.trim();
        email = row[mapping.email]?.toLowerCase().trim();
        phone = row[mapping.phone]?.toString().trim();
      } else {
        name = (row.Name || row.name || row['Full Name'])?.trim();
        email = (row.Email || row.email)?.toLowerCase().trim();
        phone = (row.Phone || row.phone || row['Phone Number'])?.toString().trim();
      }

      // 1. VALIDATION
      if (!name || !phone) {
        errors.push({
          row: index + 1,
          customerName: name || 'N/A',
          phone: phone || 'N/A',
          reason: "Missing required fields: Name and Phone are mandatory"
        });
        return;
      }

      // 2. DUPLICATE CHECK
      const exists = (email && existingEmails.has(email)) || (phone && existingPhones.has(phone));

      if (exists) {
        duplicates.push({
          row: index + 1,
          customerName: name,
          email: email,
          phone: phone,
          reason: "Duplicate email or phone already exists in Registry"
        });
        return;
      }

      // 3. NEW LEAD
      newLeads.push({
        customerName: name,
        email: email || null,
        phone: phone,
        source: "CSV",
        status: "NEW"
      });

      // Optimistically add to sets to catch duplicates within the same CSV
      if (email) existingEmails.add(email);
      if (phone) existingPhones.add(phone);
    });

    console.log("Inserted:", newLeads.length);
    console.log("Duplicates:", duplicates.length);
    console.log("Errors:", errors.length);

    // Phase 4: Persistence
    let insertedCount = 0;
    if (newLeads.length > 0) {
      const result = await prisma.lead.createMany({
        data: newLeads,
        skipDuplicates: true
      });
      insertedCount = result.count;
    }

    // Phase 5: Response
    res.json({
      success: true,
      total: allRows.length,
      inserted: insertedCount,
      duplicates: duplicates.length,
      errors: errors.length,
      duplicateRows: duplicates,
      errorRows: errors,
      message: `Sync Complete: ${insertedCount} Nodes Ingested | ${duplicates.length} Deduplicated | ${errors.length} Logic Errors`
    });

  } catch (error) {
    console.error('Import Engine Error:', error);
    res.status(500).json({ success: false, message: 'Import Engine Breakdown', details: error.message });
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
