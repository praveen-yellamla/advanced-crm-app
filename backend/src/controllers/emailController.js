const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../config/prisma');
const emailService = require('../services/emailService');
const emailAiService = require('../services/emailAiService');
const { encrypt } = require('../utils/encryption');

// Connect Email Account
const connectAccount = async (req, res) => {
  const { provider, email, password, smtpHost, smtpPort, imapHost, imapPort } = req.body;
  const userId = req.user.id;
  const organizationId = req.user.organizationId;

  try {
    const encryptedPassword = password ? encrypt(password) : null;
    const account = await prisma.emailAccount.upsert({
      where: { email },
      update: {
        provider,
        password: encryptedPassword,
        smtpHost,
        smtpPort: smtpPort ? parseInt(smtpPort) : null,
        imapHost,
        imapPort: imapPort ? parseInt(imapPort) : null,
        syncStatus: 'CONNECTED'
      },
      create: {
        userId,
        organizationId,
        provider,
        email,
        password: encryptedPassword,
        smtpHost,
        smtpPort: smtpPort ? parseInt(smtpPort) : null,
        imapHost,
        imapPort: imapPort ? parseInt(imapPort) : null,
        syncStatus: 'CONNECTED'
      }
    });

    res.json({ success: true, data: account });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Check connected account status
const getAccountStatus = async (req, res) => {
  const userId = req.user.id;
  const organizationId = req.user.organizationId;

  try {
    const account = await prisma.emailAccount.findFirst({
      where: { userId, organizationId }
    });
    res.json({ success: true, data: account });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Disconnect Email Account
const disconnectAccount = async (req, res) => {
  const userId = req.user.id;
  const organizationId = req.user.organizationId;

  try {
    const account = await prisma.emailAccount.findFirst({
      where: { userId, organizationId }
    });

    if (account) {
      await prisma.emailAccount.delete({
        where: { id: account.id }
      });
    }

    res.json({ success: true, message: 'Account disconnected successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Sync Emails (Non-blocking background run)
const syncEmails = async (req, res) => {
  const userId = req.user.id;
  const organizationId = req.user.organizationId;

  try {
    // Non-blocking invocation
    emailService.syncInbox(userId, organizationId)
      .then(result => console.log(`[Sync Background Result]`, result))
      .catch(err => console.error(`[Sync Background Error]`, err));

    res.json({ success: true, message: 'Synchronization started in background.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send Email (SMTP)
const sendEmail = async (req, res) => {
  const { to, cc, bcc, subject, content, leadId, threadId, templateId } = req.body;
  const userId = req.user.id;
  const organizationId = req.user.organizationId;

  try {
    const attachments = [];
    if (req.files && req.files.length > 0) {
      const uploadDir = path.join(__dirname, '../../uploads/attachments');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      for (const file of req.files) {
        const fileUuid = uuidv4();
        const filePath = path.join(uploadDir, `${fileUuid}_${file.originalname}`);
        
        // Write file buffer to local directory
        fs.writeFileSync(filePath, file.buffer);

        attachments.push({
          filename: file.originalname,
          filePath: `/uploads/attachments/${fileUuid}_${file.originalname}`,
          path: filePath, // For nodemailer to find locally
          fileSize: file.size,
          mimeType: file.mimetype
        });
      }
    }

    const result = await emailService.sendEmail({
      agentId: userId,
      organizationId,
      to,
      cc,
      bcc,
      subject,
      content,
      attachments,
      leadId: leadId ? parseInt(leadId) : null,
      threadId: threadId ? parseInt(threadId) : null,
      templateId: templateId ? parseInt(templateId) : null
    });

    res.json(result);
  } catch (error) {
    console.error('[EMAIL CONTROLLER] Send Email Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Save Draft Email
const saveDraft = async (req, res) => {
  const { to, cc, bcc, subject, content, leadId, threadId } = req.body;
  const userId = req.user.id;
  const organizationId = req.user.organizationId;

  try {
    let finalThreadId = threadId ? parseInt(threadId) : null;
    let finalLeadId = leadId ? parseInt(leadId) : null;

    if (!finalThreadId) {
      const thread = await prisma.emailThread.create({
        data: {
          organizationId,
          leadId: finalLeadId,
          subject: subject || 'Draft Message',
          folder: 'DRAFTS',
          isRead: true,
          snippet: content ? content.replace(/<[^>]*>/g, '').substring(0, 100) : ''
        }
      });
      finalThreadId = thread.id;
    }

    const draft = await prisma.email.create({
      data: {
        organizationId,
        leadId: finalLeadId,
        agentId: userId,
        subject: subject || 'Draft Message',
        content: content || '',
        from: req.user.email,
        to: to || '',
        cc: cc || null,
        bcc: bcc || null,
        status: 'DRAFT',
        folder: 'DRAFTS',
        isRead: true,
        threadId: finalThreadId
      }
    });

    res.json({ success: true, data: draft, threadId: finalThreadId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle Starred Status on Thread or Message
const toggleStar = async (req, res) => {
  const { threadId, emailId, isStarred } = req.body;
  try {
    if (threadId) {
      const thread = await prisma.emailThread.update({
        where: { id: parseInt(threadId) },
        data: { isStarred }
      });
      // also update messages in thread
      await prisma.email.updateMany({
        where: { threadId: parseInt(threadId) },
        data: { isStarred }
      });
      return res.json({ success: true, data: thread });
    }

    if (emailId) {
      const email = await prisma.email.update({
        where: { id: parseInt(emailId) },
        data: { isStarred }
      });
      return res.json({ success: true, data: email });
    }

    res.status(400).json({ success: false, message: 'Invalid arguments' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark Thread or Message Read / Unread
const toggleReadStatus = async (req, res) => {
  const { threadId, emailId, isRead } = req.body;
  try {
    if (threadId) {
      const thread = await prisma.emailThread.update({
        where: { id: parseInt(threadId) },
        data: { isRead }
      });
      // also update messages in thread
      await prisma.email.updateMany({
        where: { threadId: parseInt(threadId) },
        data: { isRead }
      });
      return res.json({ success: true, data: thread });
    }

    if (emailId) {
      const email = await prisma.email.update({
        where: { id: parseInt(emailId) },
        data: { isRead }
      });
      return res.json({ success: true, data: email });
    }

    res.status(400).json({ success: false, message: 'Invalid arguments' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Archive Thread or Message
const archiveEmail = async (req, res) => {
  const { threadId, emailId } = req.body;
  try {
    if (threadId) {
      const thread = await prisma.emailThread.update({
        where: { id: parseInt(threadId) },
        data: { folder: 'ARCHIVED' }
      });
      await prisma.email.updateMany({
        where: { threadId: parseInt(threadId) },
        data: { folder: 'ARCHIVED' }
      });
      return res.json({ success: true, data: thread });
    }

    if (emailId) {
      const email = await prisma.email.update({
        where: { id: parseInt(emailId) },
        data: { folder: 'ARCHIVED' }
      });
      return res.json({ success: true, data: email });
    }

    res.status(400).json({ success: false, message: 'Invalid arguments' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Move to Trash
const deleteEmail = async (req, res) => {
  const id = parseInt(req.params.id);
  const { isThread } = req.query;

  try {
    if (isThread === 'true') {
      const thread = await prisma.emailThread.update({
        where: { id },
        data: { folder: 'TRASH' }
      });
      await prisma.email.updateMany({
        where: { threadId: id },
        data: { folder: 'TRASH' }
      });
      return res.json({ success: true, data: thread });
    } else {
      const email = await prisma.email.update({
        where: { id },
        data: { folder: 'TRASH' }
      });
      return res.json({ success: true, data: email });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// AI Writing Assistant
const getAiWritingAssist = async (req, res) => {
  const { promptText, replyToContent, tone, actionType } = req.body;
  const organizationId = req.user.organizationId;

  try {
    const draftContent = await emailAiService.generateAIAssistResponse({
      promptText,
      replyToContent,
      tone,
      actionType,
      organizationId
    });

    res.json({ success: true, data: draftContent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// THREAD CONTROLLERS
// ==========================================

const getEmailThreads = async (req, res) => {
  const organizationId = req.user.organizationId;
  const { folder = 'INBOX', search = '', limit = 20, offset = 0 } = req.query;

  try {
    const searchFilter = search ? {
      OR: [
        { subject: { contains: search, mode: 'insensitive' } },
        { snippet: { contains: search, mode: 'insensitive' } },
        { lead: { customerName: { contains: search, mode: 'insensitive' } } }
      ]
    } : {};

    // Build base where clause
    let baseWhere = {
      organizationId,
      ...searchFilter
    };

    if (folder === 'STARRED') {
      baseWhere.isStarred = true;
    } else if (folder === 'UNREAD') {
      baseWhere.isRead = false;
    } else {
      baseWhere.folder = folder;
    }

    const threads = await prisma.emailThread.findMany({
      where: baseWhere,
      include: {
        lead: true,
        labels: true,
        events: { orderBy: { createdAt: 'desc' }, take: 1 }
      },
      orderBy: { lastMessageAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    // Compute unread counts for folders
    const counts = await prisma.emailThread.groupBy({
      by: ['folder'],
      where: { organizationId, isRead: false },
      _count: true
    });

    const folderCounts = {
      INBOX: counts.find(c => c.folder === 'INBOX')?._count || 0,
      UNREAD: await prisma.emailThread.count({ where: { organizationId, isRead: false } }),
      STARRED: await prisma.emailThread.count({ where: { organizationId, isStarred: true, isRead: false } }),
      SENT: counts.find(c => c.folder === 'SENT')?._count || 0,
      DRAFTS: counts.find(c => c.folder === 'DRAFTS')?._count || 0,
      ARCHIVED: counts.find(c => c.folder === 'ARCHIVED')?._count || 0,
      SPAM: counts.find(c => c.folder === 'SPAM')?._count || 0,
      TRASH: counts.find(c => c.folder === 'TRASH')?._count || 0
    };

    res.json({ success: true, data: threads, counts: folderCounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getThreadById = async (req, res) => {
  const threadId = parseInt(req.params.id);
  const organizationId = req.user.organizationId;

  try {
    const thread = await prisma.emailThread.findUnique({
      where: { id: threadId },
      include: {
        lead: {
          include: {
            tasks: { where: { status: 'PENDING' }, orderBy: { dueDate: 'asc' } },
            activities: { orderBy: { createdAt: 'desc' }, take: 10 }
          }
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            attachments: true,
            events: true,
            agent: { select: { id: true, name: true, email: true, profileImage: true } }
          }
        },
        events: true,
        labels: true
      }
    });

    if (!thread || thread.organizationId !== organizationId) {
      return res.status(404).json({ success: false, message: 'Thread not found' });
    }

    // Mark thread and messages inside as read on opening
    await prisma.emailThread.update({
      where: { id: threadId },
      data: { isRead: true }
    });

    await prisma.email.updateMany({
      where: { threadId },
      data: { isRead: true }
    });

    // Auto-generate summary and reply suggestions using Gemini if not already generated
    let summary = thread.summary;
    let replySuggestions = thread.replySuggestions;

    if (!summary && thread.messages.length > 0) {
      try {
        summary = await emailAiService.summarizeThread(thread.messages, organizationId);
        const lastMsg = thread.messages[thread.messages.length - 1];
        const aiResult = await emailAiService.analyzeIncomingEmail(thread.subject, lastMsg.content, organizationId);
        
        replySuggestions = aiResult.replySuggestions;

        await prisma.emailThread.update({
          where: { id: threadId },
          data: {
            summary,
            replySuggestions,
            urgency: aiResult.urgency,
            sentiment: aiResult.sentiment
          }
        });
      } catch (aiErr) {
        console.error('[THREAD CONTROLLER] Non-fatal AI Summary generation failed:', aiErr);
      }
    }

    res.json({
      success: true,
      data: {
        ...thread,
        summary,
        replySuggestions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// TEMPLATE CONTROLLERS
// ==========================================

const getEmailTemplates = async (req, res) => {
  const organizationId = req.user.organizationId;
  try {
    const templates = await prisma.emailTemplate.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createEmailTemplate = async (req, res) => {
  const { name, subject, content } = req.body;
  const organizationId = req.user.organizationId;

  try {
    const template = await prisma.emailTemplate.create({
      data: {
        organizationId,
        name,
        subject,
        content
      }
    });
    res.json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  connectAccount,
  getAccountStatus,
  disconnectAccount,
  syncEmails,
  sendEmail,
  saveDraft,
  toggleStar,
  toggleReadStatus,
  archiveEmail,
  deleteEmail,
  getAiWritingAssist,
  getEmailThreads,
  getThreadById,
  getEmailTemplates,
  createEmailTemplate
};
