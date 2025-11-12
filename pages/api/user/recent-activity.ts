import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/withAuth';
import { activityLogger } from '../../../lib/activity-logger';

interface RecentActivity {
  id: string;
  type: 'connection' | 'message' | 'campaign';
  description: string;
  timestamp: string;
}

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
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Get activity logs from database
    const logs = await activityLogger.getRecent(userId, limit);
    
    // Transform to RecentActivity format
    const activities: RecentActivity[] = logs.map(log => ({
      id: log.id,
      type: log.entity_type as 'connection' | 'message' | 'campaign',
      description: log.description,
      timestamp: log.created_at
    }));
    
    res.json({
      success: true,
      activities
    });
    
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch recent activity' 
    });
  }
}

export default withAuth(handler);