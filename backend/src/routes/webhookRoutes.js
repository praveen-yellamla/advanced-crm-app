const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { assignLeadRoundRobin } = require('../utils/assignmentService');

/**
 * Lead Ingestion Webhook - PRODUCTION GRADE
 * POST /api/webhooks/leads/:orgSlug
 * Used by external systems to push leads into a specific company workspace.
 */
router.post('/leads/:orgSlug', async (req, res) => {
  try {
    const { orgSlug } = req.params;
    const { name, email, phone, source = 'WEBHOOK' } = req.body;

    // 1. Identify Organization
    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug.toLowerCase() }
    });

    if (!organization) {
      return res.status(404).json({ success: false, message: "Invalid workspace slug." });
    }

    // 2. Mandatory Field Validation
    if (!email || !name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields. Name, Email, and Phone are all mandatory."
      });
    }

    // 3. Tenant-Specific Duplicate Check
    const existingLead = await prisma.lead.findFirst({
      where: {
        organizationId: organization.id,
        OR: [
          { email: email },
          { phone: phone }
        ]
      }
    });

    if (existingLead) {
      return res.status(200).json({
        success: true,
        message: "Lead already exists in this workspace",
        lead: existingLead
      });
    }

    // 4. Automated Agent Assignment (Org-Aware)
    const assignedToId = await assignLeadRoundRobin(organization.id);

    // 5. Create Lead Scoped to Organization
    const newLead = await prisma.lead.create({
      data: {
        organizationId: organization.id,
        customerName: name,
        email,
        phone,
        source,
        assignedToId,
        status: 'NEW'
      }
    });

    console.log(`[INGESTION SUCCESS] Lead ${name} ingested for Org: ${organization.name}`);

    return res.status(201).json({
      success: true,
      message: "Lead ingested successfully",
      lead: newLead
    });

  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(200).json({
        success: true,
        message: "Lead already exists (Conflict detected)",
      });
    }

    console.error("WEBHOOK ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Ingestion service unavailable"
    });
  }
});

/**
 * Meta (Facebook) Webhook Verification (Generic for platform, but should ideally be per-org)
 * GET /api/webhooks/meta
 */
router.get('/meta', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || "meta_verify_token_123";

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  } else {
    return res.sendStatus(403);
  }
});

module.exports = router;

