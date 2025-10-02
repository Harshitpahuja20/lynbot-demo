import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/withAuth';
import { campaignOperations } from '../../../lib/database';

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
    
    // Get campaign performance data
    const campaigns = await campaignOperations.findByUserId(userId);

    const campaignPerformance = campaigns
      .sort((a, b) => {
        const aActivity = a.statistics.lastActivity ? new Date(a.statistics.lastActivity).getTime() : 0;
        const bActivity = b.statistics.lastActivity ? new Date(b.statistics.lastActivity).getTime() : 0;
        return bActivity - aActivity;
      })
      .slice(0, 10)
      .map(campaign => ({
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      prospects: campaign.statistics.totalProspects,
      connectionsSent: campaign.statistics.connectionsSent,
      connectionsAccepted: campaign.statistics.connectionsAccepted,
      messagesSent: campaign.statistics.messagesSent,
      messagesReplied: campaign.statistics.messagesReplied,
      acceptanceRate: campaign.statistics.acceptanceRate,
      responseRate: campaign.statistics.responseRate,
      createdAt: campaign.created_at,
      lastActivity: campaign.statistics.lastActivity
    }));

    // Calculate status distribution
    const statusCounts = campaigns.reduce((acc, campaign) => {
      acc[campaign.status] = (acc[campaign.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusData: Array<{status: string; count: number; percentage: number}> = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count: count as number,
      percentage: 0
    }));

    // Calculate total for percentages
    const totalCampaigns = campaigns.length;
    statusData.forEach(item => {
      item.percentage = totalCampaigns > 0 ? Math.round((item.count / totalCampaigns) * 100) : 0;
    });

    res.json({
      success: true,
      campaigns: {
        performance: campaignPerformance,
        statusDistribution: statusData,
        totalCampaigns
      }
    });

  } catch (error) {
    console.error('Error fetching campaign analytics:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch campaign analytics' 
    });
  }
}

export default withAuth(handler);