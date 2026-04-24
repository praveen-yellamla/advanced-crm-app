const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

// --- TEAM CRUD ---

/**
 * @desc    Create a new team
 * @route   POST /api/admin/teams
 * @access  Private/Admin
 */
const createTeam = async (req, res) => {
  const { teamName, managerId, region, language } = req.body;

  try {
    const team = await prisma.team.create({
      data: {
        teamName,
        managerId: parseInt(managerId),
        region,
        language,
        isActive: true
      },
      include: {
        manager: {
          select: { name: true, email: true }
        }
      }
    });

    res.status(201).json({ status: 'success', data: team });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating team' });
  }
};

/**
 * @desc    Get all teams
 * @route   GET /api/admin/teams
 * @access  Private/Admin
 */
const getTeams = async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        manager: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { agents: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ status: 'success', data: teams });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching teams' });
  }
};

/**
 * @desc    Update a team
 * @route   PUT /api/admin/teams/:id
 * @access  Private/Admin
 */
const updateTeam = async (req, res) => {
  const { id } = req.params;
  const { teamName, managerId, region, language, isActive } = req.body;

  try {
    const team = await prisma.team.update({
      where: { id: parseInt(id) },
      data: {
        teamName,
        managerId: managerId ? parseInt(managerId) : undefined,
        region,
        language,
        isActive
      }
    });

    res.status(200).json({ status: 'success', data: team });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating team' });
  }
};

/**
 * @desc    Delete a team
 * @route   DELETE /api/admin/teams/:id
 * @access  Private/Admin
 */
const deleteTeam = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.team.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({ status: 'success', message: 'Team deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting team' });
  }
};

// --- AGENT CRUD ---

/**
 * @desc    Create a new agent
 * @route   POST /api/admin/agents
 * @access  Private/Admin
 */
const createAgent = async (req, res) => {
  const { name, email, password, phone, teamId, managerId, region, language } = req.body;

  try {
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const agent = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: 'AGENT',
        teamId: teamId ? parseInt(teamId) : null,
        managerId: managerId ? parseInt(managerId) : null,
        region,
        language,
        isActive: true
      }
    });

    res.status(201).json({ status: 'success', data: agent });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating agent' });
  }
};

/**
 * @desc    Get all agents
 * @route   GET /api/admin/agents
 * @access  Private/Admin
 */
const getAgents = async (req, res) => {
  try {
    const agents = await prisma.user.findMany({
      where: { role: 'AGENT' },
      include: {
        team: { select: { id: true, teamName: true } },
        manager: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ status: 'success', data: agents });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching agents' });
  }
};

/**
 * @desc    Update an agent
 * @route   PUT /api/admin/agents/:id
 * @access  Private/Admin
 */
const updateAgent = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, teamId, managerId, region, language, isActive } = req.body;

  try {
    const agent = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        name,
        email,
        phone,
        teamId: teamId ? parseInt(teamId) : undefined,
        managerId: managerId ? parseInt(managerId) : undefined,
        region,
        language,
        isActive
      }
    });

    res.status(200).json({ status: 'success', data: agent });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating agent' });
  }
};

/**
 * @desc    Delete an agent
 * @route   DELETE /api/admin/agents/:id
 * @access  Private/Admin
 */
const deleteAgent = async (req, res) => {
  const { id } = req.params;

  try {
    // Delete related records first or handle via Prisma cascade if configured
    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({ status: 'success', message: 'Agent deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting agent' });
  }
};

const sendEmail = require('../utils/sendEmail');

/**
 * @desc    Send secure invite link
 * @route   POST /api/admin/invite
 * @access  Private/Admin
 */
const sendInvite = async (req, res) => {
  const { email, role } = req.body;
  
  try {
    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/register?email=${email}&role=${role}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
        <h2 style="color: #2563eb;">You've been invited!</h2>
        <p>You have been invited to join the <strong>Advanced CRM</strong> platform as a <strong>${role}</strong>.</p>
        <p>Please click the button below to complete your registration:</p>
        <a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px;">Complete Registration</a>
        <p style="margin-top: 30px; color: #64748b; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="color: #64748b; font-size: 14px; word-break: break-all;">${inviteLink}</p>
      </div>
    `;

    await sendEmail({
      email,
      subject: `Invitation to join Advanced CRM as ${role}`,
      message: `You've been invited to join Advanced CRM as ${role}. Click here to register: ${inviteLink}`,
      html: htmlContent
    });

    res.status(200).json({ status: 'success', message: `Invite sent securely to ${email}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error sending invite. Please check SMTP settings.' });
  }
};

module.exports = {
  createTeam,
  getTeams,
  updateTeam,
  deleteTeam,
  createAgent,
  getAgents,
  updateAgent,
  deleteAgent,
  sendInvite
};
