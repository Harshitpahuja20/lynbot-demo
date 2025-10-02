import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/withAuth';
import { campaignOperations, prospectOperations, messageOperations } from '../../../lib/database';

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
    
    // Get total connections (prospects with connection_sent or connected status)
    const prospects = await prospectOperations.findByUserId(userId);
    const totalConnections = prospects.filter(p => 
      ['connection_sent', 'connected'].includes(p.status)
    ).length;
    
    // Get total messages sent
    const messages = await messageOperations.findByUserId(userId);
    const messagesSent = messages.filter(m => m.type === 'sent').length;
    
    // Calculate response rate
    const messagesReplied = messages.filter(m => m.type === 'received').length;
    const responseRate = messagesSent > 0 ? Math.round((messagesReplied / messagesSent) * 100) : 0;
    
    // Get active campaigns
    const campaigns = await campaignOperations.findByUserId(userId);
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    
    res.json({
      success: true,
      stats: {
        totalConnections,
        messagesSent,
        responseRate,
        activeCampaigns
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