const prisma = require('../config/prisma');

/**
 * @desc    Get user notifications
 * @route   GET /api/notifications
 */
const getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { userId: req.user.id },
          { organizationId: req.user.organizationId, userId: null },
          { organizationId: null, userId: null } // System-wide for admins
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const unreadCount = await prisma.notification.count({
      where: {
        OR: [
          { userId: req.user.id },
          { organizationId: req.user.organizationId, userId: null }
        ],
        isRead: false
      }
    });

    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Mark notification as read
 * @route   PATCH /api/notifications/:id/read
 */
const markAsRead = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.notification.update({
      where: { id: parseInt(id) },
      data: { isRead: true }
    });
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Mark all as read
 * @route   PATCH /api/notifications/read-all
 */
const markAllAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: {
        OR: [
          { userId: req.user.id },
          { organizationId: req.user.organizationId, userId: null }
        ],
        isRead: false
      },
      data: { isRead: true }
    });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Create a system notification (Internal use)
 */
const createNotification = async ({ organizationId, userId, title, message, type, priority, link, metadata }) => {
  try {
    return await prisma.notification.create({
      data: {
        organizationId,
        userId,
        title,
        message,
        type: type || 'INFO',
        priority: priority || 'MEDIUM',
        link,
        metadata
      }
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createNotification
};
