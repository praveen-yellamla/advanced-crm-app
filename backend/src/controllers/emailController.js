const prisma = require('../config/prisma');
const nodemailer = require('nodemailer');
const Imap = require('imap');
const { simpleParser } = require('mailparser');

// 1. CONNECT EMAIL ACCOUNT
const connectAccount = async (req, res) => {
  const { provider, email, password, smtpHost, smtpPort, imapHost, imapPort } = req.body;
  const userId = req.user.id;

  try {
    const account = await prisma.emailAccount.upsert({
      where: { email },
      update: {
        provider,
        password, // TODO: Encrypt
        smtpHost,
        smtpPort,
        imapHost,
        imapPort,
        syncStatus: 'CONNECTED'
      },
      create: {
        userId,
        provider,
        email,
        password, // TODO: Encrypt
        smtpHost,
        smtpPort,
        imapHost,
        imapPort,
        syncStatus: 'CONNECTED'
      }
    });

    res.json({ success: true, data: account });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. SEND EMAIL
const sendEmail = async (req, res) => {
  const { to, subject, content, leadId, templateId } = req.body;
  const userId = req.user.id;

  try {
    const account = await prisma.emailAccount.findFirst({
      where: { userId, syncStatus: 'CONNECTED' }
    });

    if (!account) return res.status(400).json({ success: false, message: "No connected email account found" });

    const transporter = nodemailer.createTransport({
      host: account.smtpHost || (account.provider === 'GMAIL' ? 'smtp.gmail.com' : 'smtp.office365.com'),
      port: account.smtpPort || 587,
      secure: account.smtpPort === 465,
      auth: {
        user: account.email,
        pass: account.password // TODO: Decrypt
      }
    });

    const info = await transporter.sendMail({
      from: `"${req.user.name}" <${account.email}>`,
      to,
      subject,
      html: content
    });

    // Save to DB
    const emailRecord = await prisma.email.create({
      data: {
        agentId: userId,
        leadId,
        from: account.email,
        to,
        subject,
        content,
        messageId: info.messageId,
        status: 'SENT',
        folder: 'SENT'
      }
    });

    // Log Activity
    if (leadId) {
      await prisma.leadActivity.create({
        data: {
          leadId,
          userId,
          action: 'EMAIL_SENT',
          newValue: `Sent: ${subject}`
        }
      });
    }

    res.json({ success: true, data: emailRecord });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. GET INBOX
const getInbox = async (req, res) => {
  const userId = req.user.id;
  const { folder = 'INBOX' } = req.query;

  try {
    const emails = await prisma.email.findMany({
      where: { 
        agentId: userId,
        folder
      },
      include: { lead: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: emails });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. SYNC EMAILS (IMAP)
const syncEmails = async (req, res) => {
  const userId = req.user.id;
  try {
    const account = await prisma.emailAccount.findFirst({
      where: { userId, syncStatus: 'CONNECTED' }
    });

    if (!account) return res.status(400).json({ success: false, message: "No connected email account found" });

    // This is a simplified version. In production, this would be a background worker.
    const imap = new Imap({
      user: account.email,
      password: account.password,
      host: account.imapHost || (account.provider === 'GMAIL' ? 'imap.gmail.com' : 'outlook.office365.com'),
      port: account.imapPort || 993,
      tls: true
    });

    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err, box) => {
        if (err) throw err;
        const f = imap.seq.fetch(box.messages.total - 10 + ':*', { bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'] });
        f.on('message', (msg, seqno) => {
          msg.on('body', (stream, info) => {
            simpleParser(stream, async (err, parsed) => {
              // Upsert email into DB based on messageId
              await prisma.email.upsert({
                where: { messageId: parsed.messageId },
                update: {},
                create: {
                  agentId: userId,
                  from: parsed.from.text,
                  to: parsed.to.text,
                  subject: parsed.subject,
                  content: parsed.html || parsed.text,
                  messageId: parsed.messageId,
                  status: 'RECEIVED',
                  folder: 'INBOX'
                }
              });
            });
          });
        });
        f.once('error', (err) => imap.end());
        f.once('end', () => imap.end());
      });
    });

    imap.once('error', (err) => {
      console.error(err);
    });

    imap.once('end', () => {
      console.log('IMAP connection ended');
    });

    imap.connect();
    res.json({ success: true, message: "Sync started" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  connectAccount,
  sendEmail,
  getInbox,
  syncEmails
};
