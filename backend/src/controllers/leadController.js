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

    const assignedId = manualAssignedId ? parseInt(manualAssignedId) : null;

    const lead = await prisma.lead.create({
      data: {
        organizationId,
        customerName, phone, email,
        source: source || 'WEBSITE',
        status: 'NEW',
        assignedToId: assignedId
      },
      include: { assignedTo: { select: { id: true, name: true, teamId: true } } }
    });

    const { logActivity, sendNotification, triggerRealtimeEvent } = require('../utils/realtimeHelper');

    // Activity logging
    await logActivity({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'lead.created',
      entityType: 'LEAD',
      entityId: lead.id,
      newValue: lead,
      teamId: lead.assignedTo?.teamId || null
    });

    // Real-time broadcast to Admin & Managers
    triggerRealtimeEvent(`org_${organizationId}`, 'lead:reassigned', { lead, action: 'created' });

    // Notify assigned agent
    if (assignedId) {
      await sendNotification({
        organizationId,
        userId: assignedId,
        title: 'New Lead Assigned',
        message: `You have been assigned a new lead: ${customerName}.`,
        type: 'SUCCESS',
        priority: 'MEDIUM'
      });
      triggerRealtimeEvent(`user_${assignedId}`, 'lead:assigned', lead);
    }

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
      where: { id: parseInt(id), organizationId },
      include: { assignedTo: { select: { name: true, teamId: true } } }
    });
    
    if (!oldLead) return res.status(404).json({ success: false, message: 'Lead not found' });

    const lead = await prisma.lead.update({
      where: { 
        id: parseInt(id),
        organizationId // ENFORCE OWNERSHIP
      },
      data: { status },
      include: { assignedTo: { select: { id: true, name: true, teamId: true, managerId: true } } }
    });

    const { logActivity, sendNotification, triggerRealtimeEvent } = require('../utils/realtimeHelper');

    await createActivity(lead.id, 'STAGE_CHANGE', oldLead.status, status, req.user.id);

    // Global Activity logs
    await logActivity({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'lead.stage_changed',
      entityType: 'LEAD',
      entityId: lead.id,
      oldValue: { status: oldLead.status },
      newValue: { status: lead.status },
      teamId: lead.assignedTo?.teamId || null
    });

    // Realtime stages update for funnel charts
    triggerRealtimeEvent(`org_${organizationId}`, 'lead:stage_changed', {
      leadId: lead.id,
      oldStatus: oldLead.status,
      newStatus: lead.status,
      lead
    });

    // If stage converted
    if (status === 'WON' || status === 'QUALIFIED') {
      // 1. Prompt invoice creation for Agent
      if (lead.assignedToId) {
        await sendNotification({
          organizationId,
          userId: lead.assignedToId,
          title: 'Lead Converted! Raise Invoice',
          message: `Lead ${lead.customerName} has been converted successfully! Create an invoice to reconcile billing.`,
          type: 'SUCCESS',
          priority: 'HIGH',
          metadata: { leadId: lead.id }
        });
      }

      // 2. Notify Manager
      if (lead.assignedTo?.managerId) {
        await sendNotification({
          organizationId,
          userId: lead.assignedTo.managerId,
          title: 'Team Revenue Conversion!',
          message: `Agent ${lead.assignedTo.name} has converted Lead ${lead.customerName}!`,
          type: 'SUCCESS',
          priority: 'URGENT'
        });
      }
    }

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
    const leadId = parseInt(id);

    const oldLead = await prisma.lead.findFirst({ 
      where: { id: leadId, organizationId }
    });

    if (!oldLead) return res.status(404).json({ success: false, message: 'Lead not found' });
    
    // Verify Agent belongs to same org
    const agent = await prisma.user.findFirst({
      where: { id: parseInt(agentId), organizationId },
      include: { team: true }
    });

    if (!agent) {
      return res.status(403).json({ success: false, message: 'Agent does not belong to your organization' });
    }

    const oldAgent = oldLead.assignedToId 
      ? await prisma.user.findUnique({ where: { id: oldLead.assignedToId } }) 
      : null;

    const lead = await prisma.lead.update({
      where: { 
        id: leadId,
        organizationId // ENFORCE OWNERSHIP
      },
      data: { assignedToId: agent.id },
      include: { assignedTo: { select: { id: true, name: true, teamId: true } } }
    });

    const { logActivity, sendNotification, triggerRealtimeEvent } = require('../utils/realtimeHelper');

    const timestamp = new Date().toISOString();
    const oldName = oldAgent ? oldAgent.name : 'Unassigned';
    const activityText = `Reassigned by ${req.user.name} from ${oldName} to ${agent.name} at ${timestamp}`;

    await createActivity(lead.id, 'ASSIGNMENT', oldName, agent.name, req.user.id);

    // Global Activity log
    await logActivity({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'lead.reassigned',
      entityType: 'LEAD',
      entityId: lead.id,
      oldValue: { assignedToId: oldLead.assignedToId, name: oldName },
      newValue: { assignedToId: agent.id, name: agent.name },
      teamId: agent.teamId
    });

    // Realtime notification and refresh signals
    triggerRealtimeEvent(`org_${organizationId}`, 'lead:reassigned', {
      leadId,
      oldAgentId: oldLead.assignedToId,
      newAgentId: agent.id,
      lead
    });

    // Notify old agent if any
    if (oldLead.assignedToId) {
      await sendNotification({
        organizationId,
        userId: oldLead.assignedToId,
        title: 'Lead Reassigned Away',
        message: `Lead ${lead.customerName} has been reassigned to ${agent.name}.`,
        type: 'WARNING',
        priority: 'MEDIUM'
      });
      triggerRealtimeEvent(`user_${oldLead.assignedToId}`, 'lead:reassigned', { leadId, removed: true });
    }

    // Notify new agent
    await sendNotification({
      organizationId,
      userId: agent.id,
      title: 'New Lead Assigned',
      message: `You have been assigned a new lead: ${lead.customerName}.`,
      type: 'SUCCESS',
      priority: 'HIGH'
    });
    triggerRealtimeEvent(`user_${agent.id}`, 'lead:assigned', lead);

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
