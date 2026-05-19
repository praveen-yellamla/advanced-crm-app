const jwt = require('jsonwebtoken');

/**
 * Generates a JWT token for a user
 * @param {Object} user - User object from Prisma
 * @returns {String} JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      user_id: user.id,
      email: user.email, 
      role: user.role,
      teamId: user.teamId,
      team_id: user.teamId
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES || '7d',
    }
  );
};

module.exports = generateToken;
