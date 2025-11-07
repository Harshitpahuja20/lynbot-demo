import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { getCurrentUser } from '../utils/auth';
import { 
  Settings as SettingsIcon, 
  User, 
  Key, 
  Bell, 
  Shield, 
  Save, 
  Eye, 
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  Mail,
  Linkedin,
  Bot,
  Globe
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company?: string;
  role: string;
  subscription: {
    plan: string;
    status: string;
  };
  linkedin_accounts: Array<{
    email: string;
    hasPassword: boolean;
    isActive: boolean;
  }>;
  email_accounts: Array<{
    email: string;
    provider: string;
    isActive: boolean;
  }>;
  api_keys: {
    openai?: string;
    perplexity?: string;
    claude?: string;
  };
  settings: {
    timezone: string;
    notifications: {
      email: boolean;
      webhook: boolean;
    };
    aiProvider?: {
      provider: string;
      model: string;
      temperature: number;
      maxTokens: number;
    };
  };
}

interface AIProvider {
  name: string;
  models: Array<{
    id: string;
    name: string;
    description: string;
  }>;
}

const SettingsPage: React.FC = () => {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [aiProviders, setAiProviders] = useState<Record<string, AIProvider>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [initialized, setInitialized] = useState(false);

  // Get user once and memoize it
  const user = useMemo(() => getCurrentUser(), []);

  // Form states
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    company: ''
  });

  const [linkedinForm, setLinkedinForm] = useState({
    email: '',
    password: ''
  });

  const [emailForm, setEmailForm] = useState({
    email: '',
    password: '',
    provider: 'gmail'
  });

  const [aiForm, setAiForm] = useState({
    provider: 'openai',
    model: 'gpt-4o-mini',
    apiKey: '',
    temperature: 0.7,
    maxTokens: 1000
  });

  const [notificationForm, setNotificationForm] = useState({
    email: true,
    webhook: false
  });

  const [showPasswords, setShowPasswords] = useState({
    linkedin: false,
    email: false,
    apiKey: false
  });

  // Memoized fetch functions to prevent infinite loops
  const fetchProfile = useCallback(async () => {
    console.log('fetchProfile called');
    
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      
      if (!token) {
        console.log('No token found, redirecting to signin');
        router.push('/signin');
        return null;
      }

      console.log('Making profile API call...');
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Profile response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          console.log('Unauthorized, redirecting to signin');
          router.push('/signin');
          return null;
        }
        
        const errorText = await response.text();
        console.error('Profile API error:', response.status, errorText);
        throw new Error(`Failed to fetch profile (${response.status})`);
      }

      const data = await response.json();
      console.log('Profile data received:', data);
      
      if (data.success && data.user) {
        return data.user;
      } else {
        console.error('Invalid profile response:', data);
        throw new Error('Invalid profile data received');
      }
    } catch (err) {
      console.error('Error in fetchProfile:', err);
      throw err;
    }
  }, [router]);

  const fetchAIProviders = useCallback(async () => {
    console.log('fetchAIProviders called');
    
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      
      if (!token) {
        console.log('No token for AI providers');
        return {};
      }

      const response = await fetch('/api/ai/providers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('AI providers response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('AI providers data:', data);
        if (data.success) {
          return data.providers;
        }
      } else {
        console.error('Failed to fetch AI providers:', response.status);
      }
      return {};
    } catch (err) {
      console.error('Error fetching AI providers:', err);
      return {};
    }
  }, []);

  // Initialize settings only once
  const initializeSettings = useCallback(async () => {
    if (initialized) {
      console.log('Settings already initialized, skipping...');
      return;
    }

    console.log('Initializing settings...');
    setLoading(true);
    setError('');
    
    try {
      // Check user first
      if (!user) {
        console.log('No user found, redirecting to signin');
        router.push('/signin');
        return;
      }

      console.log('User found:', user);

      // Fetch profile and AI providers
      const [profileData, providersData] = await Promise.all([
        fetchProfile().catch(err => {
          console.error('Profile fetch failed:', err);
          return null;
        }),
        fetchAIProviders().catch(err => {
          console.error('AI providers fetch failed:', err);
          return {};
        })
      ]);

      if (profileData) {
        console.log('Setting profile data...');
        setProfile(profileData);
        
        // Update form states
        setProfileForm({
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          company: profileData.company || ''
        });

        setNotificationForm({
          email: profileData.settings?.notifications?.email ?? true,
          webhook: profileData.settings?.notifications?.webhook ?? false
        });

        if (profileData.settings?.aiProvider) {
          setAiForm(prev => ({
            ...prev,
            provider: profileData.settings.aiProvider.provider,
            model: profileData.settings.aiProvider.model,
            temperature: profileData.settings.aiProvider.temperature,
            maxTokens: profileData.settings.aiProvider.maxTokens
          }));
        }
        
        console.log('Profile data set successfully');
      } else {
        console.log('No profile data received');
        setError('Failed to load profile data');
      }

      setAiProviders(providersData);
      console.log('AI providers set:', providersData);

      setInitialized(true);
      console.log('Settings initialization complete');
      
    } catch (err) {
      console.error('Error initializing settings:', err);
      setError('Failed to initialize settings');
    } finally {
      setLoading(false);
    }
  }, [user, router, fetchProfile, fetchAIProviders, initialized]);

  // Only run initialization once when component mounts
  useEffect(() => {
    if (!initialized && user) {
      initializeSettings();
    } else if (!user) {
      router.push('/signin');
    }
  }, [user, initialized, initializeSettings, router]);

  const handleUpdateProfile = async () => {
    console.log('Updating profile...');
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      
      if (!token) {
        router.push('/signin');
        return;
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileForm)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      const data = await response.json();
      if (data.success) {
        setProfile(data.user);
        setSuccess('Profile updated successfully!');
        
        // Update token if provided
        if (data.token) {
          localStorage.setItem('token', data.token);
          sessionStorage.setItem('token', data.token);
        }
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLinkedInAccount = async () => {
    if (!linkedinForm.email || !linkedinForm.password) {
      setError('LinkedIn email and password are required');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (!token) {
        router.push('/signin');
        return;
      }

      const response = await fetch('/api/user/linkedin-account', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(linkedinForm)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save LinkedIn account');
      }

      setSuccess('LinkedIn account saved successfully!');
      setLinkedinForm({ email: '', password: '' });
      
      // Refresh profile data
      const updatedProfile = await fetchProfile();
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save LinkedIn account');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmailAccount = async () => {
    if (!emailForm.email) {
      setError('Email address is required');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (!token) {
        router.push('/signin');
        return;
      }

      const response = await fetch('/api/user/email-account', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailForm)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save email account');
      }

      setSuccess('Email account saved successfully!');
      setEmailForm({ email: '', password: '', provider: 'gmail' });
      
      // Refresh profile data
      const updatedProfile = await fetchProfile();
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save email account');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAISettings = async () => {
    if (!aiForm.apiKey) {
      setError('API key is required');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (!token) {
        router.push('/signin');
        return;
      }

      const response = await fetch('/api/user/ai-settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(aiForm)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save AI settings');
      }

      setSuccess('AI settings saved successfully!');
      setAiForm(prev => ({ ...prev, apiKey: '' }));
      
      // Refresh profile data
      const updatedProfile = await fetchProfile();
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save AI settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (!token) {
        router.push('/signin');
        return;
      }

      const response = await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notifications: notificationForm })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save notification settings');
      }

      setSuccess('Notification settings saved successfully!');
      
      // Refresh profile data
      const updatedProfile = await fetchProfile();
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  // Show loading state
  if (loading) {
    console.log('Rendering loading state...');
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading settings...</span>
        </div>
      </Layout>
    );
  }

  // Show error state if no profile loaded
  if (!profile) {
    console.log('No profile data, showing error state');
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Settings</h3>
          <p className="text-gray-600 mb-4">Unable to load your profile data.</p>
          <button
            onClick={() => {
              setInitialized(false);
              setLoading(true);
              initializeSettings();
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </Layout>
    );
  }

  console.log('Rendering settings page with profile:', profile);

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account settings and integrations</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'profile', label: 'Profile', icon: User },
                { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
                { id: 'email', label: 'Email', icon: Mail },
                { id: 'ai', label: 'AI Settings', icon: Bot },
                { id: 'notifications', label: 'Notifications', icon: Bell }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={profileForm.first_name}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, first_name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={profileForm.last_name}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, last_name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company
                      </label>
                      <input
                        type="text"
                        value={profileForm.company}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, company: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <button
                      onClick={handleUpdateProfile}
                      disabled={saving}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Profile
                    </button>
                  </div>
                </div>

                {/* Account Information */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <span className="ml-2 font-medium">{profile.email}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Role:</span>
                        <span className="ml-2 font-medium capitalize">{profile.role}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Plan:</span>
                        <span className="ml-2 font-medium capitalize">{profile.subscription?.plan}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <span className="ml-2 font-medium capitalize">{profile.subscription?.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LinkedIn Tab */}
            {activeTab === 'linkedin' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">LinkedIn Account</h3>
                  
                  {/* Current LinkedIn Accounts */}
                  {profile.linkedin_accounts && profile.linkedin_accounts.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-md font-medium text-gray-900 mb-3">Connected Accounts</h4>
                      <div className="space-y-2">
                        {profile.linkedin_accounts.map((account, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              <Linkedin className="h-5 w-5 text-blue-600 mr-3" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {account.email || (account.unipile_account_id ? 'Unipile Account' : 'LinkedIn Account')}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {account.isActive ? 'Active' : 'Inactive'} • 
                                  {account.provider === 'unipile' ? 'Connected via Unipile' : 'Direct connection'}
                                </p>
                              </div>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              account.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {account.isActive ? 'Active' : 'Inactive'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Unipile Connection (Recommended) */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Recommended: Connect via Unipile</span>
                    </div>
                    <p className="text-sm text-blue-700 mb-3">
                      Unipile provides secure OAuth authentication without storing your LinkedIn password. This is the safest and most reliable method.
                    </p>
                    <button
                      onClick={async () => {
                        setSaving(true);
                        setError('');
                        try {
                          const token = sessionStorage.getItem('token') || localStorage.getItem('token');
                          const response = await fetch('/api/unipile/connect', {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${token}`,
                              'Content-Type': 'application/json'
                            }
                          });
                          const data = await response.json();
                          if (data.success && data.data.hosted_auth_url) {
                            window.open(data.data.hosted_auth_url, '_blank', 'width=600,height=700');
                            setSuccess('Please complete authentication in the popup window');
                          } else {
                            throw new Error(data.error || 'Failed to initiate connection');
                          }
                        } catch (err) {
                          setError(err instanceof Error ? err.message : 'Failed to connect');
                        } finally {
                          setSaving(false);
                        }
                      }}
                      disabled={saving}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Linkedin className="w-4 h-4 mr-2" />}
                      Connect LinkedIn via Unipile
                    </button>
                  </div>

                  {/* Legacy Method */}
                  <details className="border border-gray-200 rounded-lg p-4">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">Advanced: Direct Connection (Legacy)</summary>
                    <div className="mt-4 space-y-4">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-xs text-yellow-700">
                          This method stores encrypted credentials. Use only if Unipile connection fails.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn Email</label>
                          <input
                            type="email"
                            value={linkedinForm.email}
                            onChange={(e) => setLinkedinForm(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="your-linkedin@email.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn Password</label>
                          <div className="relative">
                            <input
                              type={showPasswords.linkedin ? 'text' : 'password'}
                              value={linkedinForm.password}
                              onChange={(e) => setLinkedinForm(prev => ({ ...prev, password: e.target.value }))}
                              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Your LinkedIn password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords(prev => ({ ...prev, linkedin: !prev.linkedin }))}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                              {showPasswords.linkedin ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                            </button>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleSaveLinkedInAccount}
                        disabled={saving}
                        className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50 flex items-center"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Direct Connection
                      </button>
                    </div>
                  </details>
                </div>
              </div>
            )}

            {/* Email Tab */}
            {activeTab === 'email' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Email Accounts</h3>
                  
                  {/* Current Email Accounts */}
                  {profile.email_accounts && profile.email_accounts.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-md font-medium text-gray-900 mb-3">Connected Accounts</h4>
                      <div className="space-y-2">
                        {profile.email_accounts.map((account, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              <Mail className="h-5 w-5 text-green-600 mr-3" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{account.email}</p>
                                <p className="text-xs text-gray-500">
                                  {account.provider} • {account.isActive ? 'Active' : 'Inactive'}
                                </p>
                              </div>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              account.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {account.isActive ? 'Active' : 'Inactive'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add Email Account */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={emailForm.email}
                        onChange={(e) => setEmailForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="your@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Provider
                      </label>
                      <select
                        value={emailForm.provider}
                        onChange={(e) => setEmailForm(prev => ({ ...prev, provider: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="gmail">Gmail</option>
                        <option value="outlook">Outlook</option>
                        <option value="smtp">Custom SMTP</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        App Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.email ? 'text' : 'password'}
                          value={emailForm.password}
                          onChange={(e) => setEmailForm(prev => ({ ...prev, password: e.target.value }))}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="App password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, email: !prev.email }))}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPasswords.email ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveEmailAccount}
                    disabled={saving}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 flex items-center"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Email Account
                  </button>
                </div>
              </div>
            )}

            {/* AI Settings Tab */}
            {activeTab === 'ai' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">AI Configuration</h3>
                  
                  {/* Current AI Settings */}
                  {profile.settings?.aiProvider && (
                    <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <h4 className="text-md font-medium text-purple-900 mb-2">Current Configuration</h4>
                      <div className="text-sm text-purple-700">
                        <p>Provider: {profile.settings.aiProvider.provider}</p>
                        <p>Model: {profile.settings.aiProvider.model}</p>
                        <p>Temperature: {profile.settings.aiProvider.temperature}</p>
                        <p>Max Tokens: {profile.settings.aiProvider.maxTokens}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        AI Provider
                      </label>
                      <select
                        value={aiForm.provider}
                        onChange={(e) => {
                          const provider = e.target.value;
                          setAiForm(prev => ({ 
                            ...prev, 
                            provider,
                            model: aiProviders[provider]?.models[0]?.id || ''
                          }));
                        }}
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
                        value={aiForm.model}
                        onChange={(e) => setAiForm(prev => ({ ...prev, model: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {aiProviders[aiForm.provider]?.models.map(model => (
                          <option key={model.id} value={model.id}>
                            {model.name}
                          </option>
                        )) || (
                          <option value={aiForm.model}>{aiForm.model}</option>
                        )}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        API Key
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.apiKey ? 'text' : 'password'}
                          value={aiForm.apiKey}
                          onChange={(e) => setAiForm(prev => ({ ...prev, apiKey: e.target.value }))}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder={`Enter your ${aiForm.provider} API key`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, apiKey: !prev.apiKey }))}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPasswords.apiKey ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Temperature ({aiForm.temperature})
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={aiForm.temperature}
                        onChange={(e) => setAiForm(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Conservative</span>
                        <span>Creative</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Tokens
                      </label>
                      <input
                        type="number"
                        min="100"
                        max="4000"
                        value={aiForm.maxTokens}
                        onChange={(e) => setAiForm(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSaveAISettings}
                    disabled={saving}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 flex items-center"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save AI Settings
                  </button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Email Notifications</label>
                        <p className="text-sm text-gray-500">Receive email updates about your campaigns</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationForm.email}
                          onChange={(e) => setNotificationForm(prev => ({ ...prev, email: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Webhook Notifications</label>
                        <p className="text-sm text-gray-500">Send notifications to external webhooks</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationForm.webhook}
                          onChange={(e) => setNotificationForm(prev => ({ ...prev, webhook: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveNotifications}
                    disabled={saving}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Notification Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;