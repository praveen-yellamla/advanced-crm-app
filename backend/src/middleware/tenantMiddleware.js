const prisma = require('../config/prisma');

/**
 * Middleware to resolve tenant (Organization) from Host or Header
 */
const resolveTenant = async (req, res, next) => {
  try {
    let slug;
    
    // 1. Check Subdomain (e.g. cgs.acrm.com)
    const host = req.headers.host;
    if (host && host.includes('.')) {
      const parts = host.split('.');
      if (parts.length >= 3) {
        slug = parts[0];
      }
    }
    
    // 2. Check Header Fallback (for API testing)
    if (!slug) {
      slug = req.headers['x-tenant-slug'];
    }
    
    // 3. Check Query/Body Fallback
    if (!slug) {
      slug = req.query.tenant || req.body.tenant;
    }

    if (!slug) {
      // If we are already authenticated, we can get it from the user
      if (req.user && req.user.organizationSlug) {
        slug = req.user.organizationSlug;
      }
    }

    if (!slug) {
      return next(); // Continue, let other middlewares handle it
    }

    const organization = await prisma.organization.findUnique({
      where: { slug: slug.toLowerCase() },
      include: { plan: true }
    });

    if (!organization) {
      return res.status(404).json({ success: false, message: 'TENANT_NOT_FOUND' });
    }

    if (organization.status === 'SUSPENDED') {
      return res.status(403).json({ success: false, message: 'TENANT_SUSPENDED' });
    }

    // Attach to request
    req.tenant = organization;
    next();
  } catch (error) {
    console.error('[TENANT RESOLUTION ERROR]:', error.message);
    next(error);
  }
};

module.exports = { resolveTenant };
