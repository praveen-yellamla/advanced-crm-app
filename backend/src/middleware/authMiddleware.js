const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

/**
 * Enterprise Authentication & Feature Gating Middleware
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this resource' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify Session is active (skip for impersonated tokens which are ephemeral)
    if (!decoded.isImpersonated) {
      const activeSession = await prisma.session.findUnique({
        where: { token, isActive: true }
      });

      if (!activeSession) {
        return res.status(401).json({ success: false, message: 'Session revoked or terminated' });
      }

      // Update lastUsedAt
      await prisma.session.update({
        where: { id: activeSession.id },
        data: { lastUsedAt: new Date() }
      });
    }

    // Fetch user with full organization context for feature gating
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        organization: {
          include: { plan: true }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User protocol decommissioned' });
    }

    // Attach user and impersonation metadata
    req.user = user;
    if (decoded.isImpersonated) {
      req.user.isImpersonated = true;
      req.user.operatorId = decoded.operatorId;
      req.user.operatorName = decoded.operatorName;
    }

    // Attach organization context directly to req for easy access
    if (user.organization) {
      req.organizationId = user.organizationId;
      
      // Inject subscription gates and resource limits into req
      const plan = user.organization.plan;
      req.user.plan = user.organization.subscriptionTier;
      req.user.features = {
        aiAssistant: plan?.aiAssistant ?? false,
        aiLeadScoring: plan?.aiLeadScoring ?? false,
        calling: plan?.callingEnabled ?? false,
        monitoring: plan?.monitoringEnabled ?? false,
        automation: plan?.automationEnabled ?? false,
        analytics: plan?.analyticsEnabled ?? false,
        customBranding: plan?.customBranding ?? false
      };
      
      req.user.limits = {
        agents: user.organization.agentLimit,
        leads: user.organization.leadLimit,
        aiTokens: user.organization.aiTokenLimit,
        storage: user.organization.storageLimitMb
      };
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Protocol expired. Please re-authenticate.' });
    }
    res.status(401).json({ success: false, message: 'Token validation failed' });
  }
};

/**
 * Middleware to authorize specific roles
 * @param {Array} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user?.role || 'NONE'} is not authorized to access this route`
      });
    }
    next();
  };
};

/**
 * Middleware to check for specific feature access
 */
const checkSubscription = (feature) => {
  return (req, res, next) => {
    // Platform Admins bypass feature gating
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    if (!req.user.features || !req.user.features[feature]) {
      return res.status(403).json({
        success: false,
        message: `Feature '${feature}' is locked. Upgrade your subscription to unlock this protocol.`
      });
    }
    next();
  };
};

module.exports = { protect, authorize, checkSubscription };
