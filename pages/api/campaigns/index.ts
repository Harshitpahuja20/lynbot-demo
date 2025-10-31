import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/withAuth';
import { campaignOperations, userOperations } from '../../../lib/database';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {

  switch (req.method) {
    case 'GET':
      return handleGetCampaigns(req, res);
    case 'POST':
      return handleCreateCampaign(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({
        success: false,
        error: `Method ${req.method} not allowed`
      });
  }
}

async function handleGetCampaigns(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const userId = req.user.id;
    
    const [campaigns, user] = await Promise.all([
      campaignOperations.findByUserId(userId),
      userOperations.findById(userId)
    ]);

    res.json({
      success: true,
      campaigns,
      user: {
        linkedin_accounts: user?.linkedin_accounts || []
      }
    });

  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch campaigns' 
    });
  }
}

async function handleCreateCampaign(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const userId = req.user.id;
    
    // Check subscription limits
    const user = await userOperations.findById(userId);
    if (user?.subscription?.plan === 'free') {
      const campaigns = await campaignOperations.findByUserId(userId);
      const campaignCount = campaigns.length;
      if (campaignCount >= 1) {
        return res.status(403).json({ 
          success: false,
          error: 'Free plan allows only 1 campaign. Upgrade to create more campaigns.' 
        });
      }
    }
    
    const campaignData = { 
      ...req.body, 
      user_id: userId,
      status: 'draft',
      search_criteria: req.body.searchCriteria || {},
      salesnavigatorcriteria: req.body.salesNavigatorCriteria || {},
      message_templates: {
        connectionRequest: {
          enabled: true,
          template: '',
          tone: 'professional',
          useAI: true,
          customPrompt: ''
        },
        welcomeMessage: {
          enabled: true,
          template: '',
          tone: 'professional',
          useAI: true,
          customPrompt: '',
          delay: 24
        },
        followUpSequence: []
      },
      automation: {
        enabled: false,
        dailyLimits: {
          connections: 50,
          messages: 25
        },
        timing: {
          workingHours: { start: 9, end: 18 },
          workingDays: [1, 2, 3, 4, 5],
          randomDelay: { min: 30, max: 300 }
        },
        withdrawInvitations: {
          enabled: true,
          afterDays: 7
        }
      },
      statistics: {
        totalProspects: 0,
        connectionsSent: 0,
        connectionsAccepted: 0,
        messagesSent: 0,
        messagesReplied: 0,
        profileViews: 0,
        acceptanceRate: 0,
        responseRate: 0,
        lastActivity: null
      },
      integrations: {
        webhooks: [],
        zapier: { enabled: false },
        make: { enabled: false },
        n8n: { enabled: false }
      },
      tags: [],
      priority: 0,
      is_active: true
    };

    const campaign = await campaignOperations.create(campaignData);

    console.log(`New campaign created: ${campaign.name}`);

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      campaign
    });

  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create campaign' 
    });
  }
}

export default withAuth(handler);