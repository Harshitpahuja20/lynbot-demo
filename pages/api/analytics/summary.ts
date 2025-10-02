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
    const { dateRange = '30' } = req.query; // days
    
    const daysAgo = parseInt(dateRange as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Get total campaigns
    const campaigns = await campaignOperations.findByUserId(userId);
    const totalCampaigns = campaigns.length;

    // Get active campaigns
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

    // Get total prospects
    const prospects = await prospectOperations.findByUserId(userId);
    const totalProspects = prospects.length;

    // Get prospects added in date range
    const newProspects = prospects.filter(p => 
      new Date(p.created_at) >= startDate
    ).length;

    // Get connection requests sent
    const connectionsSent = prospects.filter(p => 
      ['connection_sent', 'connected', 'message_sent', 'message_replied'].includes(p.status) &&
      p.automation.connectionRequestDate &&
      new Date(p.automation.connectionRequestDate) >= startDate
    ).length;

    // Get connections accepted
    const connectionsAccepted = prospects.filter(p => 
      ['connected', 'message_sent', 'message_replied'].includes(p.status)
    ).length;

    // Get messages sent
    const messages = await messageOperations.findByUserId(userId);
    const messagesSent = messages.filter(m => 
      m.type === 'sent' && new Date(m.created_at) >= startDate
    ).length;

    // Get messages replied
    const messagesReplied = messages.filter(m => 
      m.type === 'received' && new Date(m.created_at) >= startDate
    ).length;

    // Get profile views (estimated from prospects viewed)
    const profileViews = newProspects;

    // Calculate rates
    const connectionRate = connectionsSent > 0 ? Math.round((connectionsAccepted / connectionsSent) * 100) : 0;
    const responseRate = messagesSent > 0 ? Math.round((messagesReplied / messagesSent) * 100) : 0;

    // Calculate campaign averages
    const campaignData = {
      totalConnectionsSent: campaigns.reduce((sum, c) => sum + c.statistics.connectionsSent, 0),
      totalConnectionsAccepted: campaigns.reduce((sum, c) => sum + c.statistics.connectionsAccepted, 0),
      totalMessagesSent: campaigns.reduce((sum, c) => sum + c.statistics.messagesSent, 0),
      totalMessagesReplied: campaigns.reduce((sum, c) => sum + c.statistics.messagesReplied, 0),
      avgAcceptanceRate: campaigns.length > 0 ? 
        Math.round(campaigns.reduce((sum, c) => sum + c.statistics.acceptanceRate, 0) / campaigns.length) : 0,
      avgResponseRate: campaigns.length > 0 ? 
        Math.round(campaigns.reduce((sum, c) => sum + c.statistics.responseRate, 0) / campaigns.length) : 0
    };

    const summary = {
      overview: {
        totalCampaigns,
        activeCampaigns,
        totalProspects,
        newProspects
      },
      performance: {
        connectionsSent,
        connectionsAccepted,
        connectionRate,
        messagesSent,
        messagesReplied,
        responseRate,
        profileViews
      },
      campaignAverages: {
        avgAcceptanceRate: Math.round(campaignData.avgAcceptanceRate || 0),
        avgResponseRate: Math.round(campaignData.avgResponseRate || 0),
        totalConnectionsSent: campaignData.totalConnectionsSent,
        totalConnectionsAccepted: campaignData.totalConnectionsAccepted,
        totalMessagesSent: campaignData.totalMessagesSent,
        totalMessagesReplied: campaignData.totalMessagesReplied
      },
      dateRange: {
        days: daysAgo,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      }
    };

    res.json({
      success: true,
      summary
    });

  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch analytics summary' 
    });
  }
}

export default withAuth(handler);