import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  TrendingUp, 
  UserCheck,
  UserX,
  CreditCard,
  RefreshCw,
  Calendar,
  Loader2,
  AlertCircle,
  X
} from 'lucide-react';

interface AdminAnalytics {
  users: {
    total: number;
    active: number;
    inactive: number;
    newThisMonth: number;
    growth: number;
  };
  subscriptions: {
    free: number;
    premium: number;
    totalRevenue: number;
    monthlyRevenue: number;
    refunds: number;
    churnRate: number;
  };
  platform: {
    totalCampaigns: number;
    totalProspects: number;
    totalMessages: number;
    apiUsage: number;
  };
  trends: {
    userGrowth: Array<{ date: string; value: number; label: string }>;
    revenue: Array<{ date: string; value: number; label: string }>;
  };
}

const AdminAnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('30');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        window.location.href = '/signin';
        return;
      }

      const response = await fetch(`/api/admin/analytics?dateRange=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/signin';
          return;
        }
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      if (data.success) {
        setAnalytics(data.analytics);
      } else {
        throw new Error(data.error || 'Failed to fetch analytics');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading analytics...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout error={error} onClearError={() => setError('')}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
            <p className="text-gray-600">Monitor user activity, revenue, and platform performance</p>
          </div>
          <div className="flex items-center space-x-3">
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Users
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {analytics?.users.total || 0}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      +{analytics?.users.newThisMonth || 0}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Users
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {analytics?.users.active || 0}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-gray-600">
                      {analytics?.users.inactive || 0} inactive
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Monthly Revenue
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      ${analytics?.subscriptions.monthlyRevenue || 0}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      +12%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CreditCard className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Premium Users
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {analytics?.subscriptions.premium || 0}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-gray-600">
                      of {analytics?.users.total || 0}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* User Status Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">User Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <UserCheck className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-sm font-medium text-gray-700">Active Users</span>
                </div>
                <div className="flex items-center">
                  <span className="text-lg font-semibold text-gray-900 mr-2">
                    {analytics?.users.active || 0}
                  </span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ 
                        width: `${analytics?.users.total ? (analytics.users.active / analytics.users.total) * 100 : 0}%` 
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <UserX className="h-5 w-5 text-red-500 mr-3" />
                  <span className="text-sm font-medium text-gray-700">Inactive Users</span>
                </div>
                <div className="flex items-center">
                  <span className="text-lg font-semibold text-gray-900 mr-2">
                    {analytics?.users.inactive || 0}
                  </span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ 
                        width: `${analytics?.users.total ? (analytics.users.inactive / analytics.users.total) * 100 : 0}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Revenue</span>
                <span className="text-lg font-semibold text-gray-900">
                  ${analytics?.subscriptions.totalRevenue || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Monthly Revenue</span>
                <span className="text-lg font-semibold text-gray-900">
                  ${analytics?.subscriptions.monthlyRevenue || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Refunds</span>
                <span className="text-lg font-semibold text-red-600">
                  ${analytics?.subscriptions.refunds || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Churn Rate</span>
                <span className="text-lg font-semibold text-gray-900">
                  {analytics?.subscriptions.churnRate || 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Usage */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Usage</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{analytics?.platform.totalCampaigns || 0}</div>
              <div className="text-sm text-gray-600">Total Campaigns</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{analytics?.platform.totalProspects || 0}</div>
              <div className="text-sm text-gray-600">Total Prospects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{analytics?.platform.totalMessages || 0}</div>
              <div className="text-sm text-gray-600">Messages Sent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{analytics?.platform.apiUsage || 0}</div>
              <div className="text-sm text-gray-600">API Calls</div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <div className="h-2 w-2 rounded-full bg-green-400 mr-3"></div>
              <span className="text-gray-600">New user registration: john@example.com</span>
              <span className="text-gray-400 ml-auto">2 hours ago</span>
            </div>
            <div className="flex items-center text-sm">
              <div className="h-2 w-2 rounded-full bg-blue-400 mr-3"></div>
              <span className="text-gray-600">Premium subscription activated: sarah@company.com</span>
              <span className="text-gray-400 ml-auto">4 hours ago</span>
            </div>
            <div className="flex items-center text-sm">
              <div className="h-2 w-2 rounded-full bg-purple-400 mr-3"></div>
              <span className="text-gray-600">Campaign created: "Q4 Outreach"</span>
              <span className="text-gray-400 ml-auto">6 hours ago</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalyticsPage;