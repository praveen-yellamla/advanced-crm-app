const prisma = require('../config/prisma');

// Get Tasks with Pagination, Filtering, Sorting
const getTasks = async (req, res) => {
  try {
    const { 
      page = 1, limit = 50, status, priority, type, 
      assignedTo, search, overdue, startDate, endDate, sort = 'newest' 
    } = req.query;

    const organizationId = req.user.organizationId;
    const where = { organizationId };
    
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (type) where.type = type;
    if (assignedTo) where.assignedToId = parseInt(assignedTo);
    
    // Search by title, description
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { lead: { customerName: { contains: search, mode: 'insensitive' } } },
        { assignedTo: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (overdue === 'true') {
      where.dueDate = { lt: new Date() };
      where.status = { notIn: ['COMPLETED', 'ARCHIVED'] };
    }

    if (startDate && endDate) {
      where.dueDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Role-based scoping (Admin sees all, Managers see team, Agents see own)
    if (req.user.role === 'AGENT') {
      where.assignedToId = req.user.id;
    } else if (req.user.role === 'MANAGER') {
      where.assignedTo = { teamId: req.user.teamId };
    }

    let orderBy = {};
    if (sort === 'newest') orderBy = { createdAt: 'desc' };
    else if (sort === 'oldest') orderBy = { createdAt: 'asc' };
    else if (sort === 'due_soon') orderBy = { dueDate: 'asc' };
    else if (sort === 'highest_priority') {
      // Sorting by string priority isn't perfect in DB, so we'll sort by due date for now
      orderBy = { dueDate: 'asc' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: { 
          lead: { select: { customerName: true, phone: true, email: true, company: true } },
          assignedTo: { select: { name: true, email: true, profileImage: true } },
          createdBy: { select: { name: true } }
        },
        orderBy,
        skip,
        take: parseInt(limit)
      }),
      prisma.task.count({ where })
    ]);

    res.json({ 
      success: true, 
      data: tasks,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTaskById = async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { 
        id: parseInt(req.params.id),
        organizationId: req.user.organizationId
      },
      include: {
        lead: true,
        assignedTo: { select: { id: true, name: true, profileImage: true } },
        createdBy: { select: { id: true, name: true } }
      }
    });
    
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });
    
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createTask = async (req, res) => {
  try {
    const { 
      title, description, dueDate, priority, status, type, 
      assignedToId, leadId, tags, notes, reminderTime, isRecurring, recurringType 
    } = req.body;

    const task = await prisma.task.create({
      data: {
        organizationId: req.user.organizationId,
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'Normal',
        status: status || 'PENDING',
        type: type || 'FOLLOWUP',
        assignedToId: assignedToId ? parseInt(assignedToId) : req.user.id,
        createdById: req.user.id,
        leadId: leadId ? parseInt(leadId) : null,
        tags: tags || [],
        notes,
        reminderTime: reminderTime ? new Date(reminderTime) : null,
        isRecurring: isRecurring || false,
        recurringType,
        activityLogs: [{
          action: 'CREATED',
          timestamp: new Date().toISOString(),
          userId: req.user.id,
          userName: req.user.name
        }]
      },
      include: {
        assignedTo: { select: { name: true, profileImage: true } },
        lead: { select: { customerName: true } }
      }
    });
    
    res.status(201).json({ success: true, data: task, message: "Task created successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, description, dueDate, priority, status, type, 
      assignedToId, leadId, tags, notes, reminderTime, isRecurring, recurringType 
    } = req.body;
    
    const existing = await prisma.task.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ success: false, message: "Task not found" });

    let logs = existing.activityLogs || [];
    logs.push({
      action: 'UPDATED',
      timestamp: new Date().toISOString(),
      userId: req.user.id,
      userName: req.user.name
    });

    const task = await prisma.task.update({
      where: { 
        id: parseInt(id),
        organizationId: req.user.organizationId // ENFORCE OWNERSHIP
      },
      data: { 
        title, description, priority, type, tags, notes, isRecurring, recurringType,
        status, 
        dueDate: dueDate ? new Date(dueDate) : existing.dueDate,
        reminderTime: reminderTime ? new Date(reminderTime) : existing.reminderTime,
        assignedToId: assignedToId ? parseInt(assignedToId) : existing.assignedToId,
        leadId: leadId ? parseInt(leadId) : existing.leadId,
        activityLogs: logs,
        completedAt: status === 'COMPLETED' && existing.status !== 'COMPLETED' ? new Date() : existing.completedAt
      },
      include: {
        assignedTo: { select: { name: true, profileImage: true } },
        lead: { select: { customerName: true } }
      }
    });
    
    res.json({ success: true, data: task, message: "Task updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const patchTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const existing = await prisma.task.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ success: false, message: "Task not found" });

    let logs = existing.activityLogs || [];
    logs.push({
      action: `STATUS_CHANGED_TO_${status.toUpperCase()}`,
      timestamp: new Date().toISOString(),
      userId: req.user.id,
      userName: req.user.name
    });

    const task = await prisma.task.update({
      where: { 
        id: parseInt(id),
        organizationId: req.user.organizationId // ENFORCE OWNERSHIP
      },
      data: { 
        status,
        completedAt: status === 'COMPLETED' ? new Date() : null,
        activityLogs: logs
      },
      include: { assignedTo: true, lead: true }
    });

    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    await prisma.task.delete({ 
      where: { 
        id: parseInt(req.params.id),
        organizationId: req.user.organizationId
      } 
    });
    res.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTaskAnalytics = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const total = await prisma.task.count({ where: { organizationId: orgId } });
    const completed = await prisma.task.count({ where: { organizationId: orgId, status: 'COMPLETED' } });
    const overdue = await prisma.task.count({ 
      where: { 
        organizationId: orgId,
        dueDate: { lt: new Date() },
        status: { notIn: ['COMPLETED', 'ARCHIVED'] }
      } 
    });
    const pending = await prisma.task.count({ where: { organizationId: orgId, status: 'PENDING' } });
    const inProgress = await prisma.task.count({ where: { organizationId: orgId, status: 'IN_PROGRESS' } });
    
    res.json({
      success: true,
      data: {
        total,
        completed,
        overdue,
        pending,
        inProgress,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { 
  getTasks, 
  getTaskById, 
  createTask, 
  updateTask, 
  patchTaskStatus, 
  deleteTask,
  getTaskAnalytics
};
