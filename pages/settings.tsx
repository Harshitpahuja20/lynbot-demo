import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getCurrentUser } from '../utils/auth';
import { 
  Settings as SettingsIcon, 
  User, 
  Key, 
  Mail,
  Bell, 
  Shield, 
  Save,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

const SettingsPage: React.FC = () => {
  const user = getCurrentUser();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Profile settings
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: ''
  });

  // LinkedIn account settings
  const [linkedinData, setLinkedinData] = useState({
    email: '',
    password: '',
    showPassword: false,
    hasExistingAccount: false
  });

  // OpenAI settings
  const [openaiData, setOpenaiData] = useState({
    apiKey: '',
    showApiKey: false,
    hasExistingKey: false
  });

  // AI provider settings
  const [aiSettings, setAiSettings] = useState({
    provider: 'openai' as 'openai' | 'perplexity' | 'claude',
    model: 'gpt-4o-mini',
    apiKey: '',
    temperature: 0.7,
    maxTokens: 1000,
    showApiKey: false,
    hasExistingKey: false
  });

  const [aiProviders, setAiProviders] = useState<any>({});
  // Email account settings
  const [emailData, setEmailData] = useState({
    email: '',
    password: '',
    provider: 'gmail' as 'gmail' | 'outlook' | 'smtp',
    showPassword: false,
    hasExistingAccount: false,
    smtpSettings: {
      host: '',
      port: 587,
      secure: true
    }
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    campaignUpdates: true,
    connectionRequests: true,
    messageReplies: true
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'linkedin', label: 'LinkedIn Account', icon: Key },
    { id: 'email', label: 'Email Accounts', icon: Mail },
    { id: 'ai', label: 'AI Configuration', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchAIProviders();
    }
  }, [user?.id]);

  const fetchAIProviders = async () => {
    try {
      const response = await fetch('/api/ai/providers', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAiProviders(data.providers);
        }
      }
    } catch (error) {
      console.error('Error fetching AI providers:', error);
    }
  };
  const fetchUserProfile = async () => {
    try {
      setInitialLoading(true);
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          // Set profile data
          setProfileData({
            firstName: data.user.firstName || '',
            lastName: data.user.lastName || '',
            email: data.user.email || '',
            company: data.user.company || ''
          });

          // Set LinkedIn account data
          if (data.user.linkedinAccounts && data.user.linkedinAccounts.length > 0) {
            const linkedinAccount = data.user.linkedinAccounts[0];
            setLinkedinData(prev => ({
              ...prev,
              email: linkedinAccount.email || '',
              hasExistingAccount: !!linkedinAccount.hasPassword
            }));
          }

          // Set OpenAI data
          if (data.user.apiKeys?.openai) {
            setOpenaiData(prev => ({
              ...prev,
              hasExistingKey: true
            }));
          }

          // Set AI provider settings
          if (data.user.settings?.aiProvider) {
            setAiSettings(prev => ({
              ...prev,
              provider: data.user.settings.aiProvider.provider || 'openai',
              model: data.user.settings.aiProvider.model || 'gpt-4o-mini',
              temperature: data.user.settings.aiProvider.temperature || 0.7,
              maxTokens: data.user.settings.aiProvider.maxTokens || 1000,
              hasExistingKey: !!(data.user.apiKeys?.encryptedOpenAI || data.user.apiKeys?.encryptedPerplexity || data.user.apiKeys?.encryptedClaude)
            }));
          }
          // Set Email account data
          if (data.user.emailAccounts && data.user.emailAccounts.length > 0) {
            const emailAccount = data.user.emailAccounts[0];
            setEmailData(prev => ({
              ...prev,
              email: emailAccount.email || '',
              provider: emailAccount.provider || 'gmail',
              hasExistingAccount: true
            }));
          }

          // Set notification settings (if available in user data)
          if (data.user.settings?.notifications) {
            setNotificationSettings(data.user.settings.notifications);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        
        // Update the token if a new one is provided (with updated user info)
        if (data.token) {
          sessionStorage.setItem('token', data.token);
        }
      } else {
        throw new Error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to update profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLinkedIn = async () => {
    if (!linkedinData.email || !linkedinData.password) {
      setMessage({ type: 'error', text: 'Please provide both LinkedIn email and password' });
      return;
    }

    setLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/user/linkedin-account', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: linkedinData.email,
          password: linkedinData.password
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: 'LinkedIn account saved successfully!' });
        setLinkedinData(prev => ({ ...prev, hasExistingAccount: true, password: '' }));
      } else {
        throw new Error(data.error || 'Failed to save LinkedIn account');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to save LinkedIn account. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOpenAI = async () => {
    if (!openaiData.apiKey.trim()) {
      setMessage({ type: 'error', text: 'Please provide your OpenAI API key' });
      return;
    }

    if (!openaiData.apiKey.startsWith('sk-')) {
      setMessage({ type: 'error', text: 'OpenAI API key should start with "sk-"' });
      return;
    }

    setLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/user/openai-key', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey: openaiData.apiKey
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: 'OpenAI API key saved successfully!' });
        setOpenaiData(prev => ({ ...prev, hasExistingKey: true, apiKey: '' }));
      } else {
        throw new Error(data.error || 'Failed to save OpenAI API key');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to save OpenAI API key. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAISettings = async () => {
    if (!aiSettings.apiKey.trim()) {
      setMessage({ type: 'error', text: 'Please provide your API key' });
      return;
    }

    setLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/user/ai-settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: aiSettings.provider,
          model: aiSettings.model,
          apiKey: aiSettings.apiKey,
          temperature: aiSettings.temperature,
          maxTokens: aiSettings.maxTokens
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: 'AI settings saved successfully!' });
        setAiSettings(prev => ({ ...prev, hasExistingKey: true, apiKey: '' }));
      } else {
        throw new Error(data.error || 'Failed to save AI settings');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to save AI settings. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmail = async () => {
    if (!emailData.email) {
      setMessage({ type: 'error', text: 'Please provide an email address' });
      return;
    }

    if (emailData.provider === 'smtp' && (!emailData.smtpSettings.host || !emailData.smtpSettings.port)) {
      setMessage({ type: 'error', text: 'Please provide SMTP host and port for custom SMTP configuration' });
      return;
    }

    setLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/user/email-account', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: emailData.email,
          password: emailData.password,
          provider: emailData.provider,
          smtpSettings: emailData.provider === 'smtp' ? emailData.smtpSettings : undefined
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: 'Email account saved successfully!' });
        setEmailData(prev => ({ ...prev, hasExistingAccount: true, password: '' }));
      } else {
        throw new Error(data.error || 'Failed to save email account');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to save email account. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notifications: notificationSettings
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: 'Notification preferences saved successfully!' });
      } else {
        throw new Error(data.error || 'Failed to save notification preferences');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to save notification preferences. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const getApiKeyPlaceholder = (provider: string) => {
    switch (provider) {
      case 'openai': return 'sk-...';
      case 'perplexity': return 'pplx-...';
      case 'claude': return 'sk-ant-...';
      default: return 'API key';
    }
  };
  // Prevent infinite loops by memoizing user check
  useEffect(() => {
    if (!user) {
      // Only redirect if we're sure there's no user
      const token = sessionStorage.getItem('token');
      if (!token) {
        window.location.href = '/signin';
      }
    }
  }, [user?.id]);

  if (initialLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading settings...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`rounded-lg p-4 flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {message.text}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Tabs */}
          <div className="lg:w-64">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm">
              {/* Profile Settings */}
              {activeTab === 'profile' && (
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Profile Information</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={profileData.firstName}
                          onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={profileData.lastName}
                          onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company
                      </label>
                      <input
                        type="text"
                        value={profileData.company}
                        onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="pt-4">
                      <button
                        onClick={handleSaveProfile}
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* LinkedIn Settings */}
              {activeTab === 'linkedin' && (
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-6">LinkedIn Account</h3>
                  <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <p className="text-yellow-800 text-sm">
                        <strong>Security Note:</strong> Your LinkedIn credentials are encrypted and stored securely. 
                        We recommend using a dedicated LinkedIn account for automation.
                      </p>
                    </div>

                    {linkedinData.hasExistingAccount && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <p className="text-green-800 text-sm">
                          <CheckCircle className="h-4 w-4 inline mr-2" />
                          LinkedIn account is configured and ready for automation.
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        LinkedIn Email
                      </label>
                      <input
                        type="email"
                        value={linkedinData.email}
                        onChange={(e) => setLinkedinData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="your-linkedin@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        LinkedIn Password {linkedinData.hasExistingAccount && '(Update)'}
                      </label>
                      <div className="relative">
                        <input
                          type={linkedinData.showPassword ? 'text' : 'password'}
                          value={linkedinData.password}
                          onChange={(e) => setLinkedinData(prev => ({ ...prev, password: e.target.value }))}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder={linkedinData.hasExistingAccount ? "Enter new password to update" : "Your LinkedIn password"}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setLinkedinData(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                        >
                          {linkedinData.showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="pt-4">
                      <button
                        onClick={handleSaveLinkedIn}
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        {loading ? 'Saving...' : linkedinData.hasExistingAccount ? 'Update LinkedIn Account' : 'Save LinkedIn Account'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Email Account Settings */}
              {activeTab === 'email' && (
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Email Account Integration</h3>
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <p className="text-blue-800 text-sm">
                        <strong>Email Integration:</strong> Connect your email accounts to enable automated cold email campaigns 
                        and follow-up sequences. This works alongside your LinkedIn automation for comprehensive outreach.
                      </p>
                    </div>

                    {emailData.hasExistingAccount && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <p className="text-green-800 text-sm">
                          <CheckCircle className="h-4 w-4 inline mr-2" />
                          Email account is configured and ready for automated campaigns.
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Provider
                      </label>
                      <select
                        value={emailData.provider}
                        onChange={(e) => setEmailData(prev => ({ ...prev, provider: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="gmail">Gmail</option>
                        <option value="outlook">Outlook</option>
                        <option value="smtp">Custom SMTP</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={emailData.email}
                        onChange={(e) => setEmailData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="your-email@example.com"
                      />
                    </div>

                    {emailData.provider !== 'smtp' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          App Password {emailData.hasExistingAccount && '(Update)'}
                        </label>
                        <div className="relative">
                          <input
                            type={emailData.showPassword ? 'text' : 'password'}
                            value={emailData.password}
                            onChange={(e) => setEmailData(prev => ({ ...prev, password: e.target.value }))}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder={emailData.hasExistingAccount ? "Enter new password to update" : "App-specific password"}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setEmailData(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                          >
                            {emailData.showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Use an app-specific password for {emailData.provider === 'gmail' ? 'Gmail' : 'Outlook'}
                        </p>
                      </div>
                    )}

                    {emailData.provider === 'smtp' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              SMTP Host
                            </label>
                            <input
                              type="text"
                              value={emailData.smtpSettings.host}
                              onChange={(e) => setEmailData(prev => ({ 
                                ...prev, 
                                smtpSettings: { ...prev.smtpSettings, host: e.target.value }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="smtp.example.com"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              SMTP Port
                            </label>
                            <input
                              type="number"
                              value={emailData.smtpSettings.port}
                              onChange={(e) => setEmailData(prev => ({ 
                                ...prev, 
                                smtpSettings: { ...prev.smtpSettings, port: parseInt(e.target.value) || 587 }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="587"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                          </label>
                          <div className="relative">
                            <input
                              type={emailData.showPassword ? 'text' : 'password'}
                              value={emailData.password}
                              onChange={(e) => setEmailData(prev => ({ ...prev, password: e.target.value }))}
                              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Your email password"
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                              onClick={() => setEmailData(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                            >
                              {emailData.showPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* IMAP Settings for Email Sync */}
                      <div className="border-t pt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">IMAP Settings (for receiving emails)</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              IMAP Host
                            </label>
                            <input
                              type="text"
                              value={emailData.imapSettings?.host || ''}
                              onChange={(e) => setEmailData(prev => ({ 
                                ...prev, 
                                imapSettings: { 
                                  ...prev.imapSettings, 
                                  host: e.target.value,
                                  port: prev.imapSettings?.port || 993,
                                  secure: prev.imapSettings?.secure ?? true
                                }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="imap.example.com"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              IMAP Port
                            </label>
                            <input
                              type="number"
                              value={emailData.imapSettings?.port || 993}
                              onChange={(e) => setEmailData(prev => ({ 
                                ...prev, 
                                imapSettings: { 
                                  ...prev.imapSettings, 
                                  host: prev.imapSettings?.host || '',
                                  port: parseInt(e.target.value) || 993,
                                  secure: prev.imapSettings?.secure ?? true
                                }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="993"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="pt-4">
                      <button
                        onClick={handleSaveEmail}
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        {loading ? 'Saving...' : emailData.hasExistingAccount ? 'Update Email Account' : 'Save Email Account'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* OpenAI Settings */}
              {activeTab === 'openai' && (
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-6">OpenAI API Configuration</h3>
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <p className="text-blue-800 text-sm">
                        <strong>Get your API key:</strong> Visit{' '}
                        <a 
                          href="https://platform.openai.com/api-keys" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="underline hover:text-blue-900"
                        >
                          OpenAI API Keys
                        </a>{' '}
                        to create a new API key. This enables AI-powered message generation.
                      </p>
                    </div>

                    {openaiData.hasExistingKey && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <p className="text-green-800 text-sm">
                          <CheckCircle className="h-4 w-4 inline mr-2" />
                          OpenAI API key is configured and ready for AI message generation.
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        OpenAI API Key {openaiData.hasExistingKey && '(Update)'}
                      </label>
                      <div className="relative">
                        <input
                          type={openaiData.showApiKey ? 'text' : 'password'}
                          value={openaiData.apiKey}
                          onChange={(e) => setOpenaiData(prev => ({ ...prev, apiKey: e.target.value }))}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder={openaiData.hasExistingKey ? "Enter new API key to update" : "sk-..."}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setOpenaiData(prev => ({ ...prev, showApiKey: !prev.showApiKey }))}
                        >
                          {openaiData.showApiKey ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Your API key is encrypted and stored securely
                      </p>
                    </div>
                    <div className="pt-4">
                      <button
                        onClick={handleSaveOpenAI}
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        {loading ? 'Saving...' : openaiData.hasExistingKey ? 'Update API Key' : 'Save API Key'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Configuration Settings */}
              {activeTab === 'ai' && (
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-6">AI Provider Configuration</h3>
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <p className="text-blue-800 text-sm">
                        <strong>AI Provider Setup:</strong> Configure your preferred AI provider for message generation.
                        Each provider offers different models with varying capabilities and costs.
                      </p>
                    </div>

                    {aiSettings.hasExistingKey && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <p className="text-green-800 text-sm">
                          <CheckCircle className="h-4 w-4 inline mr-2" />
                          AI provider is configured and ready for message generation.
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        AI Provider
                      </label>
                      <select
                        value={aiSettings.provider}
                        onChange={(e) => setAiSettings(prev => ({ 
                          ...prev, 
                          provider: e.target.value as 'openai' | 'perplexity' | 'claude',
                          model: aiProviders[e.target.value]?.models?.[0]?.id || ''
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="openai">OpenAI</option>
                        <option value="perplexity">Perplexity</option>
                        <option value="claude">Anthropic Claude</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Model
                      </label>
                      <select
                        value={aiSettings.model}
                        onChange={(e) => setAiSettings(prev => ({ ...prev, model: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {aiProviders[aiSettings.provider]?.models?.map((model: any) => (
                          <option key={model.id} value={model.id}>
                            {model.name} - {model.description}
                          </option>
                        )) || <option value="">No models available</option>}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        API Key {aiSettings.hasExistingKey && '(Update)'}
                      </label>
                      <div className="relative">
                        <input
                          type={aiSettings.showApiKey ? 'text' : 'password'}
                          value={aiSettings.apiKey}
                          onChange={(e) => setAiSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder={getApiKeyPlaceholder(aiSettings.provider)}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setAiSettings(prev => ({ ...prev, showApiKey: !prev.showApiKey }))}
                        >
                          {aiSettings.showApiKey ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Your API key is encrypted and stored securely
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Temperature
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="2"
                          step="0.1"
                          value={aiSettings.temperature}
                          onChange={(e) => setAiSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) || 0.7 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Controls creativity (0-2)</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Max Tokens
                        </label>
                        <input
                          type="number"
                          min="100"
                          max="4000"
                          value={aiSettings.maxTokens}
                          onChange={(e) => setAiSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) || 1000 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Maximum response length</p>
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={handleSaveAISettings}
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        {loading ? 'Saving...' : aiSettings.hasExistingKey ? 'Update AI Settings' : 'Save AI Settings'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Settings */}
              {activeTab === 'notifications' && (
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Notification Preferences</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                        <p className="text-sm text-gray-500">Receive email updates about your account</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.emailNotifications}
                          onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Campaign Updates</h4>
                        <p className="text-sm text-gray-500">Get notified about campaign status changes</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.campaignUpdates}
                          onChange={(e) => setNotificationSettings(prev => ({ ...prev, campaignUpdates: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Connection Requests</h4>
                        <p className="text-sm text-gray-500">Notifications for new connection requests</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.connectionRequests}
                          onChange={(e) => setNotificationSettings(prev => ({ ...prev, connectionRequests: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Message Replies</h4>
                        <p className="text-sm text-gray-500">Get notified when prospects reply to messages</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.messageReplies}
                          onChange={(e) => setNotificationSettings(prev => ({ ...prev, messageReplies: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={handleSaveNotifications}
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        {loading ? 'Saving...' : 'Save Preferences'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;