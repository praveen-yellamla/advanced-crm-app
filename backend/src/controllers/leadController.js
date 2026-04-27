const prisma = require('../config/prisma');

// ==================================================
// 1. UNIFIED LEAD FETCHING
// ==================================================
const getLeads = async (req, res) => {
  try {
    const { 
      search, 
      status, 
      source, 
      assignedTo, 
      page = 1, 
      limit = 20 
    } = req.query;

    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (source) where.source = source;
    if (assignedTo) where.assignedToId = parseInt(assignedTo);
    
    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Role-based scoping
    if (req.user.role === 'MANAGER') {
       // Only leads assigned to their team
       where.assignedTo = { teamId: req.user.teamId };
    } else if (req.user.role === 'AGENT') {
       where.assignedToId = req.user.id;
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: { assignedTo: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.lead.count({ where })
    ]);

    res.json({
      success: true,
      data: leads,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================================================
// 2. LEAD CREATION WITH DUPLICATE DETECTION
// ==================================================
const createLead = async (req, res) => {
  try {
    const { phone, email, customerName, source, utmSource, utmMedium, utmCampaign } = req.body;

    // Duplicate detection
    const existing = await prisma.lead.findFirst({
      where: {
        OR: [{ phone }, { email: email || undefined }]
      }
    });

    if (existing) {
      return res.status(409).json({ 
        success: false, 
        message: 'A lead with this phone/email already exists within the organizational ledger.',
        duplicateOf: existing.id
      });
    }

    const lead = await prisma.lead.create({
      data: {
        customerName, phone, email, source,
        utmSource, utmMedium, utmCampaign,
        status: 'NEW'
      }
    });

    // Strategy: Trigger Smart Assignment Engine (Async)
    // processAssignment(lead.id); 

    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================================================
// 3. MERGE PROTOCOL
// ==================================================
const mergeLeads = async (req, res) => {
  try {
    const { primaryId, secondaryId } = req.body;

    // In a real production system, transfer communications/tasks
    await prisma.$transaction([
       prisma.call.updateMany({ where: { leadId: secondaryId }, data: { leadId: primaryId } }),
       prisma.task.updateMany({ where: { leadId: secondaryId }, data: { leadId: primaryId } }),
       prisma.email.updateMany({ where: { leadId: secondaryId }, data: { leadId: primaryId } }),
       prisma.lead.delete({ where: { id: secondaryId } })
    ]);

    res.json({ success: true, message: 'Lead identity merged successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================================================
// 4. ASSIGNMENT OVERRIDE
// ==================================================
const reassignLead = async (req, res) => {
  try {
    const { leadId, agentId } = req.body;
    const lead = await prisma.lead.update({
      where: { id: parseInt(leadId) },
      data: { assignedToId: parseInt(agentId) }
    });
    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLeads,
  createLead,
  mergeLeads,
  reassignLead
};
