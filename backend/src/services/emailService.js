const nodemailer = require('nodemailer');
const { transporter } = require('../utils/emailService');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../config/prisma');
const { decrypt } = require('../utils/encryption');
const { notifyUser, getIO } = require('../utils/socketService');
const emailAiService = require('./emailAiService');

class EmailService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../../uploads/attachments');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Helper to normalize subject lines (removes Re:, Fwd:, etc.)
   */
  normalizeSubject(subject) {
    if (!subject) return '';
    return subject
      .replace(/^(re|fwd|fw|aw|reply):\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Helper to parse email addresses (extracts actual email address from "John Doe <john@doe.com>")
   */
  extractEmail(addressStr) {
    if (!addressStr) return '';
    const match = addressStr.match(/<([^>]+)>/);
    return match ? match[1].toLowerCase().trim() : addressStr.toLowerCase().trim();
  }

  /**
   * Send an email via SMTP (personal or system fallback)
   */
  async sendEmail({
    agentId,
    organizationId,
    to,
    cc = '',
    bcc = '',
    subject,
    content,
    attachments = [],
    leadId = null,
    threadId = null,
    templateId = null
  }) {
    console.log('[COMPOSE EMAIL] Incoming request:', { to, cc, bcc, subject, leadId, threadId });

    if (!to || !subject || !content) {
      throw new Error('Validation failed: to, subject, and content are required.');
    }

    // 1. Resolve agent's EmailAccount
    const account = await prisma.emailAccount.findFirst({
      where: { userId: agentId, organizationId }
    });

    let fromEmail = `"${process.env.EMAIL_FROM || 'Advanced CRM'}" <${process.env.EMAIL_FROM}>`;
    let replyToEmail = undefined;
    if (account) {
      fromEmail = `"${account.user?.name || 'Agent'} (CRM)" <${process.env.EMAIL_FROM}>`;
      replyToEmail = account.email;
    }

    // 3. Format attachments for nodemailer
    const mailAttachments = attachments.map(att => ({
      filename: att.filename,
      path: att.filePath || att.path
    }));

    // 4. Send email
    let info;
    try {
      console.log(`[COMPOSE EMAIL] Transmitting to SMTP: ${to}`);
      info = await transporter.sendMail({
        from: fromEmail,
        replyTo: replyToEmail,
        to,
        cc: cc || undefined,
        bcc: bcc || undefined,
        subject,
        html: content,
        attachments: mailAttachments
      });
      console.log(`[COMPOSE EMAIL] SMTP Success Response:`, info.response);
      
      // Strict SMTP validation
      if (!info.messageId) {
        throw new Error('SMTP Error: No messageId returned by server.');
      }
      
      const recipientEmail = this.extractEmail(to);
      const isAccepted = info.accepted && info.accepted.some(acc => acc.toLowerCase().includes(recipientEmail));
      const isRejected = info.rejected && info.rejected.length > 0;
      
      if (isRejected || !isAccepted) {
        throw new Error(`SMTP Error: Message rejected or not accepted by SMTP server. Rejected: ${info.rejected?.join(', ')}`);
      }
      
    } catch (smtpError) {
      console.error('[COMPOSE EMAIL] SMTP CRITICAL FAILURE:', smtpError.message);
      console.error('[COMPOSE EMAIL] SMTP RAW ERROR:', smtpError);
      throw new Error(`SMTP Error: ${smtpError.message}`);
    }

    // DB operations fallback block
    let newEmail = null;
    let finalThreadId = threadId;

    try {
      // 5. Link Lead automatically if not provided
      let finalLeadId = leadId;
      const recipientEmail = this.extractEmail(to);
      if (!finalLeadId) {
        const matchedLead = await prisma.lead.findFirst({
          where: { organizationId, email: recipientEmail }
        });
        if (matchedLead) finalLeadId = matchedLead.id;
      }

      // 6. Handle Thread logic
      const normalizedSubj = this.normalizeSubject(subject);

      if (!finalThreadId) {
        // Look for an existing thread with the normalized subject and same lead
        if (finalLeadId && prisma.emailThread) {
          const existingThread = await prisma.emailThread.findFirst({
            where: {
              organizationId,
              leadId: finalLeadId,
              subject: { contains: normalizedSubj }
            },
            orderBy: { lastMessageAt: 'desc' }
          });
          if (existingThread) {
            finalThreadId = existingThread.id;
          }
        }

        // If still no thread, create a new one
        if (!finalThreadId && prisma.emailThread) {
          const thread = await prisma.emailThread.create({
            data: {
              organizationId,
              leadId: finalLeadId,
              subject: subject || 'No Subject',
              folder: 'SENT',
              isRead: true,
              urgency: 'LOW',
              sentiment: 'NEUTRAL',
              snippet: content.replace(/<[^>]*>/g, '').substring(0, 150)
            }
          });
          finalThreadId = thread.id;
        }
      }

      // 7. Save Email Record
      if (prisma.email) {
        newEmail = await prisma.email.create({
          data: {
            organizationId,
            leadId: finalLeadId,
            agentId,
            subject,
            content,
            from: account?.email || process.env.SMTP_USER,
            to,
            cc: cc || null,
            bcc: bcc || null,
            status: 'SENT',
            folder: 'SENT',
            messageId: info.messageId || `sent-${uuidv4()}`,
            smtpMessageId: info.messageId,
            sentAt: new Date(),
            isRead: true,
            threadId: finalThreadId
          }
        });

        // Save attachments in DB if any
        if (prisma.emailAttachment && attachments.length > 0) {
          for (const att of attachments) {
            await prisma.emailAttachment.create({
              data: {
                emailId: newEmail.id,
                filename: att.filename,
                filePath: att.filePath || att.path,
                fileSize: att.fileSize || att.size || 0,
                mimeType: att.mimeType || att.mimetype || 'application/octet-stream'
              }
            });
          }
        }
      } else {
        console.error("email model missing");
      }

      // 8. Update Thread's snippet and date
      if (finalThreadId && prisma.emailThread) {
        await prisma.emailThread.update({
          where: { id: finalThreadId },
          data: {
            snippet: content.replace(/<[^>]*>/g, '').substring(0, 150),
            lastMessageAt: new Date(),
            folder: 'SENT'
          }
        });
      }

      // 9. Lead scoring and activities
      if (finalLeadId) {
        const lead = await prisma.lead.findUnique({ where: { id: finalLeadId } });
        const currentScore = lead?.score || 0;
        await prisma.lead.update({
          where: { id: finalLeadId },
          data: {
            score: Math.min(100, currentScore + 5),
            status: lead?.status === 'NEW' ? 'CONTACTED' : lead?.status
          }
        });

        if (prisma.leadActivity) {
          await prisma.leadActivity.create({
            data: {
              organizationId,
              leadId: finalLeadId,
              action: `Email Sent: ${subject}`
            }
          });
        } else {
          console.error("leadActivity model missing");
        }
      }

      // 10. Audit log
      if (prisma.emailAuditLog && newEmail) {
        await prisma.emailAuditLog.create({
          data: {
            organizationId,
            emailId: newEmail.id,
            agentId,
            managerId: account?.user?.managerId || null,
            adminVisible: true,
            eventType: 'SENT',
            details: { threadId: finalThreadId, to, cc, bcc, smtpMessageId: info.messageId },
            eventTimestamp: new Date()
          }
        });
      } else {
        if (!prisma.emailAuditLog) console.error("emailAuditLog model missing");
      }

      // 10b. Delivery Event
      if (prisma.emailDeliveryEvent && newEmail) {
        await prisma.emailDeliveryEvent.create({
          data: {
            emailId: newEmail.id,
            threadId: finalThreadId,
            eventType: 'DELIVERED', // Optimistic assuming success response from SMTP
            metadata: { smtpResponse: info.response }
          }
        });
      } else {
        if (!prisma.emailDeliveryEvent) console.error("emailDeliveryEvent model missing");
      }

      // 11. WebSocket emit
      notifyUser(agentId, 'email:sent', { message: 'Email sent successfully', threadId: finalThreadId });

    } catch (dbError) {
      console.error('[COMPOSE EMAIL] DB Operations Error after SMTP Success:', dbError.message);
      console.error(dbError.stack);
      // Do not throw, because the email was actually sent!
    }

    return { success: true, email: newEmail, threadId: finalThreadId };
  }

  /**
   * Background non-blocking IMAP Synchronization
   */
  async syncInbox(userId, organizationId) {
    const account = await prisma.emailAccount.findFirst({
      where: { userId, organizationId }
    });

    if (!account) {
      console.warn(`[IMAP Sync] No connected email account for agent: ${userId}`);
      return { success: false, message: 'No connected email account found' };
    }

    const decryptedPassword = account.password ? decrypt(account.password) : null;
    const imapConfig = {
      user: account.email,
      password: decryptedPassword,
      host: account.imapHost || (account.provider === 'GMAIL' ? 'imap.gmail.com' : 'outlook.office365.com'),
      port: account.imapPort || 993,
      tls: true,
      connTimeout: 10000,
      authTimeout: 10000
    };

    console.log(`[IMAP Sync] Starting sync for ${account.email}...`);

    return new Promise((resolve) => {
      let syncCount = 0;
      const imap = new Imap(imapConfig);

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            console.error('[IMAP Sync Error] openBox:', err);
            imap.end();
            return resolve({ success: false, error: err.message });
          }

          const totalMessages = box.messages.total;
          if (totalMessages === 0) {
            console.log('[IMAP Sync] Inbox is empty');
            imap.end();
            return resolve({ success: true, count: 0 });
          }

          // Fetch last 15 emails to remain fast and non-blocking
          const startSeq = Math.max(1, totalMessages - 14);
          const fetchRange = `${startSeq}:*`;
          const f = imap.seq.fetch(fetchRange, { bodies: '' });

          f.on('message', (msg, seqno) => {
            msg.on('body', (stream, info) => {
              simpleParser(stream, async (err, parsed) => {
                if (err) {
                  console.error('[IMAP Parser Error]:', err);
                  return;
                }

                try {
                  const messageId = parsed.messageId || `imap-${seqno}-${parsed.date?.getTime()}`;

                  // 1. Check if email already exists
                  const existingEmail = await prisma.email.findUnique({
                    where: { messageId }
                  });

                  if (existingEmail) {
                    return; // Already synced
                  }

                  // 2. Identify Lead relation
                  const fromRaw = parsed.from?.text || '';
                  const fromEmail = this.extractEmail(fromRaw);
                  
                  const matchedLead = await prisma.lead.findFirst({
                    where: { organizationId, email: fromEmail }
                  });
                  const leadId = matchedLead ? matchedLead.id : null;

                  // 3. Normalized subject & find/create Thread
                  const subject = parsed.subject || 'No Subject';
                  const normalizedSubj = this.normalizeSubject(subject);
                  
                  let threadId = null;

                  // Resolve thread using In-Reply-To / References, or fallback to subject+lead matching
                  const inReplyTo = parsed.inReplyTo || '';
                  const references = Array.isArray(parsed.references) 
                    ? parsed.references 
                    : (parsed.references ? [parsed.references] : []);

                  if (inReplyTo || references.length > 0) {
                    const referencedEmail = await prisma.email.findFirst({
                      where: {
                        organizationId,
                        messageId: { in: [inReplyTo, ...references].filter(Boolean) }
                      }
                    });
                    if (referencedEmail) threadId = referencedEmail.threadId;
                  }

                  if (!threadId && leadId) {
                    const matchedThread = await prisma.emailThread.findFirst({
                      where: {
                        organizationId,
                        leadId,
                        subject: { contains: normalizedSubj }
                      },
                      orderBy: { lastMessageAt: 'desc' }
                    });
                    if (matchedThread) threadId = matchedThread.id;
                  }

                  // Create new thread if not matched
                  if (!threadId) {
                    const newThread = await prisma.emailThread.create({
                      data: {
                        organizationId,
                        leadId,
                        subject,
                        snippet: parsed.text?.substring(0, 150) || '',
                        folder: 'INBOX',
                        isRead: false
                      }
                    });
                    threadId = newThread.id;
                  }

                  // 4. Save Attachments
                  const attachmentRecords = [];
                  if (parsed.attachments && parsed.attachments.length > 0) {
                    for (const att of parsed.attachments) {
                      const fileUuid = uuidv4();
                      const filename = att.filename || 'attachment';
                      const filePath = path.join(this.uploadDir, `${fileUuid}_${filename}`);
                      
                      // Save file locally
                      fs.writeFileSync(filePath, att.content);

                      attachmentRecords.push({
                        filename,
                        filePath: `/uploads/attachments/${fileUuid}_${filename}`,
                        fileSize: att.size || 0,
                        mimeType: att.contentType || 'application/octet-stream'
                      });
                    }
                  }

                  // 5. Create Email Message record
                  const emailRecord = await prisma.email.create({
                    data: {
                      organizationId,
                      leadId,
                      agentId: userId,
                      subject,
                      content: parsed.html || parsed.text || '',
                      from: fromRaw,
                      to: parsed.to?.text || account.email,
                      cc: parsed.cc?.text || null,
                      bcc: parsed.bcc?.text || null,
                      status: 'RECEIVED',
                      folder: 'INBOX',
                      messageId,
                      isRead: false,
                      threadId,
                      attachments: {
                        create: attachmentRecords
                      }
                    }
                  });

                  syncCount++;

                  // 6. Gemini AI Assistant classification (Non-blocking)
                  emailAiService.analyzeIncomingEmail(subject, parsed.text || parsed.html || '', organizationId)
                    .then(async (aiResult) => {
                      // Update email message structure
                      await prisma.emailThread.update({
                        where: { id: threadId },
                        data: {
                          snippet: (parsed.text || parsed.html || '').replace(/<[^>]*>/g, '').substring(0, 150),
                          lastMessageAt: parsed.date || new Date(),
                          isRead: false,
                          urgency: aiResult.urgency,
                          sentiment: aiResult.sentiment,
                          summary: aiResult.summary,
                          replySuggestions: aiResult.replySuggestions,
                          folder: aiResult.isSpam ? 'SPAM' : 'INBOX'
                        }
                      });

                      if (aiResult.isSpam) {
                        await prisma.email.update({
                          where: { id: emailRecord.id },
                          data: { folder: 'SPAM' }
                        });
                      }

                      // Notify via Websocket about thread updates
                      notifyUser(userId, 'email:thread_update', { threadId });
                    })
                    .catch(e => console.error('[IMAP Sync] Gemini Analysis failed:', e));

                  // 7. Lead conversion scoring update
                  if (leadId) {
                    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
                    const currentScore = lead?.score || 0;
                    await prisma.lead.update({
                      where: { id: leadId },
                      data: {
                        score: Math.min(100, currentScore + 10)
                      }
                    });

                    await prisma.leadActivity.create({
                      data: {
                        organizationId,
                        leadId,
                        action: `Email Received from: ${fromEmail}`
                      }
                    });
                  }

                  // 8. Broadcast immediate new email notify
                  notifyUser(userId, 'email:new', {
                    email: {
                      id: emailRecord.id,
                      subject: emailRecord.subject,
                      from: emailRecord.from
                    }
                  });

                } catch (saveErr) {
                  console.error('[IMAP Sync Save Error]:', saveErr);
                }
              });
            });
          });

          f.once('error', (fetchErr) => {
            console.error('[IMAP Sync Fetch Error]:', fetchErr);
            imap.end();
          });

          f.once('end', async () => {
            console.log(`[IMAP Sync Finished] Processed inbox fetch range.`);
            
            // Update last synced status
            await prisma.emailAccount.update({
              where: { id: account.id },
              data: { lastSyncedAt: new Date() }
            });

            imap.end();
            resolve({ success: true, count: syncCount });
          });
        });
      });

      imap.once('error', (err) => {
        console.error('[IMAP Sync Auth/Conn Error]:', err);
        resolve({ success: false, error: err.message });
      });

      imap.once('end', () => {
        console.log('[IMAP Sync Connection closed]');
      });

      imap.connect();
    });
  }
}

module.exports = new EmailService();
