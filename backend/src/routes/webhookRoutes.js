const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { assignLeadRoundRobin } = require('../utils/assignmentService');

/**
 * Lead Ingestion Webhook - PRODUCTION GRADE
 * POST /api/webhooks/leads
 * Used by external systems (Zapier, Meta, Custom Sites) to push leads into the CRM.
 */
router.post('/leads', async (req, res) => {
  try {
    const { name, email, phone, source = 'WEBHOOK' } = req.body;

    // 1. Mandatory Field Validation
    if (!email || !name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields. Name, Email, and Phone are all mandatory."
      });
    }

    // 2. Comprehensive Duplicate Check (Email OR Phone)
    // Both are unique in your Prisma schema, so we must check both to avoid P2002 errors.
    const existingLead = await prisma.lead.findFirst({
      where: {
        OR: [
          { email: email },
          { phone: phone }
        ]
      }
    });

    if (existingLead) {
      return res.status(200).json({
        success: true,
        message: "Lead already exists in the system",
        lead: existingLead
      });
    }

    // 3. Automated Agent Assignment
    const assignedToId = await assignLeadRoundRobin();

    // 4. Create Lead with Schema Mapping
    const newLead = await prisma.lead.create({
      data: {
        customerName: name, // Mapping input 'name' to schema 'customerName'
        email,
        phone,
        source,
        assignedToId: assignedToId,
        status: 'NEW'
      }
    });

    console.log(`[INGESTION SUCCESS] Lead ${name} assigned to Agent ID: ${assignedToId}`);

    return res.status(201).json({
      success: true,
      message: "Lead created successfully",
      lead: newLead
    });

  } catch (error) {
    // 5. Specialized Error Handling for Prisma Unique Constraints (P2002)
    // This prevents the server from returning 500 if a race condition occurs.
    if (error.code === 'P2002') {
      console.warn("[DUPLICATE PREVENTED]", error.meta?.target);
      return res.status(200).json({
        success: true,
        message: "Lead already exists (Conflict detected on unique fields)",
      });
    }

    // Log other unexpected errors
    console.error("CRITICAL WEBHOOK ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during ingestion"
    });
  }
});

/**
 * Meta Ads Simulation API
 * GET /api/webhooks/test-lead
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

