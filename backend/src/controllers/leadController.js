const prisma = require('../config/prisma');

const getLeads = async (req, res) => {
  try {
    const { 
      search, 
      status, 
      source, 
      assignedTo, 
      startDate,
      endDate,
      page = 1, 
      limit = 20 
    } = req.query;

    const skip = (page - 1) * limit;

    const andConditions = [];

    if (status) andConditions.push({ status });
    if (source) andConditions.push({ source });
    
    if (startDate && endDate) {
      andConditions.push({
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      });
    } else if (startDate) {
      andConditions.push({ createdAt: { gte: new Date(startDate) } });
    }

    if (search) {
      const searchInt = parseInt(search);
      const searchOR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
      if (!isNaN(searchInt)) {
        searchOR.push({ id: searchInt });
      }
      andConditions.push({ OR: searchOR });
    }

    // Role-based scoping (Standard CRM logic but allows unassigned for Pipeline transparency)
    if (req.user.role === 'MANAGER' && !assignedTo) {
       andConditions.push({
         OR: [
           { assignedTo: { teamId: req.user.teamId } },
           { assignedToId: null }
         ]
       });
    } else if (req.user.role === 'AGENT' && !assignedTo) {
       andConditions.push({
         OR: [
           { assignedToId: req.user.id },
           { assignedToId: null }
         ]
       });
    }

    if (assignedTo) {
      andConditions.push({ assignedToId: parseInt(assignedTo) });
    }

    const where = andConditions.length > 0 ? { AND: andConditions } : {};

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

// ==================================================
// 2. LEAD CREATION WITH ACTIVITY TRACKING
// ==================================================
const { uploadToCloudinary } = require('../utils/cloudinary');

const createLead = async (req, res) => {
  try {
    const { phone, email, customerName, source, utmSource, utmMedium, utmCampaign } = req.body;

    // Check if image is present
    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer);
    }

    // Duplicate detection
    const existing = await prisma.lead.findFirst({
      where: {
        OR: [{ phone }, { email: email || undefined }]
      }
    });

    if (existing) {
      return res.status(409).json({ 
        success: false, 
        message: 'A lead with this phone/email already exists.',
        duplicateOf: existing.id
      });
    }

    const lead = await prisma.lead.create({
      data: {
        customerName, phone, email, source: source || 'WEBSITE',
        utmSource, utmMedium, utmCampaign,
        profileImage: imageUrl,
        status: 'NEW'
      }
    });

    await createActivity(lead.id, 'CREATE', null, 'Lead Created', req.user.id);

    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getLeadDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await prisma.lead.findUnique({
      where: { id: parseInt(id) },
      include: { 
        assignedTo: { select: { id: true, name: true } },
        activities: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const oldLead = await prisma.lead.findUnique({ where: { id: parseInt(id) } });
    
    const lead = await prisma.lead.update({
      where: { id: parseInt(id) },
      data: req.body
    });

    if (req.body.assignedToId && req.body.assignedToId !== oldLead.assignedToId) {
      await createActivity(lead.id, 'ASSIGNMENT', oldLead.assignedToId, req.body.assignedToId, req.user.id);
    } else {
      await createActivity(lead.id, 'UPDATE', JSON.stringify(oldLead), JSON.stringify(lead), req.user.id);
    }

    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateLeadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const oldLead = await prisma.lead.findUnique({ where: { id: parseInt(id) } });
    
    const lead = await prisma.lead.update({
      where: { id: parseInt(id) },
      data: { status }
    });

    await createActivity(lead.id, 'STAGE_CHANGE', oldLead.status, status, req.user.id);

    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.lead.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: 'Lead identity purged.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const mergeLeads = async (req, res) => {
  try {
    const { primaryId, secondaryId } = req.body;
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
    const oldLead = await prisma.lead.findUnique({ where: { id: parseInt(id) } });
    
    const lead = await prisma.lead.update({
      where: { id: parseInt(id) },
      data: { assignedToId: parseInt(agentId) }
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
