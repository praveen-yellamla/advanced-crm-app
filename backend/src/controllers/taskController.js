const prisma = require('../config/prisma');

const getTasks = async (req, res) => {
  try {
    const { status, leadId, priority } = req.query;
    const where = {};
    if (status) where.status = status;
    if (leadId) where.leadId = parseInt(leadId);
    if (priority) where.priority = priority;

    // Role-based scoping
    if (req.user.role === 'AGENT') {
      where.userId = req.user.id;
    } else if (req.user.role === 'MANAGER') {
      where.user = { teamId: req.user.teamId };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: { 
        lead: { select: { customerName: true, phone: true } },
        user: { select: { name: true } }
      },
      orderBy: { dueDate: 'asc' }
    });
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, dueDate } = req.body;
    const task = await prisma.task.update({
      where: { id: parseInt(id) },
      data: { status, priority, dueDate: dueDate ? new Date(dueDate) : undefined }
    });
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getTasks, updateTask };
