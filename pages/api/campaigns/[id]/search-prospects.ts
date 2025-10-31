import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../../lib/middleware/withAuth';
import { campaignOperations, prospectOperations, userOperations } from '../../../../lib/database';
import LinkedInService from '../../../../lib/services/linkedinService';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`
    });
  }

  try {
    const userId = req.user.id;
    const { id: campaignId } = req.query;
    const { maxResults = 25 } = req.body;

    // Get campaign
    const campaign = await campaignOperations.findById(campaignId as string, userId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    // Get user's LinkedIn account
    const user = await userOperations.findById(userId);
    if (!user || !user.linkedin_accounts || user.linkedin_accounts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No LinkedIn account configured. Please add your LinkedIn credentials in Settings.'
      });
    }

    const linkedinAccount = user.linkedin_accounts[0];
    
    // Initialize LinkedIn service
    const linkedinService = new LinkedInService();
    
    try {
      // Login to LinkedIn
      const loginSuccess = await linkedinService.login({
        email: linkedinAccount.email,
        encryptedPassword: linkedinAccount.encryptedPassword
      });

      if (!loginSuccess) {
        return res.status(400).json({
          success: false,
          error: 'Failed to login to LinkedIn. Please check your credentials.'
        });
      }

      // Search for prospects
      const prospects = await linkedinService.searchProspects(
        campaign.search_criteria,
        maxResults
      );

      // Save prospects to database
      let newProspects = 0;
      const savedProspects = [];

      for (const prospectData of prospects) {
        try {
          // Check if prospect already exists
          const existingProspects = await prospectOperations.findByUserId(userId);
          const exists = existingProspects.some(p => 
            p.linkedin_data.profileUrl === prospectData.profileUrl
          );

          if (!exists) {
            // Create prospect with proper type structure
            const prospectCreateData = {
              user_id: userId,
              campaign_id: campaignId as string,
              linkedin_data: prospectData,
              contact_info: {},
              status: 'new' as const,
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
              source: 'search' as const,
              search_query: JSON.stringify(campaign.search_criteria),
              is_active: true,
              last_updated: new Date().toISOString()
            };

            const prospect = await prospectOperations.create(prospectCreateData);

            savedProspects.push(prospect);
            newProspects++;
          }
        } catch (error) {
          console.error('Error saving prospect:', error);
        }
      }

      // Update campaign statistics
      await campaignOperations.update(campaignId as string, userId, {
        statistics: {
          ...campaign.statistics,
          totalProspects: campaign.statistics.totalProspects + newProspects,
          lastActivity: new Date().toISOString()
        }
      });

      res.json({
        success: true,
        message: `Found ${prospects.length} prospects, ${newProspects} new prospects added`,
        results: {
          totalFound: prospects.length,
          newProspects,
          existingProspects: prospects.length - newProspects
        }
      });

    } finally {
      await linkedinService.close();
    }

  } catch (error) {
    console.error('Error searching prospects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search prospects'
    });
  }
}

export default withAuth(handler);