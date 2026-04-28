const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const generateToken = require('../utils/generateToken');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // Check if user already exists
    const userExists = await prisma.user.findUnique({
      where: { email }
    });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'AGENT',
      }
    });

    if (user) {
      res.status(201).json({
        status: 'success',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token: generateToken(user)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

/**
 * @desc    Authenticate a user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  let { email, password } = req.body;
  if (email) email = email.trim().toLowerCase();

  try {
    // 1. Try to find in internal Staff repo (User Table)
    let user = await prisma.user.findUnique({ where: { email } });
    let role = user?.role;

    // 2. If not found, try to find in External Client repo (Client Table)
    if (!user) {
      const client = await prisma.client.findUnique({ where: { email } });
      if (client) {
        user = client;
        role = 'CLIENT';
      }
    }

    if (user && (await bcrypt.compare(password, user.password))) {
      // Check status for staff
      if (user.role && !user.isActive) {
        return res.status(401).json({ message: 'Account deactivated' });
      }

      // Check status for clients
      if (role === 'CLIENT' && user.status !== 'ACTIVE') {
        return res.status(401).json({ message: 'Client account inactive' });
      }

      res.json({
        status: 'success',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: role
        },
        token: generateToken({ ...user, role })
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('CRITICAL AUTH ERROR:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

/**
 * @desc    Get user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  res.status(200).json({
    status: 'success',
    user: req.user
  });
};

/**
 * @desc    Change password
 * @route   POST /api/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (user && (await bcrypt.compare(currentPassword, user.password))) {
      const salt = await bcrypt.genSalt(10);
      const hashedNewPassword = await bcrypt.hash(newPassword, salt);

      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedNewPassword }
      });

      res.status(200).json({ message: 'Password changed successfully' });
    } else {
      res.status(401).json({ message: 'Incorrect current password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during password change' });
  }
};

/**
 * @desc    Logout user (Stateless - client should discard token)
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = (req, res) => {
  // In stateless JWT, logout is handled on client side by deleting the token.
  // We return a success message.
  res.status(200).json({ message: 'Successfully logged out' });
};

/**
 * @desc    Verify Invite Token
 * @route   GET /api/auth/invite/:token
 * @access  Public
 */
const verifyInvite = async (req, res) => {
  try {
    const { token } = req.params;
    
    const invite = await prisma.invite.findUnique({
      where: { token }
    });

    if (!invite) {
      return res.status(400).json({ success: false, message: 'Invalid invite link' });
    }

    if (invite.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'This invite has already been accepted or expired' });
    }

    if (new Date() > invite.expiresAt) {
      await prisma.invite.update({
        where: { id: invite.id },
        data: { status: 'EXPIRED' }
      });
      return res.status(400).json({ success: false, message: 'This invite link has expired' });
    }

    res.json({ success: true, data: { email: invite.email, role: invite.role } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Accept Invite
 * @route   POST /api/auth/accept-invite
 * @access  Public
 */
const acceptInvite = async (req, res) => {
  try {
    const { token, name, password } = req.body;
    
    const invite = await prisma.invite.findUnique({
      where: { token }
    });

    if (!invite || invite.status !== 'PENDING' || new Date() > invite.expiresAt) {
      return res.status(400).json({ success: false, message: 'Invalid or expired invite link' });
    }

    // Ensure user doesn't already exist somehow
    const existingUser = await prisma.user.findUnique({ where: { email: invite.email } });
    if (existingUser) {
       return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name,
        email: invite.email,
        password: hashedPassword,
        role: invite.role,
        isActive: true
      }
    });

    await prisma.invite.update({
      where: { id: invite.id },
      data: { status: 'ACCEPTED' }
    });

    res.json({ success: true, message: 'Account created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  register,
  login,
  getMe,
  changePassword,
  logout,
  verifyInvite,
  acceptInvite
};
