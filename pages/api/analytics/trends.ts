import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/withAuth';
import { prospectOperations, messageOperations } from '../../../lib/database';

interface TrendDataPoint {
  date: string;
  value: number;
  label: string;
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
    const { dateRange = '30', type = 'connections' } = req.query;
    
    const daysAgo = parseInt(dateRange as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Generate date labels for the last N days
    const dateLabels = [];
    const currentDate = new Date(startDate);
    while (currentDate <= new Date()) {
      dateLabels.push(new Date(currentDate).toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    let trendData: TrendDataPoint[] = [];

    if (type === 'connections') {
      // Get prospects and filter for connections
      const prospects = await prospectOperations.findByUserId(userId);
      const connections = prospects.filter(p => 
        ['connection_sent', 'connected', 'message_sent', 'message_replied'].includes(p.status) &&
        p.automation.connectionRequestDate &&
        new Date(p.automation.connectionRequestDate) >= startDate
      );

      // Group by date
      const connectionsByDate = connections.reduce((acc, p) => {
        const date = new Date(p.automation.connectionRequestDate!).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Map to date labels
      trendData = dateLabels.map(date => {
        return {
          date,
          value: connectionsByDate[date] || 0,
          label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        };
      });

    } else if (type === 'messages') {
      // Get messages and filter for sent messages
      const messages = await messageOperations.findByUserId(userId);
      const sentMessages = messages.filter(m => 
        m.type === 'sent' && new Date(m.created_at) >= startDate
      );

      // Group by date
      const messagesByDate = sentMessages.reduce((acc, m) => {
        const date = new Date(m.created_at).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Map to date labels
      trendData = dateLabels.map(date => {
        return {
          date,
          value: messagesByDate[date] || 0,
          label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        };
      });

    } else if (type === 'responses') {
      // Get messages and filter for received messages
      const messages = await messageOperations.findByUserId(userId);
      const receivedMessages = messages.filter(m => 
        m.type === 'received' && new Date(m.created_at) >= startDate
      );

      // Group by date
      const responsesByDate = receivedMessages.reduce((acc, m) => {
        const date = new Date(m.created_at).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Map to date labels
      trendData = dateLabels.map(date => {
        return {
          date,
          value: responsesByDate[date] || 0,
          label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        };
      });

    } else if (type === 'prospects') {
      // Get prospects and filter by date
      const prospects = await prospectOperations.findByUserId(userId);
      const newProspects = prospects.filter(p => 
        new Date(p.created_at) >= startDate
      );

      // Group by date
      const prospectsByDate = newProspects.reduce((acc, p) => {
        const date = new Date(p.created_at).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Map to date labels
      trendData = dateLabels.map(date => {
        return {
          date,
          value: prospectsByDate[date] || 0,
          label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        };
      });
    }

    res.json({
      success: true,
      trends: {
        type,
        dateRange: daysAgo,
        data: trendData
      }
    });

  } catch (error) {
    console.error('Error fetching analytics trends:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch analytics trends' 
    });
  }
}

export default withAuth(handler);