import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/withAuth';
import { campaignOperations } from '../../../lib/database';

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

    const campaign = await campaignOperations.update(id, userId, updates);

    if (!campaign) {
      return res.status(404).json({ 
        success: false,
        error: 'Campaign not found' 
      });
    }

    console.log(`Campaign updated: ${campaign.name}`);

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

    await campaignOperations.delete(id, userId);

    console.log(`Campaign deleted: ${campaign.name}`);

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