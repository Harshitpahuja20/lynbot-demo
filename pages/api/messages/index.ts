import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/withAuth';
import { messageOperations, prospectOperations } from '../../../lib/database';

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
    const { conversationId, page = 1, limit = 50 } = req.query;
    
    const messages = await messageOperations.findByUserId(userId, {
      conversationId: conversationId as string,
      page: Number(page),
      limit: Number(limit)
    });

    // If no conversationId, group messages by conversation
    if (!conversationId) {
      const conversations = new Map();
      
      messages.forEach((message: any) => {
        const convId = message.conversationId;
        if (!conversations.has(convId)) {
          conversations.set(convId, {
            conversationId: convId,
            prospect: message.prospects,
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
    const { prospect_id, content, message_type = 'manual', conversation_id } = req.body;

    // Validation
    if (!prospect_id || !content) {
      return res.status(400).json({ 
        success: false,
        error: 'Prospect ID and message content are required' 
      });
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

    // Create new message
    const message = await messageOperations.create({
      user_id: userId,
      prospect_id: prospect_id,
      conversation_id: finalConversationId,
      type: 'sent',
      message_type: message_type,
      content: content.trim(),
      platform: 'linkedin',
      status: 'sent',
      sent_at: new Date().toISOString(),
      automated: message_type !== 'manual',
      ai_generated: false,
      retry_count: 0,
      metadata: {
        characterCount: content.length,
        wordCount: content.split(/\s+/).length
      },
      attachments: [],
      analytics: {
        opened: false,
        openedAt: null,
        clickedLinks: [],
        responseReceived: false,
        responseTime: null,
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
        status: 'message_sent',
        last_updated: new Date().toISOString()
      });
    }

    // Add interaction to prospect
    const updatedInteractions = [
      ...prospect.interactions,
      {
        type: 'message',
        content: content,
        timestamp: new Date().toISOString(),
        automated: message_type !== 'manual'
      }
    ];
    
    await prospectOperations.update(prospect_id, userId, {
      interactions: updatedInteractions
    });

    console.log(`Message sent to prospect: ${prospect.linkedin_data.name}`);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to send message' 
    });
  }
}

export default withAuth(handler);