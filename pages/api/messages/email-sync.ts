import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/withAuth';
import { messageOperations, prospectOperations, userOperations } from '../../../lib/database';
import EmailService, { type EmailAccount } from '../../../lib/services/emailService';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`
    });
  }

  try {
    const userId = req.user.id;
    const { accountId, since } = req.body;

    // Get user's email accounts
    const user = await userOperations.findById(userId);
    if (!user || !user.email_accounts || user.email_accounts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No email accounts configured. Please add your email credentials in Settings.'
      });
    }

    let emailAccounts = user.email_accounts.filter(acc => acc.isActive);
    
    // If specific account ID provided, filter to that account
    if (accountId) {
      emailAccounts = emailAccounts.filter((_, index) => index.toString() === accountId);
    }

    if (emailAccounts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No active email accounts found.'
      });
    }

    const emailService = new EmailService();
    let totalSynced = 0;
    let totalErrors = 0;

    for (const emailAccount of emailAccounts) {
      try {
        const sinceDate = since ? new Date(since) : new Date(emailAccount.lastSyncAt || Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        const emails = await emailService.fetchEmails(emailAccount, {
          since: sinceDate,
          limit: 100
        });

        for (const email of emails) {
          try {
            // Try to match email to existing prospect
            const prospects = await prospectOperations.findByUserId(userId);
            const matchingProspect = prospects.find(p => 
              p.contact_info?.email === email.from ||
              p.linkedin_data.name.toLowerCase().includes(email.from.split('@')[0].toLowerCase())
            );

            if (matchingProspect) {
              // Check if message already exists
              const existingMessages = await messageOperations.findByUserId(userId, {
                conversationId: `email_${userId}_${matchingProspect.id}`
              });

              const messageExists = existingMessages.some((msg: any) => 
                msg.email_data?.messageId === email.messageId
              );

              if (!messageExists) {
                // Create new message entry
                await messageOperations.create({
                  user_id: userId,
                  prospect_id: matchingProspect.id,
                  conversation_id: `email_${userId}_${matchingProspect.id}`,
                  type: 'received',
                  message_type: 'manual',
                  content: email.content,
                  subject: email.subject,
                  platform: 'email',
                  email_data: {
                    to: emailAccount.email,
                    from: email.from,
                    cc: email.cc,
                    bcc: email.bcc,
                    messageId: email.messageId,
                    threadId: email.threadId,
                    inReplyTo: email.inReplyTo,
                    references: email.references
                  },
                  status: 'delivered',
                  delivered_at: email.date.toISOString(),
                  automated: false,
                  ai_generated: false,
                  retry_count: 0,
                  metadata: {
                    characterCount: email.content.length,
                    wordCount: email.content.split(/\s+/).length,
                    platform: 'email',
                    syncedAt: new Date().toISOString()
                  },
                  attachments: email.attachments?.map(att => ({
                    type: att.contentType,
                    filename: att.filename,
                    size: att.size,
                    url: '', // Would need to store attachment separately
                    mimeType: att.contentType
                  })) || [],
                  analytics: {
                    opened: false,
                    openedAt: undefined,
                    clickedLinks: [],
                    responseReceived: false,
                    responseTime: undefined,
                    sentiment: 'neutral',
                    leadQuality: 'cold'
                  },
                  tags: [],
                  is_archived: false,
                  is_starred: false,
                  is_important: false
                });

                totalSynced++;
              }
            }
          } catch (messageError) {
            console.error('Error processing email message:', messageError);
            totalErrors++;
          }
        }

        // Update last sync time
        const updatedEmailAccounts = user.email_accounts.map(acc => 
          acc.email === emailAccount.email 
            ? { ...acc, lastSyncAt: new Date().toISOString() }
            : acc
        );

        await userOperations.update(userId, {
          email_accounts: updatedEmailAccounts
        });

      } catch (accountError) {
        console.error(`Error syncing email account ${emailAccount.email}:`, accountError);
        totalErrors++;
      }
    }

    res.json({
      success: true,
      message: `Email sync completed. ${totalSynced} new messages synced.`,
      results: {
        synced: totalSynced,
        errors: totalErrors,
        accounts: emailAccounts.length
      }
    });

  } catch (error) {
    console.error('Error syncing emails:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync emails'
    });
  }
}

export default withAuth(handler);