import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/withAuth';
import { messageOperations, prospectOperations, userOperations } from '../../../lib/database';
import EmailService from '../../../lib/services/emailService';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {

  switch (req.method) {
    case 'GET':
      return handleGetMessages(req, res);
    case 'POST':
      return handleSendMessage(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({
        success: false,
        error: `Method ${req.method} not allowed`
      });
  }
}

async function handleGetMessages(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const userId = req.user.id;
    const { conversationId, page = 1, limit = 50, platform = 'all' } = req.query;
    
    const queryOptions: any = {
      conversationId: conversationId as string,
      page: Number(page),
      limit: Number(limit)
    };

    // Filter by platform if specified
    if (platform !== 'all') {
      queryOptions.platform = platform as string;
    }

    const messages = await messageOperations.findByUserId(userId, queryOptions);

    // If no conversationId, group messages by conversation
    if (!conversationId) {
      const conversations = new Map();
      
      messages.forEach((message: any) => {
        const convId = message.conversationId;
        if (!conversations.has(convId)) {
          conversations.set(convId, {
            conversationId: convId,
            prospect: message.prospects,
            platform: message.platform,
            lastMessage: message,
            unreadCount: 0,
            totalMessages: 0
          });
        }
        
        const conv = conversations.get(convId);
        conv.totalMessages++;
        
        // Update last message if this one is newer
        if (new Date(message.created_at) > new Date(conv.lastMessage.created_at)) {
          conv.lastMessage = message;
        }
        
        // Count unread messages (received messages that haven't been read)
        if (message.type === 'received' && message.status !== 'read') {
          conv.unreadCount++;
        }
      });
      
      const conversationList = Array.from(conversations.values());
      
      return res.json({
        success: true,
        conversations: conversationList
      });
    }

    res.json({
      success: true,
      messages,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: messages.length,
        pages: Math.ceil(messages.length / Number(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch messages' 
    });
  }
}

async function handleSendMessage(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const userId = req.user.id;
    const { 
      prospect_id, 
      content, 
      message_type = 'manual', 
      conversation_id, 
      platform = 'linkedin',
      subject,
      to,
      from,
      cc,
      bcc
    } = req.body;

    // Validation
    if (!prospect_id || !content) {
      return res.status(400).json({ 
        success: false,
        error: 'Prospect ID and message content are required' 
      });
    }

    // Additional validation for email
    if (platform === 'email') {
      if (!subject) {
        return res.status(400).json({ 
          success: false,
          error: 'Subject is required for email messages' 
        });
      }
      if (!to) {
        return res.status(400).json({ 
          success: false,
          error: 'Recipient email is required' 
        });
      }
    }
    // Verify prospect belongs to user
    const prospect = await prospectOperations.findById(prospect_id, userId);
    if (!prospect) {
      return res.status(404).json({ 
        success: false,
        error: 'Prospect not found' 
      });
    }

    // Generate conversation ID if not provided
    const finalConversationId = conversation_id || `${userId}_${prospect_id}`;

    let emailMessageId: string | undefined;
    
    // Handle email sending
    if (platform === 'email') {
      try {
        // Get user's email account
        const user = await userOperations.findById(userId);
        if (!user || !user.email_accounts || user.email_accounts.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'No email account configured. Please add your email credentials in Settings.'
          });
        }

        const emailAccount = user.email_accounts.find(acc => acc.isActive) || user.email_accounts[0];
        const emailService = new EmailService();

        emailMessageId = await emailService.sendEmail(emailAccount, {
          to: to,
          from: from || emailAccount.email,
          subject: subject,
          text: content,
          html: content.replace(/\n/g, '<br>'),
          cc: cc,
          bcc: bcc
        });
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        return res.status(500).json({
          success: false,
          error: 'Failed to send email. Please check your email configuration.'
        });
      }
    }
    // Create new message
    const message = await messageOperations.create({
      user_id: userId,
      prospect_id: prospect_id,
      conversation_id: finalConversationId,
      type: 'sent',
      message_type: message_type,
      content: content.trim(),
      subject: platform === 'email' ? subject : undefined,
      platform: platform,
      email_data: platform === 'email' ? {
        to: to,
        from: from || (await userOperations.findById(userId))?.email_accounts?.[0]?.email || '',
        cc: cc,
        bcc: bcc,
        messageId: emailMessageId,
        threadId: finalConversationId
      } : undefined,
      status: 'sent',
      sent_at: new Date().toISOString(),
      automated: message_type !== 'manual',
      ai_generated: false,
      retry_count: 0,
      metadata: {
        characterCount: content.length,
        wordCount: content.split(/\s+/).length,
        platform: platform
      },
      attachments: [],
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


    // Update prospect status if this is their first message
    if (prospect.status === 'connected' || prospect.status === 'new') {
      await prospectOperations.update(prospect_id, userId, {
        status: platform === 'email' ? 'message_sent' : 'message_sent',
        last_updated: new Date().toISOString()
      });
    }

    // Add interaction to prospect
    const updatedInteractions = [
      ...prospect.interactions,
      {
        type: platform === 'email' ? 'email' : 'message',
        content: content,
        subject: platform === 'email' ? subject : undefined,
        platform: platform,
        timestamp: new Date().toISOString(),
        automated: message_type !== 'manual'
      }
    ];
    
    await prospectOperations.update(prospect_id, userId, {
      interactions: updatedInteractions
    });

    console.log(`${platform === 'email' ? 'Email' : 'Message'} sent to prospect: ${prospect.linkedin_data.name}`);

    res.status(201).json({
      success: true,
      message: `${platform === 'email' ? 'Email' : 'Message'} sent successfully`,
      data: message
    });

  } catch (error) {
    console.error('Error sending message/email:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to send message/email' 
    });
  }
}

export default withAuth(handler);