import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Calendar,
  Target,
  Eye,
  ArrowUp,
  ArrowDown,
  Minus,
  Loader2,
  AlertCircle,
  X,
  RefreshCw
} from 'lucide-react';

interface AnalyticsSummary {
  overview: {
    totalCampaigns: number;
    activeCampaigns: number;
    totalProspects: number;
    newProspects: number;
  };
  performance: {
    connectionsSent: number;
    connectionsAccepted: number;
    connectionRate: number;
    messagesSent: number;
    messagesReplied: number;
    responseRate: number;
    profileViews: number;
  };
  campaignAverages: {
    avgAcceptanceRate: number;
    avgResponseRate: number;
    totalConnectionsSent: number;
    totalConnectionsAccepted: number;
    totalMessagesSent: number;
    totalMessagesReplied: number;
  };
  dateRange: {
    days: number;
    startDate: string;
    endDate: string;
  };
}

interface TrendData {
  type: string;
  dateRange: number;
  data: Array<{
    date: string;
    value: number;
    label: string;
  }>;
}

interface CampaignAnalytics {
  performance: Array<{
    id: string;
    name: string;
    status: string;
    prospects: number;
    connectionsSent: number;
    connectionsAccepted: number;
    messagesSent: number;
    messagesReplied: number;
    acceptanceRate: number;
    responseRate: number;
    createdAt: string;
    lastActivity?: string;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  totalCampaigns: number;
}

const AnalyticsPage: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [connectionTrends, setConnectionTrends] = useState<TrendData | null>(null);
  const [messageTrends, setMessageTrends] = useState<TrendData | null>(null);
  const [campaignAnalytics, setCampaignAnalytics] = useState<CampaignAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('30');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError('');

      const token = sessionStorage.getItem('token');
      if (!token) {
        window.location.href = '/signin';
        return;
      }

      // Fetch all analytics data
      const [summaryRes, connectionTrendsRes, messageTrendsRes, campaignRes] = await Promise.all([
        fetch(`/api/analytics/summary?dateRange=${dateRange}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/analytics/trends?dateRange=${dateRange}&type=connections`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/analytics/trends?dateRange=${dateRange}&type=messages`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/analytics/campaigns', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!summaryRes.ok || !connectionTrendsRes.ok || !messageTrendsRes.ok || !campaignRes.ok) {
        if (summaryRes.status === 401) {
          window.location.href = '/signin';
          return;
        }
        throw new Error('Failed to fetch analytics data');
      }

      const [summaryData, connectionData, messageData, campaignData] = await Promise.all([
        summaryRes.json(),
        connectionTrendsRes.json(),
        messageTrendsRes.json(),
        campaignRes.json()
      ]);

      if (summaryData.success) setSummary(summaryData.summary);
      if (connectionData.success) setConnectionTrends(connectionData.trends);
      if (messageData.success) setMessageTrends(messageData.trends);
      if (campaignData.success) setCampaignAnalytics(campaignData.campaigns);

    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <ArrowUp className="h-4 w-4 text-green-500" />;
    if (current < previous) return <ArrowDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const SimpleChart: React.FC<{ data: TrendData; color: string; title: string }> = ({ data, color, title }) => {
    const maxValue = Math.max(...data.data.map(d => d.value));
    const minValue = Math.min(...data.data.map(d => d.value));
    const range = maxValue - minValue || 1;

    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <div className="h-64 flex items-end justify-between space-x-1">
          {data.data.map((point, index) => {
            const height = maxValue > 0 ? ((point.value - minValue) / range) * 200 + 20 : 20;
            return (
              <div key={index} className="flex flex-col items-center flex-1">
                <div className="text-xs text-gray-600 mb-1">{point.value}</div>
                <div
                  className={`w-full ${color} rounded-t transition-all duration-300`}
                  style={{ height: `${height}px` }}
                  title={`${point.label}: ${point.value}`}
                />
                <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-left">
                  {point.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading analytics...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
            <button
              onClick={() => setError('')}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600">Track your LinkedIn automation performance and insights</p>
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
                    Connection Rate
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {summary?.performance.connectionRate || 0}%
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      {summary?.performance.connectionsAccepted || 0}/{summary?.performance.connectionsSent || 0}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MessageSquare className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Response Rate
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {summary?.performance.responseRate || 0}%
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      {summary?.performance.messagesReplied || 0}/{summary?.performance.messagesSent || 0}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Eye className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Profile Views
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatNumber(summary?.performance.profileViews || 0)}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      +{summary?.overview.newProspects || 0}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Target className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Campaigns
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {summary?.overview.activeCampaigns || 0}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-gray-600">
                      of {summary?.overview.totalCampaigns || 0}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {connectionTrends && (
            <SimpleChart 
              data={connectionTrends} 
              color="bg-blue-500" 
              title="Connection Requests Over Time" 
            />
          )}
          
          {messageTrends && (
            <SimpleChart 
              data={messageTrends} 
              color="bg-green-500" 
              title="Messages Sent Over Time" 
            />
          )}
        </div>

        {/* Campaign Performance */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Campaign Performance</h3>
          </div>
          
          {campaignAnalytics && campaignAnalytics.performance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campaign
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prospects
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Connections
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acceptance Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Messages
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Response Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {campaignAnalytics.performance.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                        <div className="text-sm text-gray-500">
                          Created {new Date(campaign.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {campaign.prospects}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {campaign.connectionsAccepted}/{campaign.connectionsSent}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">{campaign.acceptanceRate}%</span>
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${Math.min(campaign.acceptanceRate, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {campaign.messagesReplied}/{campaign.messagesSent}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">{campaign.responseRate}%</span>
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${Math.min(campaign.responseRate, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No campaign data available</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start running campaigns to see detailed analytics and performance insights.
              </p>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Summary for Last {summary.dateRange.days} Days
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{summary.performance.connectionsSent}</div>
                <div className="text-gray-600">Connections Sent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{summary.performance.connectionsAccepted}</div>
                <div className="text-gray-600">Connections Accepted</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{summary.performance.messagesSent}</div>
                <div className="text-gray-600">Messages Sent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{summary.performance.messagesReplied}</div>
                <div className="text-gray-600">Messages Replied</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AnalyticsPage;