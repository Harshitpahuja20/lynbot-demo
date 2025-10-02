import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/withAuth';
import { campaignOperations, prospectOperations, messageOperations } from '../../../lib/database';

interface RecentActivity {
  id: string;
  type: 'connection' | 'message' | 'campaign';
  description: string;
  timestamp: string;
}

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
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Get recent messages
    const messages = await messageOperations.findByUserId(userId, { limit });
    const recentMessages = messages.filter(m => m.type === 'sent').slice(0, limit);
    
    // Get recent prospects (connections)
    const prospects = await prospectOperations.findByUserId(userId, { limit });
    const recentConnections = prospects
      .filter(p => p.status === 'connection_sent')
      .slice(0, limit);
    
    // Get recent campaigns
    const campaigns = await campaignOperations.findByUserId(userId);
    const recentCampaigns = campaigns.slice(0, limit);
    
    // Combine and format activities
    const activities: RecentActivity[] = [];
    
    recentMessages.forEach(message => {
      activities.push({
        id: message.id,
        type: 'message',
        description: `Message sent to ${(message as any).prospects?.linkedin_data?.name || 'prospect'}`,
        timestamp: message.created_at
      });
    });
    
    recentConnections.forEach(prospect => {
      activities.push({
        id: prospect.id,
        type: 'connection',
        description: `Connection request sent to ${prospect.linkedin_data.name}`,
        timestamp: prospect.automation.connectionRequestDate || prospect.created_at
      });
    });
    
    recentCampaigns.forEach(campaign => {
      activities.push({
        id: campaign.id,
        type: 'campaign',
        description: `Campaign "${campaign.name}" ${campaign.status}`,
        timestamp: campaign.created_at
      });
    });
    
    // Sort by timestamp and limit
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const limitedActivities = activities.slice(0, limit);
    
    res.json({
      success: true,
      activities: limitedActivities
    });
    
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch recent activity' 
    });
  }
}

export default withAuth(handler);