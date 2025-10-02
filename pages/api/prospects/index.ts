import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/withAuth';
import { prospectOperations, campaignOperations } from '../../../lib/database';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {

  switch (req.method) {
    case 'GET':
      return handleGetProspects(req, res);
    case 'POST':
      return handleCreateProspect(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({
        success: false,
        error: `Method ${req.method} not allowed`
      });
  }
}

async function handleGetProspects(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, search, status, campaignId } = req.query;
    
    const prospects = await prospectOperations.findByUserId(userId, {
      page: Number(page),
      limit: Number(limit),
      search: search as string,
      status: status as string,
      campaignId: campaignId as string
    });

    res.json({
      success: true,
      prospects,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: prospects.length,
        pages: Math.ceil(prospects.length / Number(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching prospects:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch prospects' 
    });
  }
}

async function handleCreateProspect(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const userId = req.user.id;
    const { campaignId, linkedinData, contactInfo } = req.body;

    // Validation
    if (!campaignId || !linkedinData?.profileUrl || !linkedinData?.name) {
      return res.status(400).json({ 
        success: false,
        error: 'Campaign ID, LinkedIn profile URL, and name are required' 
      });
    }

    // Verify campaign belongs to user
    const campaign = await campaignOperations.findById(campaignId, userId);
    if (!campaign) {
      return res.status(404).json({ 
        success: false,
        error: 'Campaign not found' 
      });
    }

    // Create new prospect
    const prospect = await prospectOperations.create({
      user_id: userId,
      campaign_id: campaignId,
      linkedin_data: {
        profileUrl: linkedinData.profileUrl,
        name: linkedinData.name,
        firstName: linkedinData.firstName || linkedinData.name.split(' ')[0],
        lastName: linkedinData.lastName || linkedinData.name.split(' ').slice(1).join(' '),
        headline: linkedinData.headline,
        title: linkedinData.title,
        company: linkedinData.company,
        location: linkedinData.location,
        industry: linkedinData.industry,
        connectionLevel: linkedinData.connectionLevel || '3rd',
        profileImageUrl: linkedinData.profileImageUrl,
        summary: linkedinData.summary
      },
      contact_info: contactInfo || {},
      status: 'new',
      interactions: [],
      automation: {
        connectionRequestSent: false,
        connectionRequestDate: undefined,
        welcomeMessageSent: false,
        welcomeMessageDate: undefined,
        followUpsSent: 0,
        lastFollowUpDate: undefined,
        nextScheduledAction: undefined,
        nextScheduledDate: undefined,
        automationPaused: false,
        pauseReason: undefined
      },
      scoring: {
        leadScore: 0,
        factors: {
          titleMatch: 0,
          companyMatch: 0,
          locationMatch: 0,
          industryMatch: 0,
          connectionLevel: 0,
          profileCompleteness: 0,
          activityLevel: 0
        },
        lastCalculated: undefined
      },
      tags: [],
      notes: [],
      custom_fields: {},
      source: 'manual'
    });

    // Update campaign statistics
    const updatedCampaign = await campaignOperations.findById(campaignId, userId);
    if (updatedCampaign) {
      await campaignOperations.update(campaignId, userId, {
        statistics: {
          ...updatedCampaign.statistics,
          totalProspects: updatedCampaign.statistics.totalProspects + 1
        }
      });
    }

    console.log(`New prospect added: ${linkedinData.name}`);

    res.status(201).json({
      success: true,
      message: 'Prospect created successfully',
      prospect
    });

  } catch (error) {
    console.error('Error creating prospect:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create prospect' 
    });
  }
}

export default withAuth(handler);