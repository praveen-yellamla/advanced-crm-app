const prisma = require('../config/prisma');
const { notifyUser, broadcastToTeam, getIO } = require('./socketService');

/**
 * Log a CRM action to the database activity_logs table
 */
const logActivity = async ({
  actorId,
  actorRole,
  action,
  entityType,
  entityId,
  oldValue,
  newValue,
  teamId
}) => {
  try {
    const log = await prisma.activityLog.create({
      data: {
        actorId: actorId ? parseInt(actorId) : null,
        actorRole: actorRole || null,
        action,
        entityType: entityType || null,
        entityId: entityId ? parseInt(entityId) : null,
        oldValue: oldValue || null,
        newValue: newValue || null,
        teamId: teamId ? parseInt(teamId) : null
      }
    });

    // Broadcast log to team or organization for live feeds
    const io = getIO();
    if (io) {
      if (teamId) {
        io.to(`team_${teamId}`).emit('activity:new', log);
      }
      // Broadcast globally for admin audit
      io.emit('activity:global', log);
    }
    return log;
  } catch (error) {
    console.error('Failed to log CRM activity:', error);
  }
};

/**
 * Create a notification in the DB and push it via Socket.io
 */
const sendNotification = async ({
  organizationId,
  userId,
  title,
  message,
  type = 'INFO',
  priority = 'MEDIUM',
  link = null,
  metadata = null
}) => {
  try {
    const notif = await prisma.notification.create({
      data: {
        organizationId: organizationId ? parseInt(organizationId) : null,
        userId: userId ? parseInt(userId) : null,
        title,
        message,
        type,
        priority,
        link,
        metadata: metadata || null
      }
    });

    // Real-time socket delivery
    if (userId) {
      notifyUser(userId, 'notification:new', notif);
    } else if (organizationId) {
      const io = getIO();
      if (io) {
        // Emit to organization room
        io.to(`org_${organizationId}`).emit('notification:new', notif);
        // Also emit to user-specific role rooms or filter on client side
        io.to(`org_${organizationId}_admins`).emit('notification:new', notif);
      }
    }
    return notif;
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
};

/**
 * Trigger an arbitrary Socket.io real-time event across rooms
 */
const triggerRealtimeEvent = (room, event, data) => {
  try {
    const io = getIO();
    if (io) {
      if (room) {
        io.to(room).emit(event, data);
      } else {
        io.emit(event, data);
      }
    }
  } catch (error) {
    console.error('Failed to dispatch realtime event:', error);
  }
};

module.exports = {
  logActivity,
  sendNotification,
  triggerRealtimeEvent
};
