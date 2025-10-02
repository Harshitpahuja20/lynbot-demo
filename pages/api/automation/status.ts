import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/withAuth';
import { userOperations, campaignOperations } from '../../../lib/database';

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

    // Get user's automation settings and usage
    const user = await userOperations.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    // Get active campaigns count
    const campaigns = await campaignOperations.findByUserId(userId);
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

    // Get today's usage
    const linkedinAccount = user.linkedin_accounts?.[0];
    const dailyUsage = linkedinAccount?.dailyUsage || {
      connections: 0,
      messages: 0,
      profileViews: 0,
      lastReset: new Date().toISOString()
    };

    const dailyLimits = linkedinAccount?.dailyLimits || {
      connections: 50,
      messages: 25,
      profileViews: 100
    };

    // Check if daily usage needs to be reset
    const lastReset = new Date(dailyUsage.lastReset);
    const today = new Date();
    const shouldReset = lastReset.toDateString() !== today.toDateString();

    if (shouldReset) {
      // Reset daily usage
      const updatedLinkedInAccounts = [...user.linkedin_accounts];
      if (updatedLinkedInAccounts[0]) {
        updatedLinkedInAccounts[0] = {
          ...updatedLinkedInAccounts[0],
          dailyUsage: {
            connections: 0,
            messages: 0,
            profileViews: 0,
            lastReset: today.toISOString()
          }
        };
      }
      
      await userOperations.update(userId, {
        linkedin_accounts: updatedLinkedInAccounts
      });
      
      dailyUsage.connections = 0;
      dailyUsage.messages = 0;
      dailyUsage.profileViews = 0;
    }

    // Ensure all values are numbers with fallbacks
    const safeConnections = dailyUsage.connections || 0;
    const safeMessages = dailyUsage.messages || 0;
    const safeProfileViews = dailyUsage.profileViews || 0;
    const limitConnections = dailyLimits.connections || 50;
    const limitMessages = dailyLimits.messages || 25;
    const limitProfileViews = dailyLimits.profileViews || 100;

    const automationStatus = {
      globalEnabled: user.settings.automation?.enabled || false,
      activeCampaigns,
      connectionRequests: {
        enabled: user.settings.automation?.connectionRequests?.enabled || false,
        status: (user.settings.automation?.connectionRequests?.enabled && user.settings.automation?.enabled) ? 'active' : 'paused',
        dailyUsage: safeConnections,
        dailyLimit: limitConnections,
        percentage: Math.round((safeConnections / limitConnections) * 100)
      },
      welcomeMessages: {
        enabled: user.settings.automation?.welcomeMessages?.enabled || false,
        status: (user.settings.automation?.welcomeMessages?.enabled && user.settings.automation?.enabled) ? 'active' : 'paused',
        dailyUsage: Math.floor(safeMessages * 0.6), // Assume 60% are welcome messages
        dailyLimit: Math.floor(limitMessages * 0.6),
        percentage: Math.round((safeMessages * 0.6 / (limitMessages * 0.6)) * 100)
      },
      followUpMessages: {
        enabled: user.settings.automation?.followUpMessages?.enabled || false,
        status: (user.settings.automation?.followUpMessages?.enabled && user.settings.automation?.enabled) ? 'active' : 'paused',
        dailyUsage: Math.floor(safeMessages * 0.4), // Assume 40% are follow-ups
        dailyLimit: Math.floor(limitMessages * 0.4),
        percentage: Math.round((safeMessages * 0.4 / (limitMessages * 0.4)) * 100)
      },
      profileViews: {
        enabled: user.settings.automation?.profileViews?.enabled || false,
        status: (user.settings.automation?.profileViews?.enabled && user.settings.automation?.enabled) ? 'active' : 'paused',
        dailyUsage: safeProfileViews,
        dailyLimit: limitProfileViews,
        percentage: Math.round((safeProfileViews / limitProfileViews) * 100)
      },
      workingHours: user.settings.workingHours || { start: 9, end: 18 },
      workingDays: user.settings.workingDays || [1, 2, 3, 4, 5],
      timezone: user.settings.timezone || 'UTC'
    };

    res.json({
      success: true,
      status: automationStatus
    });

  } catch (error) {
    console.error('Error fetching automation status:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch automation status' 
    });
  }
}

export default withAuth(handler);