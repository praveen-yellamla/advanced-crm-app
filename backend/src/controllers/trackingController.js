const prisma = require('../config/prisma');

// ==================================================
// 1. OPEN TRACKING PIXEL (1x1 Transparent PIN)
// ==================================================
const trackEmailOpen = async (req, res) => {
  try {
    const { id } = req.params;
    
    const email = await prisma.email.findUnique({
      where: { id: parseInt(id) }
    });

    if (email && !email.isOpened) {
      const updatedEmail = await prisma.email.update({
        where: { id: parseInt(id) },
        data: { isOpened: true, openedAt: new Date(), status: 'OPENED' }
      });

      // Create lead activity
      await prisma.leadActivity.create({
        data: {
          organizationId: email.organizationId,
          leadId: email.leadId,
          action: `Email Opened by Lead: "${email.subject}"`
        }
      }).catch(err => console.error("LeadActivity Creation Error:", err));

      const { sendNotification, triggerRealtimeEvent } = require('../utils/realtimeHelper');

      // Send notification and socket trigger to agent
      await sendNotification({
        organizationId: email.organizationId,
        userId: email.agentId,
        title: 'Email Opened by Lead',
        message: `Your email "${email.subject}" has been opened.`,
        type: 'INFO',
        priority: 'MEDIUM',
        metadata: { emailId: email.id }
      });

      triggerRealtimeEvent(`user_${email.agentId}`, 'email:opened', updatedEmail);
      triggerRealtimeEvent(`org_${email.organizationId}`, 'email:opened', updatedEmail);
    }
    
    // Return a 1x1 transparent GIF
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    res.set('Content-Type', 'image/gif');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(pixel);
  } catch (error) {
    res.status(200).send('Tracker Muted');
  }
};

// ==================================================
// 2. LINK CLICK TRACKING (REDIRECT)
// ==================================================
const trackLinkClick = async (req, res) => {
  try {
    const { id } = req.params;
    const { url } = req.query; // Base64 encoded target URL

    await prisma.email.update({
      where: { id: parseInt(id) },
      data: { clickCount: { increment: 1 } }
    });

    const targetUrl = Buffer.from(url, 'base64').toString('ascii');
    res.redirect(targetUrl);
  } catch (error) {
    res.status(404).send('Link sequence expired');
  }
};

module.exports = { trackEmailOpen, trackLinkClick };
