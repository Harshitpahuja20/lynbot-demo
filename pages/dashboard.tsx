import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getCurrentUser } from '../utils/auth';
import Layout from '../components/Layout';
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Loader2,
  Settings
} from 'lucide-react';

interface DashboardStats {
  totalConnections: number;
  messagesSent: number;
  responseRate: number;
  activeCampaigns: number;
}

interface RecentActivity {
  id: string;
  type: 'connection' | 'message' | 'campaign';
  description: string;
  timestamp: string;
}

const Dashboard: React.FC = () => {
  const router = useRouter();
  const user = getCurrentUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/signin');
      return;
    }
    
    // Redirect admin users to admin panel
    if (user.role === 'admin') {
      router.push('/admin/analytics');
      return;
    }
    
    // Only fetch data if we have a valid user
    if (user.id) {
      fetchDashboardData();
    }
  }, [user?.id, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        router.push('/signin');
        return;
      }
      
      // Fetch user stats
      const statsResponse = await fetch('/api/user/dashboard-stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (statsResponse.ok) {
        // Only parse JSON if status is not 304
        if (statsResponse.status !== 304) {
          const statsData = await statsResponse.json();
          if (statsData.success) {
            setStats(statsData.stats);
          }
        } else {
          // Handle 304: data is not modified, so current state is valid
          console.log('Dashboard stats not modified (304). Using cached data.');
        }
      } else {
        console.error('Failed to fetch dashboard stats:', statsResponse.status, await statsResponse.text());
        setError('Failed to load dashboard stats.');
      }
      
      // Fetch recent activity
      const activityResponse = await fetch('/api/user/recent-activity', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (activityResponse.ok) {
        // Only parse JSON if status is not 304
        if (activityResponse.status !== 304) {
          const activityData = await activityResponse.json();
          if (activityData.success) {
            setRecentActivity(activityData.activities);
          }
        } else {
          // Handle 304: data is not modified, so current state is valid
          console.log('Recent activity not modified (304). Using cached data.');
        }
      } else {
        console.error('Failed to fetch recent activity:', activityResponse.status, await activityResponse.text());
        setError('Failed to load recent activity.');
      }
      
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError('Failed to load dashboard data. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearError = () => {
    setError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <Layout error={error || undefined} onClearError={handleClearError}>
      {/* Welcome Section */}
      <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            Welcome back, {user?.firstName || user?.email}!
          </h2>
          <p className="text-gray-600">
            {user?.role === 'admin' 
              ? 'You have admin access to manage users and system settings.'
              : `You're on the ${user?.subscription?.plan || 'free'} plan. Manage your LinkedIn automation campaigns and track your outreach performance.`
            }
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Connections
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.totalConnections || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Messages Sent
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.messagesSent || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Response Rate
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.responseRate || 0}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Campaigns
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.activeCampaigns || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Panel Access */}
      {user?.role === 'admin' && (
        <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Admin Panel</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/admin/users"
                className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center">
                  <Users className="h-6 w-6 text-blue-600 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">User Management</h4>
                    <p className="text-sm text-gray-500">Manage user accounts and permissions</p>
                  </div>
                </div>
              </Link>
              <div className="block p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center">
                  <Settings className="h-6 w-6 text-gray-400 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">System Settings</h4>
                    <p className="text-sm text-gray-400">Coming soon...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center text-sm">
                  <div className={`h-2 w-2 rounded-full mr-3 ${
                    activity.type === 'connection' ? 'bg-green-400' :
                    activity.type === 'message' ? 'bg-blue-400' :
                    'bg-purple-400'
                  }`}></div>
                  <span className="text-gray-600">{activity.description}</span>
                  <span className="text-gray-400 ml-auto">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No recent activity to display.</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;