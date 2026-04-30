const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { assignLeadRoundRobin } = require('../utils/assignmentService');

/**
 * Lead Ingestion Webhook
 * POST /api/webhooks/leads
 * Used by external systems (Zapier, Meta, Custom Sites) to push leads into the CRM.
 */
router.post('/leads', async (req, res) => {
  try {
    const { name, email, phone, source = 'WEBSITE' } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: "Required fields missing: name and phone are mandatory." 
      });
    }

    // Auto-assign lead using round-robin
    const assignedToId = await assignLeadRoundRobin();

    // Create the lead
    const lead = await prisma.lead.create({
      data: {
        customerName: name,
        email: email || null,
        phone: phone,
        source: source,
        assignedToId: assignedToId,
        status: 'NEW'
      }
    });

    console.log(`[WEBHOOK] New lead created: ${lead.customerName} (Assigned: ${assignedToId})`);

    res.status(201).json({
      success: true,
      message: "Lead successfully ingested and assigned.",
      leadId: lead.id,
      assignedToId: assignedToId
    });

  } catch (error) {
    console.error("[WEBHOOK ERROR]", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error during lead ingestion." 
    });
  }
});

/**
 * Meta Ads Simulation API
 * GET /api/webhooks/test-lead
 * Simulates a lead coming from Meta Ads.
 */
router.get('/test-lead', async (req, res) => {
  try {
    const fakeLead = {
      name: `Meta Test ${Math.floor(Math.random() * 1000)}`,
      email: `meta.test.${Date.now()}@example.com`,
      phone: `99${Math.floor(10000000 + Math.random() * 90000000)}`,
      source: 'META'
    };

    const assignedToId = await assignLeadRoundRobin();

    const lead = await prisma.lead.create({
      data: {
        customerName: fakeLead.name,
        email: fakeLead.email,
        phone: fakeLead.phone,
        source: fakeLead.source,
        assignedToId: assignedToId,
        status: 'NEW'
      }
    });

    res.json({
      success: true,
      message: "Meta Ads lead simulated successfully.",
      lead
    });
  } catch (error) {
    console.error("[META SIM ERROR]", error);
    res.status(500).json({ success: false, message: "Simulation failed." });
  }
});

module.exports = router;
