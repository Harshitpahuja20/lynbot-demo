import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/withAuth';
import { searchResultOperations, campaignOperations } from '../../../lib/database';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const userId = req.user.id;
    const { campaignId, results, totalResults } = req.body;

    if (!campaignId || !results) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Fetch campaign to get search filters
    const campaign = await campaignOperations.findById(campaignId, userId);
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    // Use campaign's search criteria as filters
    const searchFilters = campaign.salesNavigatorCriteria || campaign.searchCriteria || {};

    await searchResultOperations.create({
      campaign_id: campaignId,
      user_id: userId,
      search_filters: searchFilters,
      results: results,
      total_results: totalResults || results.length,
      status: 'completed'
    });

    res.json({ success: true, message: 'Search results saved' });
  } catch (error) {
    console.error('Error saving search results:', error);
    res.status(500).json({ success: false, error: 'Failed to save search results' });
  }
}

export default withAuth(handler);