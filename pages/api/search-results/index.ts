import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/withAuth';
import { campaignOperations, searchResultOperations, userOperations } from '../../../lib/database';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {

  switch (req.method) {
    case 'GET':
      return handleGetCampaignsResults(req, res);
    default:
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({
        success: false,
        error: `Method ${req.method} not allowed`
      });
  }
}

async function handleGetCampaignsResults(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const userId = req.user.id;
    const { page = '1', limit = '20', search = '', campaignId } = req.query;
    
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;
    
    let allResults = await searchResultOperations.findByUserId(userId);
    
    // Filter by campaign
    if (campaignId && campaignId !== 'all') {
      allResults = allResults.filter(r => {
        const cid = r.campaign_id?.id || r.campaign_id;
        return cid === campaignId;
      });
    }
    
    // Filter by search
    if (search) {
      const searchLower = (search as string).toLowerCase();
      allResults = allResults.filter(r => {
        const title = r.campaign_id?.name || '';
        const desc = r.campaign_id?.description || '';
        return title.toLowerCase().includes(searchLower) || 
               desc.toLowerCase().includes(searchLower);
      });
    }
    
    const total = allResults.length;
    const pages = Math.max(1, Math.ceil(total / limitNum));
    const searchResults = allResults.slice(skip, skip + limitNum);

    res.json({
      success: true,
      searchResults,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages
      }
    });

  } catch (error) {
    console.error('Error fetching search results:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch campaigns' 
    });
  }
}

export default withAuth(handler);