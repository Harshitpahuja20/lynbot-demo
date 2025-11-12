import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/withAuth';
import { getSupabaseAdminClient } from '../../../lib/supabase';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`
    });
  }

  try {
    const userId = req.user.id;
    const supabase = getSupabaseAdminClient();
    
    // Get total connections count (direct query)
    const { count: totalConnections } = await supabase
      .from('prospects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('status', ['connection_sent', 'connected']);
    
    // Get messages sent count (direct query)
    const { count: messagesSent } = await supabase
      .from('linkedin_messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      // .eq('type', 'sent');
    
    // Get messages received count for response rate
    const { count: messagesReceived } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('type', 'received');
    
    const responseRate = messagesSent && messagesSent > 0 
      ? Math.round(((messagesReceived || 0) / messagesSent) * 100) 
      : 0;
    
    // Get active campaigns count (direct query)
    const { count: activeCampaigns } = await supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true)
      // .eq('status', 'active');
    
    res.json({
      success: true,
      stats: {
        totalConnections: totalConnections || 0,
        messagesSent: messagesSent || 0,
        responseRate,
        activeCampaigns: activeCampaigns || 0
      }
    });
    
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch dashboard statistics' 
    });
  }
}

export default withAuth(handler);