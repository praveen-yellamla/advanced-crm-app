const jwt = require('jsonwebtoken');

/**
 * Generates a JWT token for a user
 * @param {Object} user - User object from Prisma
 * @returns {String} JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES || '1d',
    }
  );
};

module.exports = generateToken;
