const prisma = require('../config/prisma');

const getLeads = async (req, res) => {
  try {
    const { 
      search, status, source, assignedTo, 
      startDate, endDate, page = 1, limit = 20 
    } = req.query;

    const skip = (page - 1) * limit;
    const organizationId = req.user.organizationId;

    const andConditions = [{ organizationId }];

    if (status) andConditions.push({ status });
    if (source) andConditions.push({ source });
    
    if (startDate && endDate) {
      andConditions.push({
        createdAt: { gte: new Date(startDate), lte: new Date(endDate) }
      });
    }

    if (search) {
      andConditions.push({
        OR: [
          { customerName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      });
    }

    // Role-based scoping within the organization
    if (req.user.role === 'AGENT') {
      andConditions.push({
        OR: [{ assignedToId: req.user.id }, { assignedToId: null }]
      });
    }

    if (assignedTo) {
      andConditions.push({ assignedToId: parseInt(assignedTo) });
    }

    const where = { AND: andConditions };

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
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createLead = async (req, res) => {
  try {
    const { phone, email, customerName, source, assignedToId: manualAssignedId } = req.body;
    const organizationId = req.user.organizationId;

    // Tenant-specific Duplicate detection
    const existing = await prisma.lead.findFirst({
      where: {
        organizationId,
        OR: [{ phone }, { email: email || undefined }]
      }
    });

    if (existing) {
      return res.status(409).json({ success: false, message: 'Lead already exists in this workspace.' });
    }

    const lead = await prisma.lead.create({
      data: {
        organizationId,
        customerName, phone, email,
        source: source || 'WEBSITE',
        status: 'NEW',
        assignedToId: manualAssignedId ? parseInt(manualAssignedId) : null
      }
    });

    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getLeadDetails = async (req, res) => {
  try {
    const lead = await prisma.lead.findFirst({
      where: { id: parseInt(req.params.id), organizationId: req.user.organizationId },
      include: { 
        assignedTo: { select: { id: true, name: true } },
        activities: { orderBy: { createdAt: 'desc' } }
      }
    });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found in your workspace' });
    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateLead = async (req, res) => {
  try {
    const lead = await prisma.lead.update({
      where: { id: parseInt(req.params.id), organizationId: req.user.organizationId },
      data: req.body
    });
    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteLead = async (req, res) => {
  try {
    await prisma.lead.delete({
      where: { id: parseInt(req.params.id), organizationId: req.user.organizationId }
    });
    res.json({ success: true, message: 'Lead identity purged.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createActivity = async (leadId, action, oldValue, newValue, userId) => {
  try {
    await prisma.leadActivity.create({
      data: {
        leadId,
        action,
        oldValue: oldValue ? String(oldValue) : null,
        newValue: newValue ? String(newValue) : null,
        userId
      }
    });
  } catch (err) {
    console.error('Activity logging failed:', err);
  }
};

const updateLeadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const organizationId = req.user.organizationId;

    const oldLead = await prisma.lead.findFirst({ 
      where: { id: parseInt(id), organizationId } 
    });
    
    if (!oldLead) return res.status(404).json({ success: false, message: 'Lead not found' });

    const lead = await prisma.lead.update({
      where: { 
        id: parseInt(id),
        organizationId // ENFORCE OWNERSHIP
      },
      data: { status }
    });

    await createActivity(lead.id, 'STAGE_CHANGE', oldLead.status, status, req.user.id);

    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const mergeLeads = async (req, res) => {
  try {
    const { primaryId, secondaryId } = req.body;
    const organizationId = req.user.organizationId;

    // Verify both leads belong to the same org
    const leads = await prisma.lead.findMany({
      where: { id: { in: [primaryId, secondaryId] }, organizationId }
    });

    if (leads.length < 2) {
      return res.status(403).json({ success: false, message: 'Unauthorized or invalid lead IDs' });
    }

    await prisma.$transaction([
       prisma.call.updateMany({ where: { leadId: secondaryId }, data: { leadId: primaryId } }),
       prisma.task.updateMany({ where: { leadId: secondaryId }, data: { leadId: primaryId } }),
       prisma.email.updateMany({ where: { leadId: secondaryId }, data: { leadId: primaryId } }),
       prisma.leadActivity.updateMany({ where: { leadId: secondaryId }, data: { leadId: primaryId } }),
       prisma.lead.delete({ where: { id: secondaryId } })
    ]);
    res.json({ success: true, message: 'Lead identity merged successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const assignLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { agentId } = req.body;
    const organizationId = req.user.organizationId;

    const oldLead = await prisma.lead.findFirst({ 
      where: { id: parseInt(id), organizationId } 
    });

    if (!oldLead) return res.status(404).json({ success: false, message: 'Lead not found' });
    
    // Verify Agent belongs to same org
    const agent = await prisma.user.findFirst({
      where: { id: parseInt(agentId), organizationId }
    });

    if (!agent) {
      return res.status(403).json({ success: false, message: 'Agent does not belong to your organization' });
    }

    const lead = await prisma.lead.update({
      where: { 
        id: parseInt(id),
        organizationId // ENFORCE OWNERSHIP
      },
      data: { assignedToId: agent.id }
    });

    await createActivity(lead.id, 'ASSIGNMENT', oldLead.assignedToId, agentId, req.user.id);

    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLeads,
  createLead,
  mergeLeads,
  updateLead,
  updateLeadStatus,
  deleteLead,
  getLeadDetails,
  assignLead
};
