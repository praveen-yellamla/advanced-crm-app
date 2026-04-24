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
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      if (!user.isActive) {
        return res.status(401).json({ message: 'Your account is deactivated' });
      }

      res.json({
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
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
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

module.exports = {
  register,
  login,
  getMe,
  changePassword,
  logout
};
