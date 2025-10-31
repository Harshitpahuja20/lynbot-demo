import { NextApiResponse } from 'next';
import { withAdminAuth, AuthenticatedRequest } from '../../../lib/middleware/withAuth';
import { userOperations, campaignOperations, prospectOperations, messageOperations } from '../../../lib/database';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`
    });
  }

  try {
    const { dateRange = '30' } = req.query;
    const daysAgo = parseInt(dateRange as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Get all users
    const { users: allUsers } = await userOperations.findAll();
    
    // Calculate user metrics
    const totalUsers = allUsers.length;
    const activeUsers = allUsers.filter(u => u.is_active).length;
    const inactiveUsers = totalUsers - activeUsers;
    const newUsersThisMonth = allUsers.filter(u => 
      new Date(u.created_at) >= startDate
    ).length;

    // Calculate subscription metrics
    const freeUsers = allUsers.filter(u => u.subscription.plan === 'free').length;
    const premiumUsers = allUsers.filter(u => u.subscription.plan === 'full_access').length;
    
    // Mock revenue data (in a real app, you'd have a payments table)
    const totalRevenue = premiumUsers * 29.99; // Assuming $29.99/month
    const monthlyRevenue = premiumUsers * 29.99;
    const refunds = 0; // Mock data
    const churnRate = 5; // Mock data

    // Get platform usage data
    let totalCampaigns = 0;
    let totalProspects = 0;
    let totalMessages = 0;

    try {
      // Get campaigns for all users
      for (const user of allUsers) {
        const userCampaigns = await campaignOperations.findByUserId(user.id);
        totalCampaigns += userCampaigns.length;

        const userProspects = await prospectOperations.findByUserId(user.id);
        totalProspects += userProspects.length;

        const userMessages = await messageOperations.findByUserId(user.id);
        totalMessages += userMessages.length;
      }
    } catch (platformError) {
      console.error('Error fetching platform data:', platformError);
      // Continue with 0 values if platform data fails
    }

    // Generate trend data (mock data for now)
    const generateTrendData = (baseValue: number, days: number) => {
      const data = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const variation = Math.random() * 0.2 - 0.1; // ±10% variation
        const value = Math.max(0, Math.floor(baseValue * (1 + variation)));
        data.push({
          date: date.toISOString().split('T')[0],
          value,
          label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        });
      }
      return data;
    };

    const analytics = {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        newThisMonth: newUsersThisMonth,
        growth: newUsersThisMonth > 0 ? Math.round((newUsersThisMonth / Math.max(totalUsers - newUsersThisMonth, 1)) * 100) : 0
      },
      subscriptions: {
        free: freeUsers,
        premium: premiumUsers,
        totalRevenue,
        monthlyRevenue,
        refunds,
        churnRate
      },
      platform: {
        totalCampaigns,
        totalProspects,
        totalMessages,
        apiUsage: totalMessages * 2 // Mock API usage
      },
      trends: {
        userGrowth: generateTrendData(Math.floor(totalUsers / daysAgo), daysAgo),
        revenue: generateTrendData(Math.floor(monthlyRevenue / daysAgo), daysAgo)
      }
    };

    res.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics'
    });
  }
}

export default withAdminAuth(handler);