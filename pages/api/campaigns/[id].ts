import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/withAuth';
import { campaignOperations } from '../../../lib/database';
import { activityLogger } from '../../../lib/activity-logger';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {

  const { id } = req.query;

  switch (req.method) {
    case 'GET':
      return handleGetCampaign(req, res, id as string);
    case 'PUT':
      return handleUpdateCampaign(req, res, id as string);
    case 'DELETE':
      return handleDeleteCampaign(req, res, id as string);
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).json({
        success: false,
        error: `Method ${req.method} not allowed`
      });
  }
}

async function handleGetCampaign(req: AuthenticatedRequest, res: NextApiResponse, id: string) {
  try {
    const userId = req.user.id;

    const campaign = await campaignOperations.findById(id, userId);
    
    if (!campaign) {
      return res.status(404).json({ 
        success: false,
        error: 'Campaign not found' 
      });
    }

    res.json({
      success: true,
      campaign
    });

  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch campaign' 
    });
  }
}

async function handleUpdateCampaign(req: AuthenticatedRequest, res: NextApiResponse, id: string) {
  try {
    const userId = req.user.id;
    const updates = req.body;

    const oldCampaign = await campaignOperations.findById(id, userId);
    const campaign = await campaignOperations.update(id, userId, updates);

    if (!campaign) {
      return res.status(404).json({ 
        success: false,
        error: 'Campaign not found' 
      });
    }

    console.log(`Campaign updated: ${campaign.name}`);

    // Log activity based on what changed
    if (oldCampaign?.status !== campaign.status) {
      const statusText = campaign.status === 'active' ? 'activated' : 
                        campaign.status === 'paused' ? 'paused' : 
                        campaign.status === 'completed' ? 'completed' : 'updated';
      await activityLogger.log({
        userId,
        activityType: `campaign_${campaign.status}`,
        entityType: 'campaign',
        entityId: campaign.id,
        entityName: campaign.name,
        description: `Campaign "${campaign.name}" ${statusText}`
      });
    } else {
      await activityLogger.log({
        userId,
        activityType: 'campaign_updated',
        entityType: 'campaign',
        entityId: campaign.id,
        entityName: campaign.name,
        description: `Campaign "${campaign.name}" updated`
      });
    }

    res.json({
      success: true,
      message: 'Campaign updated successfully',
      campaign
    });

  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update campaign' 
    });
  }
}

async function handleDeleteCampaign(req: AuthenticatedRequest, res: NextApiResponse, id: string) {
  try {
    const userId = req.user.id;

    const campaign = await campaignOperations.findById(id, userId);

    if (!campaign) {
      return res.status(404).json({ 
        success: false,
        error: 'Campaign not found' 
      });
    }

    // Soft delete: archive instead of delete
    await campaignOperations.update(id, userId, { 
      status: 'archived',
      is_active: false 
    });

    console.log(`Campaign archived: ${campaign.name}`);

    // Log activity
    await activityLogger.log({
      userId,
      activityType: 'campaign_deleted',
      entityType: 'campaign',
      entityId: campaign.id,
      entityName: campaign.name,
      description: `Campaign "${campaign.name}" deleted`
    });

    res.json({
      success: true,
      message: 'Campaign deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete campaign' 
    });
  }
}

export default withAuth(handler);