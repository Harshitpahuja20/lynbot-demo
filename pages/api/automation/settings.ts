import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/withAuth';
import { userOperations } from '../../../lib/database';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {

  switch (req.method) {
    case 'GET':
      return handleGetSettings(req, res);
    case 'PUT':
      return handleUpdateSettings(req, res);
    default:
      res.setHeader('Allow', ['GET', 'PUT']);
      return res.status(405).json({
        success: false,
        error: `Method ${req.method} not allowed`
      });
  }
}

async function handleGetSettings(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const userId = req.user.id;

    const user = await userOperations.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    // Get automation settings from user's settings and LinkedIn accounts
    const automationSettings = {
      globalSettings: {
        enabled: user.settings.automation?.enabled || false,
        workingHours: user.settings.workingHours || { start: 9, end: 18 },
        workingDays: user.settings.workingDays || [1, 2, 3, 4, 5],
        timezone: user.settings.timezone || 'UTC'
      },
      dailyLimits: user.linkedin_accounts?.[0]?.dailyLimits || {
        connections: 50,
        messages: 25,
        profileViews: 100
      },
      dailyUsage: user.linkedin_accounts?.[0]?.dailyUsage || {
        connections: 0,
        messages: 0,
        profileViews: 0,
        lastReset: new Date().toISOString()
      },
      automationTypes: {
        connectionRequests: {
          enabled: user.settings.automation?.connectionRequests?.enabled || false,
          dailyLimit: user.linkedin_accounts?.[0]?.dailyLimits?.connections || 50,
          currentUsage: user.linkedin_accounts?.[0]?.dailyUsage?.connections || 0
        },
        welcomeMessages: {
          enabled: user.settings.automation?.welcomeMessages?.enabled || false,
          dailyLimit: user.linkedin_accounts?.[0]?.dailyLimits?.messages || 25,
          currentUsage: user.linkedin_accounts?.[0]?.dailyUsage?.messages || 0
        },
        followUpMessages: {
          enabled: user.settings.automation?.followUpMessages?.enabled || false,
          dailyLimit: Math.floor((user.linkedin_accounts?.[0]?.dailyLimits?.messages || 25) / 2),
          currentUsage: Math.floor((user.linkedin_accounts?.[0]?.dailyUsage?.messages || 0) / 2)
        },
        profileViews: {
          enabled: user.settings.automation?.profileViews?.enabled || false,
          dailyLimit: user.linkedin_accounts?.[0]?.dailyLimits?.profileViews || 100,
          currentUsage: user.linkedin_accounts?.[0]?.dailyUsage?.profileViews || 0
        }
      }
    };

    res.json({
      success: true,
      settings: automationSettings
    });

  } catch (error) {
    console.error('Error fetching automation settings:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch automation settings' 
    });
  }
}

async function handleUpdateSettings(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const userId = req.user.id;
    const { globalSettings, dailyLimits, automationTypes } = req.body;

    // Get current user
    const currentUser = await userOperations.findById(userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Prepare updated settings
    const updatedSettings = { ...currentUser.settings };
    const updatedLinkedInAccounts = [...currentUser.linkedin_accounts];
    if (globalSettings) {
      updatedSettings.automation = {
        ...updatedSettings.automation,
        enabled: globalSettings.enabled
      };
     updatedSettings.timezone = globalSettings.timezone;
      updatedSettings.workingHours = globalSettings.workingHours;
      updatedSettings.workingDays = globalSettings.workingDays;
    }

    if (automationTypes) {
      updatedSettings.automation = {
        ...updatedSettings.automation,
        connectionRequests: { enabled: automationTypes.connectionRequests?.enabled || false },
        welcomeMessages: { enabled: automationTypes.welcomeMessages?.enabled || false },
        followUpMessages: { enabled: automationTypes.followUpMessages?.enabled || false },
        profileViews: { enabled: automationTypes.profileViews?.enabled || false }
      };
    }

    if (dailyLimits) {
      if (updatedLinkedInAccounts[0]) {
        updatedLinkedInAccounts[0] = {
          ...updatedLinkedInAccounts[0],
          dailyLimits
        };
      }
    }

    // Update user
    const user = await userOperations.update(userId, {
      settings: updatedSettings,
      linkedin_accounts: updatedLinkedInAccounts
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log(`Automation settings updated for user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Automation settings updated successfully'
    });

  } catch (error) {
    console.error('Error updating automation settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update automation settings'
    });
  }
}

export default withAuth(handler);