const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const csv = require('csv-parser');
const prisma = require('../config/prisma');
const { sendAgentInvitationEmail, sendWelcomeAgentEmail, sendManagerInvitationEmail } = require('../utils/emailService');
const getFrontendUrl = require('../utils/getFrontendUrl');
const { logActivity, sendNotification, triggerRealtimeEvent } = require('../utils/realtimeHelper');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const parseCsv = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
};

/**
 * 2A. Single Invite API
 */
const inviteSingleAgent = async (req, res) => {
  try {
    const { email, name, phone, teamId } = req.body;
    const organizationId = req.user.organizationId;
    const invitedById = req.user.id;

    if (!email || !teamId) {
      return res.status(400).json({ success: false, message: 'Email and Team ID are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    // 1. Check if user already exists
    const userExists = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });
    if (userExists) {
      return res.status(409).json({ success: false, message: 'User with this email already exists in the system' });
    }

    // 2. Check if a pending invite already exists
    const pendingInvite = await prisma.agentInvitation.findFirst({
      where: {
        email: email.trim().toLowerCase(),
        status: 'pending',
        expiresAt: { gt: new Date() }
      }
    });
    if (pendingInvite) {
      return res.status(409).json({ success: false, message: 'A pending invitation already exists for this email' });
    }

    // 3. Find Team and Organization
    const team = await prisma.team.findUnique({
      where: { id: parseInt(teamId), organizationId }
    });
    if (!team) {
      return res.status(404).json({ success: false, message: 'Assigned Team not found in this organization' });
    }

    // 4. Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 Hours

    // 5. Create Invitation
    const invitation = await prisma.agentInvitation.create({
      data: {
        email: email.trim().toLowerCase(),
        name: name ? name.trim() : null,
        phone: phone ? phone.trim() : null,
        teamId: team.id,
        organizationId,
        invitedById,
        token,
        status: 'pending',
        expiresAt
      }
    });

    // 6. Build URL
    const frontendUrl = getFrontendUrl();
    const inviteUrl = `${frontendUrl}/join?token=${token}`;

    // 7. Send Email
    try {
      await sendAgentInvitationEmail(
        invitation.email,
        inviteUrl,
        invitation.name || 'there',
        req.user.name || 'Admin',
        team.teamName
      );
    } catch (emailError) {
      console.error('[SMTP Single Invite Failure]', emailError);
    }

    // Log Activity
    await logActivity({
      actorId: invitedById,
      actorRole: 'ADMIN',
      action: 'agent_invite.created',
      entityType: 'AGENT_INVITATION',
      entityId: parseInt(invitation.id) || null,
      newValue: { email: invitation.email, team: team.teamName },
      teamId: team.id
    });

    return res.json({
      success: true,
      inviteUrl,
      expiresAt,
      message: 'Agent invitation dispatched successfully'
    });
  } catch (error) {
    console.error('[Single Invite Controller Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 2AA. Invite Manager API
 */
const inviteManager = async (req, res) => {
  try {
    const { email, name, phone, teamId } = req.body;
    const organizationId = req.user.organizationId;
    const invitedById = req.user.id;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    // 1. Check if user already exists
    const userExists = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });
    if (userExists) {
      return res.status(409).json({ success: false, message: 'User with this email already exists in the system' });
    }

    // 2. Check if a pending invite already exists
    const pendingInvite = await prisma.agentInvitation.findFirst({
      where: {
        email: email.trim().toLowerCase(),
        status: 'pending',
        expiresAt: { gt: new Date() }
      }
    });
    if (pendingInvite) {
      return res.status(409).json({ success: false, message: 'A pending invitation already exists for this email' });
    }

    // 3. Find Team and Organization if teamId is provided
    let team = null;
    if (teamId) {
      team = await prisma.team.findUnique({
        where: { id: parseInt(teamId), organizationId }
      });
      if (!team) {
        return res.status(404).json({ success: false, message: 'Assigned Team not found in this organization' });
      }
    }

    // 4. Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 Hours

    // 5. Create Invitation
    const invitation = await prisma.agentInvitation.create({
      data: {
        email: email.trim().toLowerCase(),
        name: name ? name.trim() : null,
        phone: phone ? phone.trim() : null,
        teamId: team ? team.id : null,
        organizationId,
        invitedById,
        token,
        status: 'pending',
        role: 'manager',
        expiresAt
      }
    });

    // 6. Build URL
    const frontendUrl = getFrontendUrl();
    const inviteUrl = `${frontendUrl}/join?token=${token}`;

    // 7. Send Email
    try {
      await sendManagerInvitationEmail(
        invitation.email,
        inviteUrl,
        invitation.name || 'there',
        req.user.name || 'Admin',
        team ? team.teamName : null
      );
    } catch (emailError) {
      console.error('[SMTP Single Manager Invite Failure]', emailError);
    }

    // Log Activity
    await logActivity({
      actorId: invitedById,
      actorRole: 'ADMIN',
      action: 'manager_invite.created',
      entityType: 'AGENT_INVITATION',
      entityId: parseInt(invitation.id) || null,
      newValue: { email: invitation.email, team: team ? team.teamName : 'Unassigned' },
      teamId: team ? team.id : null
    });

    return res.json({
      success: true,
      inviteUrl,
      expiresAt,
      message: 'Manager invitation dispatched successfully'
    });
  } catch (error) {
    console.error('[Single Manager Invite Controller Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 2B. Bulk Email Invite API
 */
const inviteBulkAgents = async (req, res) => {
  try {
    const { invites, teamId, role } = req.body;
    const organizationId = req.user.organizationId;
    const invitedById = req.user.id;
    const targetRole = role || 'agent';

    if (!Array.isArray(invites) || invites.length === 0) {
      return res.status(400).json({ success: false, message: 'Invites array is required and cannot be empty' });
    }
    if (invites.length > 500) {
      return res.status(400).json({ success: false, message: 'Cannot invite more than 500 agents at once' });
    }
    if (!teamId && targetRole !== 'manager') {
      return res.status(400).json({ success: false, message: 'Team ID is required' });
    }

    let team = null;
    if (teamId) {
      team = await prisma.team.findUnique({
        where: { id: parseInt(teamId), organizationId }
      });
      if (!team) {
        return res.status(404).json({ success: false, message: 'Assigned Team not found in this organization' });
      }
    }

    const skipped = [];
    const failed = [];
    const validInvites = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Filter valid invites
    for (const inv of invites) {
      const email = inv.email ? inv.email.trim().toLowerCase() : '';
      if (!email || !emailRegex.test(email)) {
        skipped.push({ email: inv.email || 'N/A', reason: 'Invalid email format' });
        continue;
      }

      // Check existing user
      const userExists = await prisma.user.findUnique({ where: { email } });
      if (userExists) {
        skipped.push({ email, reason: 'User already exists' });
        continue;
      }

      // Check pending invite
      const pendingInvite = await prisma.agentInvitation.findFirst({
        where: { email, status: 'pending', expiresAt: { gt: new Date() } }
      });
      if (pendingInvite) {
        skipped.push({ email, reason: 'Pending invitation already active' });
        continue;
      }

      validInvites.push(inv);
    }

    let sentCount = 0;
    const batchSize = 10;

    // Process valid invites in batches
    for (let i = 0; i < validInvites.length; i += batchSize) {
      const batch = validInvites.slice(i, i + batchSize);
      
      const promises = batch.map(async (inv) => {
        const email = inv.email.trim().toLowerCase();
        try {
          const token = crypto.randomBytes(32).toString('hex');
          const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

          const invitation = await prisma.agentInvitation.create({
            data: {
              email,
              name: inv.name ? inv.name.trim() : null,
              phone: inv.phone ? inv.phone.trim() : null,
              teamId: team ? team.id : null,
              organizationId,
              invitedById,
              token,
              status: 'pending',
              role: targetRole,
              expiresAt
            }
          });

          const frontendUrl = getFrontendUrl();
          const inviteUrl = `${frontendUrl}/join?token=${token}`;

          if (targetRole === 'manager') {
            await sendManagerInvitationEmail(
              email,
              inviteUrl,
              invitation.name || 'there',
              req.user.name || 'Admin',
              team ? team.teamName : null
            );
          } else {
            await sendAgentInvitationEmail(
              email,
              inviteUrl,
              invitation.name || 'there',
              req.user.name || 'Admin',
              team.teamName
            );
          }

          sentCount++;
        } catch (err) {
          console.error(`Failed to process bulk invite for ${email}:`, err.message);
          failed.push({ email, reason: err.message });
        }
      });

      await Promise.allSettled(promises);
      
      // Delay to respect SMTP rate limits
      if (i + batchSize < validInvites.length) {
        await sleep(1000);
      }
    }

    return res.json({
      success: true,
      total: invites.length,
      sent: sentCount,
      skipped,
      failed
    });
  } catch (error) {
    console.error('[Bulk Invite Controller Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 2C. CSV Bulk Import API
 */
const inviteCsvAgents = async (req, res) => {
  try {
    const { teamId, role } = req.body;
    const organizationId = req.user.organizationId;
    const invitedById = req.user.id;
    const targetRole = role || 'agent';

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a CSV file' });
    }
    if (!teamId && targetRole !== 'manager') {
      return res.status(400).json({ success: false, message: 'Team ID is required' });
    }

    let team = null;
    if (teamId) {
      team = await prisma.team.findUnique({
        where: { id: parseInt(teamId), organizationId }
      });
      if (!team) {
        return res.status(404).json({ success: false, message: 'Assigned Team not found' });
      }
    }

    // Parse CSV file
    const rawRows = await parseCsv(req.file.path);
    
    // Clean up temp file
    try {
      fs.unlinkSync(req.file.path);
    } catch (fsErr) {
      console.error('Failed to delete temp file:', fsErr);
    }

    const invalidRows = [];
    const duplicateEmails = [];
    const alreadyInvited = [];
    const validInvites = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      // Normalize columns
      const normalized = {};
      for (const k of Object.keys(row)) {
        normalized[k.trim().toLowerCase()] = row[k] ? row[k].trim() : '';
      }

      const email = normalized.email;
      const name = normalized.name || '';
      const phone = normalized.phone || '';

      if (!email) {
        invalidRows.push({ row: i + 1, email: 'N/A', reason: 'Email column is empty' });
        continue;
      }
      if (!emailRegex.test(email)) {
        invalidRows.push({ row: i + 1, email, reason: 'Invalid email format' });
        continue;
      }

      // Check existing user
      const userExists = await prisma.user.findUnique({ where: { email } });
      if (userExists) {
        duplicateEmails.push(email);
        continue;
      }

      // Check pending invite
      const pendingInvite = await prisma.agentInvitation.findFirst({
        where: { email, status: 'pending', expiresAt: { gt: new Date() } }
      });
      if (pendingInvite) {
        alreadyInvited.push(email);
        continue;
      }

      validInvites.push({ email, name, phone });
    }

    let sentCount = 0;
    const batchSize = 10;

    // Send invitations to valid rows in batches
    for (let i = 0; i < validInvites.length; i += batchSize) {
      const batch = validInvites.slice(i, i + batchSize);
      
      const promises = batch.map(async (inv) => {
        try {
          const token = crypto.randomBytes(32).toString('hex');
          const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

          const invitation = await prisma.agentInvitation.create({
            data: {
              email: inv.email,
              name: inv.name || null,
              phone: inv.phone || null,
              teamId: team ? team.id : null,
              organizationId,
              invitedById,
              token,
              status: 'pending',
              role: targetRole,
              expiresAt
            }
          });

          const frontendUrl = getFrontendUrl();
          const inviteUrl = `${frontendUrl}/join?token=${token}`;

          if (targetRole === 'manager') {
            await sendManagerInvitationEmail(
              inv.email,
              inviteUrl,
              invitation.name || 'there',
              req.user.name || 'Admin',
              team ? team.teamName : null
            );
          } else {
            await sendAgentInvitationEmail(
              inv.email,
              inviteUrl,
              invitation.name || 'there',
              req.user.name || 'Admin',
              team.teamName
            );
          }

          sentCount++;
        } catch (err) {
          console.error(`Failed CSV invite for ${inv.email}:`, err.message);
        }
      });

      await Promise.allSettled(promises);
      if (i + batchSize < validInvites.length) {
        await sleep(1000);
      }
    }

    return res.json({
      success: true,
      totalRows: rawRows.length,
      validRows: validInvites.length,
      sentCount,
      invalidRows,
      duplicateEmails,
      alreadyInvited
    });
  } catch (error) {
    console.error('[CSV Invite Controller Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 2D. Get All Invitations API
 */
const getInvitations = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { status, teamId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const whereClause = { organizationId };
    if (status) {
      whereClause.status = status;
    }
    if (teamId) {
      whereClause.teamId = parseInt(teamId);
    }

    const invitations = await prisma.agentInvitation.findMany({
      where: whereClause,
      include: {
        team: { select: { teamName: true } },
        invitedBy: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    const total = await prisma.agentInvitation.count({ where: whereClause });

    // Format output
    const formatted = invitations.map(inv => {
      const frontendUrl = getFrontendUrl();
      const inviteUrl = `${frontendUrl}/join?token=${inv.token}`;
      return {
        id: inv.id,
        email: inv.email,
        name: inv.name,
        phone: inv.phone,
        teamName: inv.team?.teamName || 'Unassigned',
        invitedBy: inv.invitedBy?.name || 'Admin',
        status: inv.status,
        role: inv.role,
        createdAt: inv.createdAt,
        expiresAt: inv.expiresAt,
        acceptedAt: inv.acceptedAt,
        inviteUrl
      };
    });

    return res.json({
      success: true,
      data: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('[Get Invitations Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 2E. Resend Invite API
 */
const resendInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const organizationId = req.user.organizationId;

    const invitation = await prisma.agentInvitation.findUnique({
      where: { id: invitationId },
      include: { team: true }
    });

    if (!invitation || invitation.organizationId !== organizationId) {
      return res.status(404).json({ success: false, message: 'Invitation not found' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

    const updatedInvite = await prisma.agentInvitation.update({
      where: { id: invitationId },
      data: {
        token,
        expiresAt,
        status: 'pending',
        createdAt: new Date()
      }
    });

    const frontendUrl = getFrontendUrl();
    const inviteUrl = `${frontendUrl}/join?token=${token}`;

    try {
      if (invitation.role === 'manager') {
        await sendManagerInvitationEmail(
          updatedInvite.email,
          inviteUrl,
          updatedInvite.name || 'there',
          req.user.name || 'Admin',
          invitation.team?.teamName || null
        );
      } else {
        await sendAgentInvitationEmail(
          updatedInvite.email,
          inviteUrl,
          updatedInvite.name || 'there',
          req.user.name || 'Admin',
          invitation.team?.teamName || 'CRM Team'
        );
      }
    } catch (emailError) {
      console.error('[SMTP Resend Invite Failure]', emailError);
    }

    return res.json({
      success: true,
      inviteUrl,
      expiresAt,
      message: 'Invitation successfully resent'
    });
  } catch (error) {
    console.error('[Resend Invitation Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 2F. Cancel Invite API
 */
const cancelInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const organizationId = req.user.organizationId;

    const invitation = await prisma.agentInvitation.findUnique({
      where: { id: invitationId }
    });

    if (!invitation || invitation.organizationId !== organizationId) {
      return res.status(404).json({ success: false, message: 'Invitation not found' });
    }

    await prisma.agentInvitation.update({
      where: { id: invitationId },
      data: { status: 'cancelled' }
    });

    return res.json({ success: true, message: 'Invitation cancelled successfully' });
  } catch (error) {
    console.error('[Cancel Invitation Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 2G. Validate Token API (PUBLIC)
 */
const validateInvitationToken = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ valid: false, reason: 'invalid', message: 'Token is required' });
    }

    const invitation = await prisma.agentInvitation.findUnique({
      where: { token },
      include: {
        team: { select: { teamName: true } },
        organization: { select: { name: true } },
        invitedBy: { select: { name: true } }
      }
    });

    if (!invitation) {
      return res.status(404).json({ valid: false, reason: 'invalid', message: 'Invitation link is invalid' });
    }

    if (invitation.status === 'accepted') {
      return res.json({ valid: false, reason: 'already_used', message: 'Invitation has already been accepted' });
    }

    if (invitation.status !== 'pending' && invitation.status !== 'pending') {
      return res.json({ valid: false, reason: 'invalid', message: 'Invitation is no longer active' });
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      // Mark as expired in db on-the-fly
      await prisma.agentInvitation.update({
        where: { id: invitation.id },
        data: { status: 'expired' }
      });
      return res.json({ valid: false, reason: 'expired', message: 'Invitation link has expired' });
    }

    return res.json({
      valid: true,
      email: invitation.email,
      name: invitation.name,
      phone: invitation.phone,
      role: invitation.role,
      teamName: invitation.team?.teamName || 'Unassigned',
      organizationName: invitation.organization?.name || 'CRM.PRO Portal',
      invitedBy: invitation.invitedBy?.name || 'Admin',
      expiresAt: invitation.expiresAt
    });
  } catch (error) {
    console.error('[Validate Token Error]', error);
    return res.status(500).json({ valid: false, reason: 'invalid', message: error.message });
  }
};

/**
 * 2H. Complete Registration API (PUBLIC)
 */
const completeAgentRegistration = async (req, res) => {
  try {
    const {
      token,
      name,
      email,
      phone,
      password,
      confirmPassword,
      dateOfBirth,
      gender,
      city,
      profilePhoto
    } = req.body;

    if (!token || !name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'All required fields must be completed' });
    }

    // 1. Verify invitation exists and is active
    const invitation = await prisma.agentInvitation.findUnique({
      where: { token },
      include: { team: true, organization: true }
    });

    if (!invitation) {
      return res.status(400).json({ success: false, message: 'Invalid token' });
    }
    if (invitation.status === 'accepted') {
      return res.status(400).json({ success: false, message: 'Invitation has already been accepted' });
    }
    if (invitation.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Invitation is no longer active' });
    }
    if (new Date(invitation.expiresAt) < new Date()) {
      return res.status(400).json({ success: false, message: 'Invitation has expired' });
    }
    if (invitation.email.trim().toLowerCase() !== email.trim().toLowerCase()) {
      return res.status(400).json({ success: false, message: 'Email address must match the invitation' });
    }

    // 2. Password complexity checks
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ success: false, message: 'Password must contain at least one uppercase letter' });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ success: false, message: 'Password must contain at least one number' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Password confirmation does not match' });
    }

    // 3. Check if user already exists
    const userExists = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });
    if (userExists) {
      return res.status(409).json({ success: false, message: 'An account is already registered with this email' });
    }

    // 4. Hash password with bcryptjs
    const passwordHash = await bcrypt.hash(password, 12);

    const isManager = invitation.role === 'manager';
    const userRole = isManager ? 'MANAGER' : 'AGENT';

    // 5. Create user
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password: passwordHash,
        role: userRole,
        teamId: invitation.teamId || null,
        organizationId: invitation.organizationId,
        isActive: true,
        agentType: 'MANUAL',
        inviteStatus: 'ACCEPTED'
      }
    });

    // If manager is associated with a team, update the team's managerId
    if (isManager && invitation.teamId) {
      await prisma.team.update({
        where: { id: invitation.teamId },
        data: { managerId: user.id }
      });
    }

    // 6. Update invitation
    await prisma.agentInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'accepted',
        acceptedAt: new Date()
      }
    });

    // 7. Write to Activity Log
    await logActivity({
      actorId: user.id,
      actorRole: userRole,
      action: isManager ? 'manager.registered' : 'agent.registered',
      entityType: 'USER',
      entityId: user.id,
      newValue: { name: user.name, team: invitation.team?.teamName },
      teamId: invitation.teamId || null
    });

    // 8. In-app notifications
    // Notify inviting admin
    await sendNotification({
      organizationId: invitation.organizationId,
      userId: invitation.invitedById,
      title: isManager ? 'Manager Invitation Accepted' : 'Agent Invitation Accepted',
      message: isManager 
        ? `${user.name} accepted your invitation and joined as Manager ${invitation.team?.teamName ? 'of ' + invitation.team?.teamName : ''}.`
        : `${user.name} accepted your invitation and joined ${invitation.team?.teamName || 'your team'}.`,
      type: 'SUCCESS',
      priority: 'MEDIUM',
      link: `/admin/agents`
    });

    // Notify manager of team if team has a manager
    if (!isManager && invitation.team?.managerId) {
      await sendNotification({
        organizationId: invitation.organizationId,
        userId: invitation.team.managerId,
        title: 'New Team Member Joined',
        message: `${user.name} has joined your team: ${invitation.team.teamName}.`,
        type: 'SUCCESS',
        priority: 'HIGH',
        link: `/manager/team`
      });

      // 9. Real-time events to Manager
      triggerRealtimeEvent(`user_${invitation.team.managerId}`, 'agent:joined_team', {
        agent: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          isActive: user.isActive
        }
      });
    }

    // 10. Send welcome email to new agent
    try {
      await sendWelcomeAgentEmail(user.email, user.name);
    } catch (welcomeError) {
      console.error('[SMTP Welcome Email Failure]', welcomeError);
    }

    return res.json({
      success: true,
      message: 'Account created! You can now log in.'
    });
  } catch (error) {
    console.error('[Complete Registration Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  inviteSingleAgent,
  inviteManager,
  inviteBulkAgents,
  inviteCsvAgents,
  getInvitations,
  resendInvitation,
  cancelInvitation,
  validateInvitationToken,
  completeAgentRegistration
};
