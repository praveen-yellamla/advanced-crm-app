const prisma = require('../config/prisma');

// ==================================================
// 1. OPEN TRACKING PIXEL (1x1 Transparent PIN)
// ==================================================
const trackEmailOpen = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.email.update({
      where: { id: parseInt(id) },
      data: { isOpened: true, openedAt: new Date() }
    });
    
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
