const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const generateToken = (user, expiresIn = '24h') => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, organizationId: user.organizationId },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

/**
 * @desc    Authenticate a user & get token with Session Tracking
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  let { email, password, rememberMe } = req.body;
  if (email) email = email.trim().toLowerCase();

  try {
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { organization: true }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockedUntil - new Date()) / 60000);
      return res.status(403).json({ 
        message: `Account locked due to multiple failed attempts. Try again in ${remainingMinutes} minutes.` 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      // Audit log failed login
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          organizationId: user.organizationId,
          action: 'LOGIN_FAILED',
          module: 'AUTH',
          ipAddress: req.ip || req.headers['x-forwarded-for'],
          userAgent: req.headers['user-agent'],
          details: { email }
        }
      });

      // Increment failed attempts
      const failedAttempts = user.failedLoginAttempts + 1;
      let lockedUntil = null;
      
      if (failedAttempts >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { 
          failedLoginAttempts: failedAttempts,
          lockedUntil
        }
      });

      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account deactivated' });
    }

    // Reset failed attempts on success
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null }
    });

    const accessToken = generateToken(user, rememberMe ? '7d' : '24h');
    const refreshToken = uuidv4();
    const expiresAt = rememberMe 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      : new Date(Date.now() + 24 * 60 * 60 * 1000);    // 24 hours

    // Create Active Session
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: accessToken,
        refreshToken,
        isPersistent: !!rememberMe,
        expiresAt,
        ipAddress: req.ip || req.headers['x-forwarded-for'],
        userAgent: req.headers['user-agent'],
        deviceName: 'Web Browser' // Simplified for now
      }
    });

    // Audit log successful login
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        organizationId: user.organizationId,
        action: 'LOGIN_SUCCESS',
        module: 'AUTH',
        ipAddress: req.ip || req.headers['x-forwarded-for'],
        userAgent: req.headers['user-agent'],
        details: { sessionId: session.id }
      }
    });

    res.json({
      status: 'success',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        organizationName: user.organization?.name,
        organizationSlug: user.organization?.slug
      },
      token: accessToken,
      refreshToken: refreshToken, // Return refresh token for frontend persistence
      sessionId: session.id
    });
  } catch (error) {
    console.error('AUTH ERROR:', error);
    res.status(500).json({ message: 'Server error during authentication' });
  }
};

/**
 * @desc    Logout user & Terminate Session
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      await prisma.session.updateMany({
        where: { token, isActive: true },
        data: { isActive: false }
      });

      // Audit log logout
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          organizationId: req.user.organizationId,
          action: 'LOGOUT',
          module: 'AUTH',
          ipAddress: req.ip || req.headers['x-forwarded-for'],
          userAgent: req.headers['user-agent']
        }
      });
    }
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Logout failed' });
  }
};

/**
 * @desc    Refresh Access Token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
const refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: 'Refresh token required' });

  try {
    const session = await prisma.session.findUnique({
      where: { refreshToken, isActive: true },
      include: { user: { include: { organization: true } } }
    });

    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ message: 'Invalid or expired session' });
    }

    const newAccessToken = generateToken(session.user);
    const newRefreshToken = uuidv4();

    // Rotate refresh token for security
    await prisma.session.update({
      where: { id: session.id },
      data: {
        token: newAccessToken,
        refreshToken: newRefreshToken,
        lastUsedAt: new Date()
      }
    });

    res.json({
      status: 'success',
      token: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    res.status(500).json({ message: 'Refresh failed' });
  }
};

/**
 * @desc    Get Active Sessions
 * @route   GET /api/auth/sessions
 * @access  Private
 */
const getSessions = async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { userId: req.user.id, isActive: true },
      orderBy: { lastUsedAt: 'desc' }
    });
    res.json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Revoke Session
 * @route   DELETE /api/auth/sessions/:id
 * @access  Private
 */
const revokeSession = async (req, res) => {
  try {
    await prisma.session.update({
      where: { id: req.params.id, userId: req.user.id },
      data: { isActive: false }
    });
    res.json({ success: true, message: 'Session revoked' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get user profile
 */
const getMe = async (req, res) => {
  res.json({ status: 'success', user: req.user });
};

/**
 * @desc    Register a new user
 */
const register = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: role || 'AGENT' }
    });

    const accessToken = generateToken(user);
    const refreshToken = uuidv4();
    
    await prisma.session.create({
      data: {
        userId: user.id,
        token: accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h for initial registration
        ipAddress: req.ip || req.headers['x-forwarded-for'],
        userAgent: req.headers['user-agent']
      }
    });

    res.status(201).json({
      status: 'success',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token: accessToken
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed' });
  }
};

/**
 * @desc    Change password
 */
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user && (await bcrypt.compare(currentPassword, user.password))) {
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedNewPassword }
      });

      // Audit log password change
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          organizationId: user.organizationId,
          action: 'PASSWORD_CHANGE',
          module: 'AUTH',
          ipAddress: req.ip || req.headers['x-forwarded-for'],
          userAgent: req.headers['user-agent']
        }
      });

      // Security: Revoke all other sessions
      const currentToken = req.headers.authorization?.split(' ')[1];
      await prisma.session.updateMany({
        where: { 
          userId: user.id, 
          token: { not: currentToken },
          isActive: true 
        },
        data: { isActive: false }
      });

      res.status(200).json({ message: 'Password changed successfully. Other devices logged out.' });
    } else {
      res.status(401).json({ message: 'Incorrect current password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Password change failed' });
  }
};

/**
 * @desc    Verify Invite Token
 */
const verifyInvite = async (req, res) => {
  try {
    const { token } = req.params;
    const invite = await prisma.invite.findUnique({ where: { token } });
    if (!invite || invite.status !== 'PENDING' || (invite.expiresAt && invite.expiresAt < new Date())) {
      return res.status(400).json({ success: false, message: 'Invalid or expired invite' });
    }
    res.json({ success: true, data: { name: invite.name, email: invite.email, role: invite.role } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Accept Invite
 */
const acceptInvite = async (req, res) => {
  try {
    const { token, password, name, phone } = req.body;
    const invite = await prisma.invite.findUnique({ where: { token } });
    if (!invite || invite.status !== 'PENDING' || (invite.expiresAt && invite.expiresAt < new Date())) {
      return res.status(400).json({ message: 'Invalid or expired invite' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Use data from invite if not provided in body
    const finalName = name || invite.name || 'New User';
    const finalPhone = phone || null;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email: invite.email } });

    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { 
          name: finalName, 
          phone: finalPhone || existingUser.phone, 
          password: hashedPassword, 
          role: invite.role, 
          organizationId: invite.organizationId,
          isActive: true, 
          inviteStatus: 'ACCEPTED',
          agentType: 'INVITED'
        }
      });
    } else {
      await prisma.user.create({
        data: { 
          name: finalName, 
          email: invite.email, 
          phone: finalPhone, 
          password: hashedPassword, 
          role: invite.role, 
          organizationId: invite.organizationId, 
          isActive: true, 
          inviteStatus: 'ACCEPTED',
          agentType: 'INVITED'
        }
      });
    }

    await prisma.invite.update({ where: { id: invite.id }, data: { status: 'JOINED' } });
    res.json({ success: true, message: 'Account created successfully' });
  } catch (error) {
    console.error('INVITE ACCEPTANCE CRITICAL ERROR:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Invite acceptance failed',
      error: error.message 
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  getSessions,
  revokeSession,
  changePassword,
  logout,
  refresh,
  verifyInvite,
  acceptInvite
};
