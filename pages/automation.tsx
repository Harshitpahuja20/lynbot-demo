import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  Zap, 
  Play, 
  Pause, 
  Settings, 
  Users, 
  MessageSquare, 
  Eye,
  Clock,
  Calendar,
  Globe,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  BarChart3
} from 'lucide-react';

interface AutomationSettings {
  globalSettings: {
    enabled: boolean;
    workingHours: { start: number; end: number };
    workingDays: number[];
    timezone: string;
  };
  dailyLimits: {
    connections: number;
    messages: number;
    profileViews: number;
  };
  automationTypes: {
    connectionRequests: {
      enabled: boolean;
      dailyLimit: number;
      currentUsage: number;
    };
    welcomeMessages: {
      enabled: boolean;
      dailyLimit: number;
      currentUsage: number;
    };
    followUpMessages: {
      enabled: boolean;
      dailyLimit: number;
      currentUsage: number;
    };
    profileViews: {
      enabled: boolean;
      dailyLimit: number;
      currentUsage: number;
    };
  };
}

interface AutomationStatus {
  globalEnabled: boolean;
  activeCampaigns: number;
  connectionRequests: {
    enabled: boolean;
    status: 'active' | 'paused';
    dailyUsage: number;
    dailyLimit: number;
    percentage: number;
  };
  welcomeMessages: {
    enabled: boolean;
    status: 'active' | 'paused';
    dailyUsage: number;
    dailyLimit: number;
    percentage: number;
  };
  followUpMessages: {
    enabled: boolean;
    status: 'active' | 'paused';
    dailyUsage: number;
    dailyLimit: number;
    percentage: number;
  };
  profileViews: {
    enabled: boolean;
    status: 'active' | 'paused';
    dailyUsage: number;
    dailyLimit: number;
    percentage: number;
  };
  workingHours: { start: number; end: number };
  workingDays: number[];
  timezone: string;
}

