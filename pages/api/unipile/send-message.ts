import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { messageOperations, prospectOperations } from '../../../lib/database';
import { activityLogger } from '../../../lib/activity-logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const NEST_API_URL = process.env.NEXT_PUBLIC_NEST_API_URL || 'http://localhost:4000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.id;
    const { chat_id, text, prospect_id, account_id, recipient_name } = req.body;
    console.log(`req.body ${JSON.stringify(req.body)}`);

    if (!chat_id || !text) {
      return res.status(400).json({ success: false, error: 'Chat ID and text required' });
    }

    const response = await fetch(`${NEST_API_URL}/unipile/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id, text })
    });

    const data = await response.json();

    console.log(`Unipile send message response: ${JSON.stringify(data)}`);
    
    if (!response.ok) {
      return res.status(response.status).json({ 
        success: false, 
        error: data.message || 'Failed to send message' 
      });
    }

    // Store message in database after successful send
    try {
      const { getSupabaseAdminClient } = await import('../../../lib/supabase');
      const supabase = getSupabaseAdminClient();
      
      const { error: insertError } = await supabase
        .from('linkedin_messages')
        .insert({
          user_id: userId,
          chat_id: chat_id,
          account_id: account_id,
          message_id: data.message_id,
          recipient_name: recipient_name || 'Unknown',
          content: text,
          type: 'sent',
          status: 'sent',
          sent_at: new Date().toISOString(),
          metadata: {
            unipile_response: data
          }
        });

      if (insertError) {
        console.error('Failed to store LinkedIn message:', insertError);
      }

      // Also update prospect if prospect_id provided
      if (prospect_id) {
        try {
          const prospect = await prospectOperations.findById(prospect_id, userId);
          if (prospect) {
            await prospectOperations.update(prospect_id, userId, {
              interactions: [
                ...prospect.interactions,
                {
                  type: 'message',
                  content: text,
                  platform: 'linkedin',
                  timestamp: new Date().toISOString(),
                  automated: false
                }
              ],
              status: 'message_sent',
              last_updated: new Date().toISOString()
            });
            
            // Log activity
            await activityLogger.log({
              userId,
              activityType: 'message_sent',
              entityType: 'message',
              entityId: data.message_id,
              entityName: recipient_name || prospect.linkedin_data?.name,
              description: `Message sent to ${recipient_name || prospect.linkedin_data?.name || 'prospect'}`
            });
          }
        } catch (prospectError) {
          console.error('Failed to update prospect:', prospectError);
        }
      }
    } catch (dbError) {
      console.error('Failed to store message in database:', dbError);
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send message' 
    });
  }
}