const AutomationPage: React.FC = () => {
  const [settings, setSettings] = useState<AutomationSettings | null>(null);
  const [status, setStatus] = useState<AutomationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  // Form state for settings
  const [formData, setFormData] = useState({
    globalEnabled: false,
    connectionRequests: false,
    welcomeMessages: false,
    followUpMessages: false,
    profileViews: false,
    emailSending: false,
    workingHours: { start: 9, end: 18 },
    workingDays: [1, 2, 3, 4, 5],
    dailyLimits: {
      connections: 50,
      messages: 80,
      profileViews: 100,
      emails: 20
    }
  });

  useEffect(() => {
    fetchAutomationData();
  }, []);

  const fetchAutomationData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch both settings and status
      const [settingsResponse, statusResponse] = await Promise.all([
        fetch('/api/automation/settings', {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/automation/status', {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (!settingsResponse.ok || !statusResponse.ok) {
        if (settingsResponse.status === 401 || statusResponse.status === 401) {
          window.location.href = '/signin';
          return;
        }
        throw new Error('Failed to fetch automation data');
      }

      const settingsData = await settingsResponse.json();
      const statusData = await statusResponse.json();

      if (settingsData.success && statusData.success) {
        setSettings(settingsData.settings);
        setStatus(statusData.status);
        
        // Update form data
        setFormData({
          globalEnabled: settingsData.settings.globalSettings.enabled,
          connectionRequests: settingsData.settings.automationTypes.connectionRequests.enabled,
          welcomeMessages: settingsData.settings.automationTypes.welcomeMessages.enabled,
          followUpMessages: settingsData.settings.automationTypes.followUpMessages.enabled,
          profileViews: settingsData.settings.automationTypes.profileViews.enabled,
          emailSending: settingsData.settings.automationTypes.emailSending?.enabled || false,
          workingHours: settingsData.settings.globalSettings.workingHours,
          workingDays: settingsData.settings.globalSettings.workingDays,
          dailyLimits: settingsData.settings.dailyLimits
        });
      } else {
        throw new Error('Failed to fetch automation data');
      }
    } catch (err) {
      console.error('Error fetching automation data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch automation data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/automation/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          globalSettings: {
            enabled: formData.globalEnabled,
            workingHours: formData.workingHours,
            workingDays: formData.workingDays
          },
          dailyLimits: formData.dailyLimits,
          automationTypes: {
            connectionRequests: { enabled: formData.connectionRequests },
            welcomeMessages: { enabled: formData.welcomeMessages },
            followUpMessages: { enabled: formData.followUpMessages },
            profileViews: { enabled: formData.profileViews },
            emailSending: { enabled: formData.emailSending }
          }
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save settings');
      }

      setSuccess('Automation settings saved successfully!');
      setShowSettings(false);
      
      // Refresh data
      await fetchAutomationData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    return status === 'active' ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />;
  };

  const formatWorkingHours = (start: number, end: number) => {
    const formatHour = (hour: number) => {
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}:00 ${period}`;
    };
    return `${formatHour(start)} - ${formatHour(end)}`;
  };

  const getDayNames = (days: number[]) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map(day => dayNames[day]).join(', ');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading automation settings...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Error/Success Messages */}
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

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {success}
            <button
              onClick={() => setSuccess('')}
              className="ml-auto text-green-500 hover:text-green-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Automation</h1>
            <p className="text-gray-600">Configure and monitor your LinkedIn automation workflows</p>
          </div>
          <button 
            onClick={() => setShowSettings(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configure Settings
          </button>
        </div>

        {/* Global Status */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Automation Status</h3>
            <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              status?.globalEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {status?.globalEnabled ? (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Active
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 mr-1" />
                  Paused
                </>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center">
              <BarChart3 className="h-4 w-4 text-blue-500 mr-2" />
              <span className="text-gray-600">Active Campaigns:</span>
              <span className="ml-1 font-medium">{status?.activeCampaigns || 0}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-purple-500 mr-2" />
              <span className="text-gray-600">Working Hours:</span>
              <span className="ml-1 font-medium">
                {status ? formatWorkingHours(status.workingHours.start, status.workingHours.end) : 'N/A'}
              </span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-gray-600">Working Days:</span>
              <span className="ml-1 font-medium">
                {status ? getDayNames(status.workingDays) : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Automation Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Connection Requests */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Connection Requests</h3>
                  <p className="text-xs text-gray-500">Daily automation</p>
                </div>
              </div>
              <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                status ? getStatusColor(status.connectionRequests.status) : 'text-gray-600 bg-gray-100'
              }`}>
                {status && getStatusIcon(status.connectionRequests.status)}
                <span className="ml-1 capitalize">{status?.connectionRequests.status || 'Unknown'}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Today's Usage</span>
                <span className="font-medium">
                  {status?.connectionRequests.dailyUsage || 0} / {status?.connectionRequests.dailyLimit || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(status?.connectionRequests.percentage || 0, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">
                {status?.connectionRequests.percentage || 0}% of daily limit used
              </p>
            </div>
          </div>

          {/* Welcome Messages */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Welcome Messages</h3>
                  <p className="text-xs text-gray-500">Automated messaging</p>
                </div>
              </div>
              <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                status ? getStatusColor(status.welcomeMessages.status) : 'text-gray-600 bg-gray-100'
              }`}>
                {status && getStatusIcon(status.welcomeMessages.status)}
                <span className="ml-1 capitalize">{status?.welcomeMessages.status || 'Unknown'}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Today's Usage</span>
                <span className="font-medium">
                  {status?.welcomeMessages.dailyUsage || 0} / {status?.welcomeMessages.dailyLimit || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(status?.welcomeMessages.percentage || 0, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">
                {status?.welcomeMessages.percentage || 0}% of daily limit used
              </p>
            </div>
          </div>

          {/* Follow-up Messages */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Follow-up Messages</h3>
                  <p className="text-xs text-gray-500">Automated follow-ups</p>
                </div>
              </div>
              <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                status ? getStatusColor(status.followUpMessages.status) : 'text-gray-600 bg-gray-100'
              }`}>
                {status && getStatusIcon(status.followUpMessages.status)}
                <span className="ml-1 capitalize">{status?.followUpMessages.status || 'Unknown'}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Today's Usage</span>
                <span className="font-medium">
                  {status?.followUpMessages.dailyUsage || 0} / {status?.followUpMessages.dailyLimit || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(status?.followUpMessages.percentage || 0, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">
                {status?.followUpMessages.percentage || 0}% of daily limit used
              </p>
            </div>
          </div>

          {/* Profile Views */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Eye className="h-5 w-5 text-orange-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Profile Views</h3>
                  <p className="text-xs text-gray-500">Automated viewing</p>
                </div>
              </div>
              <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                status ? getStatusColor(status.profileViews.status) : 'text-gray-600 bg-gray-100'
              }`}>
                {status && getStatusIcon(status.profileViews.status)}
                <span className="ml-1 capitalize">{status?.profileViews.status || 'Unknown'}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Today's Usage</span>
                <span className="font-medium">
                  {status?.profileViews.dailyUsage || 0} / {status?.profileViews.dailyLimit || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(status?.profileViews.percentage || 0, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">
                {status?.profileViews.percentage || 0}% of daily limit used
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => setShowSettings(true)}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center">
                <Settings className="h-6 w-6 text-blue-600 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Configure Settings</h4>
                  <p className="text-sm text-gray-500">Adjust automation parameters</p>
                </div>
              </div>
            </button>
            
            <button 
              onClick={fetchAutomationData}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center">
                <BarChart3 className="h-6 w-6 text-green-600 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Refresh Status</h4>
                  <p className="text-sm text-gray-500">Update automation status</p>
                </div>
              </div>
            </button>
            
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center">
                <Zap className="h-6 w-6 text-gray-400 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Advanced Rules</h4>
                  <p className="text-sm text-gray-400">Coming soon...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Automation Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-6 max-h-96 overflow-y-auto">
                {/* Global Settings */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Global Settings</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Enable Automation</label>
                        <p className="text-sm text-gray-500">Master switch for all automation</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.globalEnabled}
                          onChange={(e) => setFormData(prev => ({ ...prev, globalEnabled: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Working Hours Start
                        </label>
                        <select
                          value={formData.workingHours.start}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            workingHours: { ...prev.workingHours, start: parseInt(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>
                              {i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Working Hours End
                        </label>
                        <select
                          value={formData.workingHours.end}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            workingHours: { ...prev.workingHours, end: parseInt(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>
                              {i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Automation Types */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Automation Types</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Connection Requests</label>
                        <p className="text-sm text-gray-500">Automatically send connection requests</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.connectionRequests}
                          onChange={(e) => setFormData(prev => ({ ...prev, connectionRequests: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Welcome Messages</label>
                        <p className="text-sm text-gray-500">Send welcome messages to new connections</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.welcomeMessages}
                          onChange={(e) => setFormData(prev => ({ ...prev, welcomeMessages: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Follow-up Messages</label>
                        <p className="text-sm text-gray-500">Send follow-up messages to prospects</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.followUpMessages}
                          onChange={(e) => setFormData(prev => ({ ...prev, followUpMessages: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Profile Views</label>
                        <p className="text-sm text-gray-500">Automatically view prospect profiles</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.profileViews}
                          onChange={(e) => setFormData(prev => ({ ...prev, profileViews: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Daily Limits */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Daily Limits</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Connections
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={formData.dailyLimits.connections}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          dailyLimits: { ...prev.dailyLimits, connections: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Messages
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={formData.dailyLimits.messages}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          dailyLimits: { ...prev.dailyLimits, messages: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Profile Views
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={formData.dailyLimits.profileViews}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          dailyLimits: { ...prev.dailyLimits, profileViews: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Emails
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={formData.dailyLimits.emails}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          dailyLimits: { ...prev.dailyLimits, emails: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowSettings(false)}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {saving ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Saving...
                    </div>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2 inline" />
                      Save Settings
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AutomationPage;