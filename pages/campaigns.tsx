import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useWebSocket } from '../contexts/WebSocketContext';
import { 
  Target, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Play,
  Pause,
  Eye,
  X,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Users,
  MessageSquare,
  BarChart3,
  Calendar,
  Settings,
  ExternalLink,
  Copy,
  MoreVertical
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  searchCriteria: {
    keywords?: string;
    location?: string;
    company?: string;
    title?: string;
    industry?: string;
    connectionLevel?: string;
    currentCompany?: string;
    pastCompany?: string;
    school?: string;
    profileLanguage?: string;
    serviceCategory?: string;
    nonprofit?: string;
    salesNavigatorUrl?: string;
    customFilters?: any;
  };
  salesNavigatorCriteria?: {
    // Company filters
    company?: string;
    currentCompany?: string;
    companyHeadcount?: string;
    pastCompany?: string;
    companyType?: string;
    companyHeadquarters?: string;
    
    // Role filters
    function?: string;
    currentJobTitle?: string;
    seniorityLevel?: string;
    pastJobTitle?: string;
    yearsInCurrentCompany?: string;
    yearsInCurrentPosition?: string;
    
    // Personal filters
    geography?: string;
    industry?: string;
    firstName?: string;
    lastName?: string;
    profileLanguage?: string;
    yearsOfExperience?: string;
    groups?: string;
    school?: string;
    
    // Buyer intent filters
    categoryInterest?: string;
    followingYourCompany?: boolean;
    viewedProfileRecently?: boolean;
    
    // Best path in filters
    connection?: string;
    connectionsOf?: string;
    pastColleague?: boolean;
    sharedExperiences?: boolean;
    
    // Recent updates filters
    changedJobs?: boolean;
    postedOnLinkedIn?: boolean;
    
    // Workflow filters
    persona?: string;
    accountLists?: string;
    leadLists?: string;
    peopleInCRM?: string;
    peopleInteractedWith?: string;
    savedLeadsAccounts?: string;
  };
  messageTemplates: any;
  automation: any;
  statistics: {
    totalProspects: number;
    connectionsSent: number;
    connectionsAccepted: number;
    messagesSent: number;
    messagesReplied: number;
    profileViews: number;
    acceptanceRate: number;
    responseRate: number;
    lastActivity?: string;
  };
  integrations: any;
  tags: string[];
  priority: number;
  isActive: boolean;
  createdAt: string;
  lastUpdated: string;
}

const CampaignsPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchStatus, setSearchStatus] = useState('');
  const [useSalesNavigator, setUseSalesNavigator] = useState(false);
  const [userLinkedInAccounts, setUserLinkedInAccounts] = useState<any[]>([]);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedResultUrls, setSelectedResultUrls] = useState<string[]>([]);
  const [savingResults, setSavingResults] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<any>(null);
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [messageLoading, setMessageLoading] = useState(false);
  const { socket, isConnected: wsConnected, emit } = useWebSocket();
  
  // Form data for create/edit
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    searchCriteria: {
      keywords: '',
      location: '',
      company: '',
      title: '',
      industry: '',
      connectionLevel: 'all',
      currentCompany: '',
      pastCompany: '',
      school: '',
      profileLanguage: '',
      serviceCategory: '',
      nonprofit: '',
      salesNavigatorUrl: ''
    },
    salesNavigatorCriteria: {
      // Company filters
      company: '',
      currentCompany: '',
      companyHeadcount: '',
      pastCompany: '',
      companyType: '',
      companyHeadquarters: '',
      
      // Role filters
      function: '',
      currentJobTitle: '',
      seniorityLevel: '',
      pastJobTitle: '',
      yearsInCurrentCompany: '',
      yearsInCurrentPosition: '',
      
      // Personal filters
      geography: '',
      industry: '',
      firstName: '',
      lastName: '',
      profileLanguage: '',
      yearsOfExperience: '',
      groups: '',
      school: '',
      
      // Buyer intent filters
      categoryInterest: '',
      followingYourCompany: false,
      viewedProfileRecently: false,
      
      // Best path in filters
      connection: '',
      connectionsOf: '',
      pastColleague: false,
      sharedExperiences: false,
      
      // Recent updates filters
      changedJobs: false,
      postedOnLinkedIn: false,
      
      // Workflow filters
      persona: '',
      accountLists: '',
      leadLists: '',
      peopleInCRM: '',
      peopleInteractedWith: '',
      savedLeadsAccounts: ''
    }
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // WebSocket event listeners for search
  useEffect(() => {
    if (!socket) return;

    const handleSearchStarted = (data: any) => {
      setSearchLoading(true);
      setSearchStatus(data.message || 'Search started...');
      setError('');
    };

    const handleSearchStatus = (data: any) => {
      setSearchStatus(data.message || 'Processing...');
    };

    const handleSearchComplete = (data: any) => {
      setSearchLoading(false);
      setSearchStatus('');
      if (data.success) {
        setError(`✅ Search completed! Found ${data.prospectsFound || 0} prospects.`);
        setSearchResults(data.users || []);
        setShowResultsModal(true);
      } else {
        setError(`❌ ${data.message || 'Search failed'}`);
      }
    };

    const handleSearchError = (data: any) => {
      setSearchLoading(false);
      setSearchStatus('');
      setError(`❌ ${data.message || 'Search failed'}`);
    };

    const handleSearchWarning = (data: any) => {
      setSearchStatus(`⚠️ ${data.message || 'Warning during search'}`);
    };

    const handleMessageGenerated = (data: any) => {
      console.log('Message generated:', data);
      setMessageLoading(false);
      if (data.success && data.message) {
        setGeneratedMessage(data.message);
      } else {
        setError('❌ Failed to generate message');
        setShowMessageModal(false);
      }
    };

    const handleMessageSent = (data: any) => {
      if (data.success) {
        setError('✅ Message sent successfully!');
      } else {
        setError('❌ Failed to send message');
      }
    };

    socket.on('searchStarted', handleSearchStarted);
    socket.on('searchStatus', handleSearchStatus);
    socket.on('searchComplete', handleSearchComplete);
    socket.on('searchError', handleSearchError);
    socket.on('searchWarning', handleSearchWarning);
    socket.on('generateMessage', handleMessageGenerated);
    socket.on('messageGenerated', handleMessageGenerated);
    socket.on('messageSent', handleMessageSent);

    return () => {
      socket.off('searchStarted', handleSearchStarted);
      socket.off('searchStatus', handleSearchStatus);
      socket.off('searchComplete', handleSearchComplete);
      socket.off('searchError', handleSearchError);
      socket.off('searchWarning', handleSearchWarning);
      socket.off('generateMessage', handleMessageGenerated);
      socket.off('messageGenerated', handleMessageGenerated);
      socket.off('messageSent', handleMessageSent);
    };
  }, [socket]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/campaigns', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/signin';
          return;
        }
        throw new Error('Failed to fetch campaigns');
      }

      const data = await response.json();
      if (data.success) {
        setCampaigns(data.campaigns || []);
        setUserLinkedInAccounts(data.user?.linkedin_accounts || []);
      } else {
        throw new Error(data.error || 'Failed to fetch campaigns');
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectResult = (profileUrl: string) => {
    setSelectedResultUrls(prev => {
      if (prev.includes(profileUrl)) return prev.filter(u => u !== profileUrl);
      return [...prev, profileUrl];
    });
  };

  // Save prospects by profileUrl list. If urls is omitted, save ALL searchResults.
  const handleSaveProspects = async (urls?: string[]) => {
    const toSaveUrls = urls && urls.length ? urls : searchResults.map((p: any) => p.profileUrl).filter(Boolean);

    if (!toSaveUrls.length) {
      setError('Please select at least one prospect to save');
      return;
    }

    setSavingResults(true);
    setError('');
    try {
      const selectedProspects = searchResults.filter((p: any) => toSaveUrls.includes(p.profileUrl));

      const token = localStorage.getItem('token');

      // Prepare payload for bulk endpoint
      const prospectsPayload = selectedProspects.map((p: any) => ({
        campaignId: p?.campaignId || '',
        linkedinData: {
          profileUrl: p.profileUrl,
          name: p.name,
          title: p.title || '',
          company: p.company || '',
          location: p.location || '',
          industry: p.industry || ''
        },
        contactInfo: {}
      }));

      const resp = await fetch('/api/prospects/bulk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prospects: prospectsPayload })
      });

      const data = await resp.json().catch(() => ({ success: false }));

      if (resp.ok && data && data.success) {
        const successCount = data.count || (Array.isArray(data.prospects) ? data.prospects.length : selectedProspects.length);
        setError(`✅ Saved ${successCount} prospect${successCount > 1 ? 's' : ''} successfully`);
        // Remove saved ones from results and clear selection if they were selected
        setSearchResults(prev => prev.filter((p: any) => !toSaveUrls.includes(p.profileUrl)));
        setSelectedResultUrls([]);
      } else {
        console.error('Bulk save failed', data);
        setError(data.error || '❌ Failed to save selected prospects');
      }
    } catch (err) {
      console.error('Save prospects error', err);
      setError('❌ Failed to save selected prospects');
    } finally {
      setSavingResults(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!formData.name) {
      setError('Campaign name is required');
      return;
    }

    setActionLoading(true);
    try {
      const campaignData = {
        name: formData.name,
        description: formData.description,
        searchCriteria: useSalesNavigator ? {} : formData.searchCriteria,
        salesNavigatorCriteria: useSalesNavigator ? formData.salesNavigatorCriteria : undefined,
        useSalesNavigator: useSalesNavigator
      };

      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(campaignData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create campaign');
      }

      const data = await response.json();
      if (data.success) {
        setCampaigns(prev => [data.campaign, ...prev]);
        setShowCreateModal(false);
        resetFormData();
        setError('');
      } else {
        throw new Error(data.error || 'Failed to create campaign');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign');
    } finally {
      setActionLoading(false);
    }
  };

  const resetFormData = () => {
    setFormData({
      name: '',
      description: '',
      searchCriteria: {
        keywords: '',
        location: '',
        company: '',
        title: '',
        industry: '',
        connectionLevel: 'all',
        currentCompany: '',
        pastCompany: '',
        school: '',
        profileLanguage: '',
        serviceCategory: '',
        nonprofit: '',
        salesNavigatorUrl: ''
      },
      salesNavigatorCriteria: {
        company: '',
        currentCompany: '',
        companyHeadcount: '',
        pastCompany: '',
        companyType: '',
        companyHeadquarters: '',
        function: '',
        currentJobTitle: '',
        seniorityLevel: '',
        pastJobTitle: '',
        yearsInCurrentCompany: '',
        yearsInCurrentPosition: '',
        geography: '',
        industry: '',
        firstName: '',
        lastName: '',
        profileLanguage: '',
        yearsOfExperience: '',
        groups: '',
        school: '',
        categoryInterest: '',
        followingYourCompany: false,
        viewedProfileRecently: false,
        connection: '',
        connectionsOf: '',
        pastColleague: false,
        sharedExperiences: false,
        changedJobs: false,
        postedOnLinkedIn: false,
        persona: '',
        accountLists: '',
        leadLists: '',
        peopleInCRM: '',
        peopleInteractedWith: '',
        savedLeadsAccounts: ''
      }
    });
    setUseSalesNavigator(false);
  };

  const handleEditCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    const defaultSearchCriteria = {
      keywords: '',
      location: '',
      company: '',
      title: '',
      industry: '',
      connectionLevel: 'all',
      currentCompany: '',
      pastCompany: '',
      school: '',
      profileLanguage: '',
      serviceCategory: '',
      nonprofit: '',
      salesNavigatorUrl: ''
    };

    const defaultSalesNavigatorCriteria = {
      company: '',
      currentCompany: '',
      companyHeadcount: '',
      pastCompany: '',
      companyType: '',
      companyHeadquarters: '',
      function: '',
      currentJobTitle: '',
      seniorityLevel: '',
      pastJobTitle: '',
      yearsInCurrentCompany: '',
      yearsInCurrentPosition: '',
      geography: '',
      industry: '',
      firstName: '',
      lastName: '',
      profileLanguage: '',
      yearsOfExperience: '',
      groups: '',
      school: '',
      categoryInterest: '',
      followingYourCompany: false,
      viewedProfileRecently: false,
      connection: '',
      connectionsOf: '',
      pastColleague: false,
      sharedExperiences: false,
      changedJobs: false,
      postedOnLinkedIn: false,
      persona: '',
      accountLists: '',
      leadLists: '',
      peopleInCRM: '',
      peopleInteractedWith: '',
      savedLeadsAccounts: ''
    };

    setFormData({
      name: campaign.name,
      description: campaign.description || '',
      searchCriteria: {
        ...defaultSearchCriteria,
        ...(campaign.searchCriteria || {})
      },
      salesNavigatorCriteria: {
        ...defaultSalesNavigatorCriteria,
        ...(campaign.salesNavigatorCriteria || {})
      }
    });
    setUseSalesNavigator(!!campaign.salesNavigatorCriteria);
    setShowEditModal(true);
  };

  const handleUpdateCampaign = async () => {
    if (!selectedCampaign || !formData.name) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`/api/campaigns/${selectedCampaign.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          searchCriteria: useSalesNavigator ? {} : formData.searchCriteria,
          salesNavigatorCriteria: useSalesNavigator ? formData.salesNavigatorCriteria : undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCampaigns(prev => prev.map(c => c.id === selectedCampaign.id ? data.campaign : c));
        setShowEditModal(false);
        setSelectedCampaign(null);
        resetFormData();
      }
    } catch (err) {
      setError('Failed to update campaign');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCampaign = async () => {
    if (!selectedCampaign) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`/api/campaigns/${selectedCampaign.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setCampaigns(prev => prev.filter(c => c.id !== selectedCampaign.id));
        setShowDeleteModal(false);
        setSelectedCampaign(null);
      }
    } catch (err) {
      setError('Failed to delete campaign');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateMessage = async (prospect: any) => {
    setMessageLoading(true);
    setShowMessageModal(true);
    
    if (socket && wsConnected) {
      emit('generateMessage', { 
        recipientName: prospect.name,
        recipientTitle: prospect.title,
        profileUrl: prospect.profileUrl
      });
    } else {
      // Fallback to API
      try {
        const response = await fetch('/api/ai/generate-message', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            recipientName: prospect.name,
            recipientTitle: prospect.title,
            profileUrl: prospect.profileUrl
          })
        });
        const data = await response.json();
        if (data.success) {
          setGeneratedMessage(data.message);
        }
      } catch (err) {
        setError('Failed to generate message');
      } finally {
        setMessageLoading(false);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!selectedProspect || !generatedMessage) return;
    
    if (socket && wsConnected) {
      emit('sendMessage', {
        prospect: selectedProspect,
        message: generatedMessage
      });
      setShowMessageModal(false);
      setSelectedProspect(null);
      setGeneratedMessage('');
      setError('✅ Message sent successfully!');
    } else {
      // Fallback to API
      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prospectId: selectedProspect.id,
            message: generatedMessage
          })
        });
        const data = await response.json();
        if (data.success) {
          setShowMessageModal(false);
          setSelectedProspect(null);
          setGeneratedMessage('');
          setError('✅ Message sent successfully!');
        }
      } catch (err) {
        setError('Failed to send message');
      }
    }
  };

  const handleRunCampaign = async (campaign: Campaign) => {
    if (searchLoading) {
      setError('⏳ Another search is already in progress. Please wait...');
      return;
    }

    const hasSalesNavigator = campaign.salesNavigatorCriteria && Object.keys(campaign.salesNavigatorCriteria).some(key => campaign.salesNavigatorCriteria[key]);
    
    if (socket && wsConnected) {
      // Use WebSocket for real-time updates
      const filters = {
        searchType: hasSalesNavigator ? 'salesNavigator' : 'standard',
        campaignId: campaign.id,
        ...(hasSalesNavigator ? {
          currentCompany: campaign.salesNavigatorCriteria?.company || campaign.salesNavigatorCriteria?.currentCompany || '',
          companySize: campaign.salesNavigatorCriteria?.companyHeadcount || '',
          jobTitle: campaign.salesNavigatorCriteria?.currentJobTitle || '',
          location: campaign.salesNavigatorCriteria?.geography || '',
          industry: campaign.salesNavigatorCriteria?.industry || ''
        } : {
          keywords: campaign.searchCriteria?.keywords || '',
          location: campaign.searchCriteria?.location || '',
          company: campaign.searchCriteria?.currentCompany || '',
          title: campaign.searchCriteria?.title || ''
        }),
        maxResults: 25
      };
      
      console.log('WebSocket search filters:', filters);
      emit('search', { filters });
    } else {
      // Fallback to API
      runWithAPI();
    }
    
    function runWithAPI() {
      setActionLoading(true);
      setError('🎯 Starting campaign search...');
      
      fetch(`/api/campaigns/${campaign.id}/search-prospects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setError(`✅ Campaign completed! Found ${data.prospectsFound || 0} prospects.`);
          fetchCampaigns();
        } else {
          setError(`❌ ${data.error || 'Failed to run campaign'}`);
        }
      })
      .catch(err => {
        console.error('API Error:', err);
        setError('❌ Failed to run campaign');
      })
      .finally(() => setActionLoading(false));
    }
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

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (campaign.description && campaign.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || campaign.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading campaigns...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Status Messages */}
        {searchLoading && searchStatus && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            {searchStatus}
          </div>
        )}
        
        {error && (
          <div className={`border px-4 py-3 rounded-lg flex items-center gap-2 ${
            error.startsWith('✅') ? 'bg-green-50 border-green-200 text-green-700' :
            error.startsWith('⚠️') ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
            error.startsWith('🎯') || error.startsWith('⏳') ? 'bg-blue-50 border-blue-200 text-blue-700' :
            'bg-red-50 border-red-200 text-red-700'
          }`}>
            {error.startsWith('✅') ? <CheckCircle className="w-5 h-5" /> :
             error.startsWith('⚠️') ? <AlertCircle className="w-5 h-5" /> :
             error.startsWith('🎯') || error.startsWith('⏳') ? <Loader2 className="w-5 h-5 animate-spin" /> :
             <AlertCircle className="w-5 h-5" />}
            {error}
            <button
              onClick={() => setError('')}
              className="ml-auto hover:opacity-70"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
            <p className="text-gray-600">Manage your LinkedIn automation campaigns and outreach strategies</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Campaigns List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Your Campaigns ({filteredCampaigns.length})
            </h3>
          </div>
          
          {filteredCampaigns.length === 0 ? (
            <div className="p-12 text-center">
              <Target className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {campaigns.length === 0 ? 'No campaigns yet' : 'No campaigns match your search'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {campaigns.length === 0 
                  ? 'Create your first campaign to start automating your LinkedIn outreach.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
              {campaigns.length === 0 && (
                <div className="mt-6">
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Campaign
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredCampaigns.map((campaign) => (
                <div key={campaign.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Target className="h-6 w-6 text-blue-600" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="text-lg font-medium text-gray-900">{campaign.name}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                            {campaign.status}
                          </span>
                          {campaign.salesNavigatorCriteria && Object.keys(campaign.salesNavigatorCriteria).some(key => campaign.salesNavigatorCriteria[key]) && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Sales Navigator
                            </span>
                          )}
                        </div>
                        
                        {campaign.description && (
                          <p className="text-gray-600 mb-2">{campaign.description}</p>
                        )}
                        
                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {campaign.statistics.totalProspects} prospects
                          </div>
                          <div className="flex items-center">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            {campaign.statistics.messagesSent} messages
                          </div>
                          <div className="flex items-center">
                            <BarChart3 className="h-4 w-4 mr-1" />
                            {campaign.statistics.acceptanceRate}% acceptance
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleRunCampaign(campaign)}
                        disabled={actionLoading || searchLoading}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 flex items-center"
                        title="Run Campaign"
                      >
                        {searchLoading ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Play className="h-3 w-3 mr-1" />
                        )}
                        {searchLoading ? 'Running...' : 'Run'}
                      </button>
                      
                      <button
                        onClick={() => handleEditCampaign(campaign)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md"
                        title="Edit Campaign"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedCampaign(campaign);
                          setShowDeleteModal(true);
                        }}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                        title="Delete Campaign"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit Campaign Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Edit Campaign</h3>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedCampaign(null);
                      resetFormData();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedCampaign(null);
                      resetFormData();
                    }}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateCampaign}
                    disabled={actionLoading || !formData.name}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Updating...' : 'Update Campaign'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Campaign Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mt-2">Delete Campaign</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete "{selectedCampaign?.name}"? This action cannot be undone.
                  </p>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedCampaign(null);
                    }}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteCampaign}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Message Modal - Higher z-index to appear above prospects modal */}
        {showMessageModal && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-[60]">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Message for {selectedProspect?.name}
                  </h3>
                  <button
                    onClick={() => {
                      setShowMessageModal(false);
                      setSelectedProspect(null);
                      setGeneratedMessage('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                {messageLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Generating message...</span>
                  </div>
                ) : (
                  <div>
                    <textarea
                      value={generatedMessage}
                      onChange={(e) => setGeneratedMessage(e.target.value)}
                      className="w-full h-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Generated message will appear here..."
                    />
                    
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => {
                          setShowMessageModal(false);
                          setSelectedProspect(null);
                          setGeneratedMessage('');
                        }}
                        className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSendMessage()}
                        disabled={!generatedMessage}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        Send Message
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Search Results Modal */}
        {showResultsModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" style={{ display: showMessageModal ? 'block' : 'block' }}>
            <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Search Results ({searchResults.length} prospects found)
                  </h3>
                  <button
                    onClick={() => {
                      setShowResultsModal(false);
                      setSearchResults([]);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  <div className="space-y-3">
                    {searchResults.map((prospect, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 flex items-start gap-3">
                            <label className="flex items-center mt-1">
                              <input
                                type="checkbox"
                                checked={selectedResultUrls.includes(prospect.profileUrl)}
                                onChange={() => toggleSelectResult(prospect.profileUrl)}
                                className="h-4 w-4 text-blue-600 rounded border-gray-300"
                              />
                            </label>

                            <div>
                              <h4 className="font-medium text-gray-900">{prospect.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">{prospect.title}</p>
                              {prospect.company && (
                                <p className="text-sm text-gray-500 mt-1">{prospect.company}</p>
                              )}
                            </div>
                          </div>
                          {/* <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedProspect(prospect);
                                handleGenerateMessage(prospect);
                              }}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center"
                            >
                              <MessageSquare className="h-3 w-3 mr-1" />
                              Generate Message
                            </button>
                            {prospect.profileUrl && (
                              <a
                                href={prospect.profileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md"
                                title="View LinkedIn Profile"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div> */}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowResultsModal(false);
                      setSearchResults([]);
                      setSelectedResultUrls([]);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleSaveProspects(selectedResultUrls.length === 0 ? undefined : selectedResultUrls)}
                    disabled={savingResults || searchResults.length === 0}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {savingResults ? 'Saving...' : (selectedResultUrls.length === 0 ? 'Save All' : 'Save Selected')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        

        {/* Create Campaign Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Create New Campaign</h3>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetFormData();
                      setError('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="space-y-6 max-h-96 overflow-y-auto">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Campaign Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Q4 Lead Generation"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Brief description of this campaign"
                      />
                    </div>
                  </div>

                  {/* Search Type Toggle */}
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-medium text-gray-900">LinkedIn Search Criteria</h4>
                      <div className="flex items-center space-x-3">
                        <span className={`text-sm ${!useSalesNavigator ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                          Standard Search
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={useSalesNavigator}
                            onChange={(e) => setUseSalesNavigator(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                        <span className={`text-sm ${useSalesNavigator ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                          Sales Navigator
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                      {useSalesNavigator 
                        ? 'Use LinkedIn Sales Navigator advanced search filters for precise targeting'
                        : 'Define your target prospects using standard LinkedIn search criteria'
                      }
                    </p>

                    {/* Standard LinkedIn Search */}
                    {!useSalesNavigator && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Keywords
                            </label>
                            <input
                              type="text"
                              value={formData.searchCriteria.keywords}
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                searchCriteria: { ...prev.searchCriteria, keywords: e.target.value }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="e.g., software engineer, marketing"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Location
                            </label>
                            <input
                              type="text"
                              value={formData.searchCriteria.location}
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                searchCriteria: { ...prev.searchCriteria, location: e.target.value }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="e.g., San Francisco, CA"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Current Company
                            </label>
                            <input
                              type="text"
                              value={formData.searchCriteria.currentCompany}
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                searchCriteria: { ...prev.searchCriteria, currentCompany: e.target.value }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="e.g., Google, Microsoft"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Job Title
                            </label>
                            <input
                              type="text"
                              value={formData.searchCriteria.title}
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                searchCriteria: { ...prev.searchCriteria, title: e.target.value }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="e.g., CEO, Director, Manager"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Industry
                            </label>
                            <input
                              type="text"
                              value={formData.searchCriteria.industry}
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                searchCriteria: { ...prev.searchCriteria, industry: e.target.value }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="e.g., Technology, Healthcare"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Connection Level
                            </label>
                            <select
                              value={formData.searchCriteria.connectionLevel}
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                searchCriteria: { ...prev.searchCriteria, connectionLevel: e.target.value }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="all">Any connection level</option>
                              <option value="1st">1st connections</option>
                              <option value="2nd">2nd connections</option>
                              <option value="3rd">3rd+ connections</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sales Navigator Search */}
                    {useSalesNavigator && (
                      <div className="bg-blue-50 rounded-lg p-4 space-y-6">
                        {/* Company Section */}
                        <div>
                          <h5 className="text-sm font-semibold text-gray-900 mb-3">Company</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
                              <input
                                type="text"
                                value={formData.salesNavigatorCriteria.company}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  salesNavigatorCriteria: { ...prev.salesNavigatorCriteria, company: e.target.value }
                                }))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Company name"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Current Company</label>
                              <input
                                type="text"
                                value={formData.salesNavigatorCriteria.currentCompany}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  salesNavigatorCriteria: { ...prev.salesNavigatorCriteria, currentCompany: e.target.value }
                                }))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Current company"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Company Headcount</label>
                              <select
                                value={formData.salesNavigatorCriteria.companyHeadcount}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  salesNavigatorCriteria: { ...prev.salesNavigatorCriteria, companyHeadcount: e.target.value }
                                }))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="">Any size</option>
                                <option value="1-10">1-10 employees</option>
                                <option value="11-50">11-50 employees</option>
                                <option value="51-200">51-200 employees</option>
                                <option value="201-500">201-500 employees</option>
                                <option value="501-1000">501-1,000 employees</option>
                                <option value="1001-5000">1,001-5,000 employees</option>
                                <option value="5001-10000">5,001-10,000 employees</option>
                                <option value="10001+">10,001+ employees</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Past Company</label>
                              <input
                                type="text"
                                value={formData.salesNavigatorCriteria.pastCompany}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  salesNavigatorCriteria: { ...prev.salesNavigatorCriteria, pastCompany: e.target.value }
                                }))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Past company"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Company Type</label>
                              <select
                                value={formData.salesNavigatorCriteria.companyType}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  salesNavigatorCriteria: { ...prev.salesNavigatorCriteria, companyType: e.target.value }
                                }))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="">Any type</option>
                                <option value="public">Public Company</option>
                                <option value="private">Privately Held</option>
                                <option value="nonprofit">Non-profit</option>
                                <option value="government">Government Agency</option>
                                <option value="self-employed">Self-employed</option>
                                <option value="partnership">Partnership</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Company Headquarters</label>
                              <input
                                type="text"
                                value={formData.salesNavigatorCriteria.companyHeadquarters}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  salesNavigatorCriteria: { ...prev.salesNavigatorCriteria, companyHeadquarters: e.target.value }
                                }))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Headquarters location"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Role Section */}
                        <div>
                          <h5 className="text-sm font-semibold text-gray-900 mb-3">Role</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Function</label>
                              <select
                                value={formData.salesNavigatorCriteria.function}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  salesNavigatorCriteria: { ...prev.salesNavigatorCriteria, function: e.target.value }
                                }))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="">Any function</option>
                                <option value="accounting">Accounting</option>
                                <option value="administrative">Administrative</option>
                                <option value="arts-design">Arts and Design</option>
                                <option value="business-development">Business Development</option>
                                <option value="community-social">Community & Social Services</option>
                                <option value="consulting">Consulting</option>
                                <option value="education">Education</option>
                                <option value="engineering">Engineering</option>
                                <option value="entrepreneurship">Entrepreneurship</option>
                                <option value="finance">Finance</option>
                                <option value="healthcare">Healthcare Services</option>
                                <option value="human-resources">Human Resources</option>
                                <option value="information-technology">Information Technology</option>
                                <option value="legal">Legal</option>
                                <option value="marketing">Marketing</option>
                                <option value="media-communications">Media & Communications</option>
                                <option value="military-protective">Military & Protective Services</option>
                                <option value="operations">Operations</option>
                                <option value="product-management">Product Management</option>
                                <option value="program-project">Program and Project Management</option>
                                <option value="purchasing">Purchasing</option>
                                <option value="quality-assurance">Quality Assurance</option>
                                <option value="real-estate">Real Estate</option>
                                <option value="research">Research</option>
                                <option value="sales">Sales</option>
                                <option value="support">Support</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Current Job Title</label>
                              <input
                                type="text"
                                value={formData.salesNavigatorCriteria.currentJobTitle}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  salesNavigatorCriteria: { ...prev.salesNavigatorCriteria, currentJobTitle: e.target.value }
                                }))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Current job title"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Seniority Level</label>
                              <select
                                value={formData.salesNavigatorCriteria.seniorityLevel}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  salesNavigatorCriteria: { ...prev.salesNavigatorCriteria, seniorityLevel: e.target.value }
                                }))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="">Any level</option>
                                <option value="unpaid">Unpaid</option>
                                <option value="training">Training</option>
                                <option value="entry">Entry level</option>
                                <option value="associate">Associate</option>
                                <option value="mid-senior">Mid-Senior level</option>
                                <option value="director">Director</option>
                                <option value="executive">Executive</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Past Job Title</label>
                              <input
                                type="text"
                                value={formData.salesNavigatorCriteria.pastJobTitle}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  salesNavigatorCriteria: { ...prev.salesNavigatorCriteria, pastJobTitle: e.target.value }
                                }))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Past job title"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Years in Current Company</label>
                              <select
                                value={formData.salesNavigatorCriteria.yearsInCurrentCompany}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  salesNavigatorCriteria: { ...prev.salesNavigatorCriteria, yearsInCurrentCompany: e.target.value }
                                }))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="">Any duration</option>
                                <option value="less-than-1">Less than 1 year</option>
                                <option value="1-2">1-2 years</option>
                                <option value="3-5">3-5 years</option>
                                <option value="6-10">6-10 years</option>
                                <option value="more-than-10">More than 10 years</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Years in Current Position</label>
                              <select
                                value={formData.salesNavigatorCriteria.yearsInCurrentPosition}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  salesNavigatorCriteria: { ...prev.salesNavigatorCriteria, yearsInCurrentPosition: e.target.value }
                                }))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="">Any duration</option>
                                <option value="less-than-1">Less than 1 year</option>
                                <option value="1-2">1-2 years</option>
                                <option value="3-5">3-5 years</option>
                                <option value="6-10">6-10 years</option>
                                <option value="more-than-10">More than 10 years</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Personal Section */}
                        <div>
                          <h5 className="text-sm font-semibold text-gray-900 mb-3">Personal</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Geography</label>
                              <input
                                type="text"
                                value={formData.salesNavigatorCriteria.geography}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  salesNavigatorCriteria: { ...prev.salesNavigatorCriteria, geography: e.target.value }
                                }))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Geographic location"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Industry</label>
                              <input
                                type="text"
                                value={formData.salesNavigatorCriteria.industry}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  salesNavigatorCriteria: { ...prev.salesNavigatorCriteria, industry: e.target.value }
                                }))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Industry"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                              <input
                                type="text"
                                value={formData.salesNavigatorCriteria.firstName}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  salesNavigatorCriteria: { ...prev.salesNavigatorCriteria, firstName: e.target.value }
                                }))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="First name"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                              <input
                                type="text"
                                value={formData.salesNavigatorCriteria.lastName}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  salesNavigatorCriteria: { ...prev.salesNavigatorCriteria, lastName: e.target.value }
                                }))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Last name"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Profile Language</label>
                              <select
                                value={formData.salesNavigatorCriteria.profileLanguage}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  salesNavigatorCriteria: { ...prev.salesNavigatorCriteria, profileLanguage: e.target.value }
                                }))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="">Any language</option>
                                <option value="en">English</option>
                                <option value="es">Spanish</option>
                                <option value="fr">French</option>
                                <option value="de">German</option>
                                <option value="it">Italian</option>
                                <option value="pt">Portuguese</option>
                                <option value="zh">Chinese</option>
                                <option value="ja">Japanese</option>
                                <option value="ko">Korean</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Years of Experience</label>
                              <select
                                value={formData.salesNavigatorCriteria.yearsOfExperience}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  salesNavigatorCriteria: { ...prev.salesNavigatorCriteria, yearsOfExperience: e.target.value }
                                }))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="">Any experience</option>
                                <option value="1-2">1-2 years</option>
                                <option value="3-5">3-5 years</option>
                                <option value="6-10">6-10 years</option>
                                <option value="11-15">11-15 years</option>
                                <option value="16-20">16-20 years</option>
                                <option value="21+">21+ years</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Groups</label>
                              <input
                                type="text"
                                value={formData.salesNavigatorCriteria.groups}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  salesNavigatorCriteria: { ...prev.salesNavigatorCriteria, groups: e.target.value }
                                }))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="LinkedIn groups"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">School</label>
                              <input
                                type="text"
                                value={formData.salesNavigatorCriteria.school}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  salesNavigatorCriteria: { ...prev.salesNavigatorCriteria, school: e.target.value }
                                }))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="School or university"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Buyer Intent Section */}
                        <div>
                          <h5 className="text-sm font-semibold text-gray-900 mb-3">Buyer Intent</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Category Interest</label>
                              <input
                                type="text"
                                value={formData.salesNavigatorCriteria.categoryInterest}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  salesNavigatorCriteria: { ...prev.salesNavigatorCriteria, categoryInterest: e.target.value }
                                }))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Category of interest"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={formData.salesNavigatorCriteria.followingYourCompany}
                                  onChange={(e) => setFormData(prev => ({ 
                                    ...prev, 
                                    salesNavigatorCriteria: { ...prev.salesNavigatorCriteria, followingYourCompany: e.target.checked }
                                  }))}
                                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                />
                                <span className="ml-2 text-xs text-gray-700">Following your company</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={formData.salesNavigatorCriteria.viewedProfileRecently}
                                  onChange={(e) => setFormData(prev => ({ 
                                    ...prev, 
                                    salesNavigatorCriteria: { ...prev.salesNavigatorCriteria, viewedProfileRecently: e.target.checked }
                                  }))}
                                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                />
                                <span className="ml-2 text-xs text-gray-700">Viewed your profile recently</span>
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Best Path In Section */}
                        <div>
                          <h5 className="text-sm font-semibold text-gray-900 mb-3">Best Path In</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Connection</label>
                              <select
                                value={formData.salesNavigatorCriteria.connection}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  salesNavigatorCriteria: { ...prev.salesNavigatorCriteria, connection: e.target.value }
                                }))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="">Any connection</option>
                                <option value="1st">1st connections</option>
                                <option value="2nd">2nd connections</option>
                                <option value="3rd">3rd+ connections</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Connections Of</label>
                              <input
                                type="text"
                                value={formData.salesNavigatorCriteria.connectionsOf}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  salesNavigatorCriteria: { ...prev.salesNavigatorCriteria, connectionsOf: e.target.value }
                                }))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Connections of specific person"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={formData.salesNavigatorCriteria.pastColleague}
                                  onChange={(e) => setFormData(prev => ({ 
                                    ...prev, 
                                    salesNavigatorCriteria: { ...prev.salesNavigatorCriteria, pastColleague: e.target.checked }
                                  }))}
                                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                />
                                <span className="ml-2 text-xs text-gray-700">Past colleague</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={formData.salesNavigatorCriteria.sharedExperiences}
                                  onChange={(e) => setFormData(prev => ({ 
                                    ...prev, 
                                    salesNavigatorCriteria: { ...prev.salesNavigatorCriteria, sharedExperiences: e.target.checked }
                                  }))}
                                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                />
                                <span className="ml-2 text-xs text-gray-700">Shared experiences</span>
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Recent Updates Section */}
                        <div>
                          <h5 className="text-sm font-semibold text-gray-900 mb-3">Recent Updates</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.salesNavigatorCriteria.changedJobs}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  salesNavigatorCriteria: { ...prev.salesNavigatorCriteria, changedJobs: e.target.checked }
                                }))}
                                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                              />
                              <span className="ml-2 text-xs text-gray-700">Changed jobs</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.salesNavigatorCriteria.postedOnLinkedIn}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  salesNavigatorCriteria: { ...prev.salesNavigatorCriteria, postedOnLinkedIn: e.target.checked }
                                }))}
                                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                              />
                              <span className="ml-2 text-xs text-gray-700">Posted on LinkedIn</span>
                            </label>
                          </div>
                        </div>

                        {/* Workflow Section */}
                        <div>
                          <h5 className="text-sm font-semibold text-gray-900 mb-3">Workflow</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Persona</label>
                              <input
                                type="text"
                                value={formData.salesNavigatorCriteria.persona}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  salesNavigatorCriteria: { ...prev.salesNavigatorCriteria, persona: e.target.value }
                                }))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Persona"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Account Lists</label>
                              <input
                                type="text"
                                value={formData.salesNavigatorCriteria.accountLists}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  salesNavigatorCriteria: { ...prev.salesNavigatorCriteria, accountLists: e.target.value }
                                }))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Account lists"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Lead Lists</label>
                              <input
                                type="text"
                                value={formData.salesNavigatorCriteria.leadLists}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  salesNavigatorCriteria: { ...prev.salesNavigatorCriteria, leadLists: e.target.value }
                                }))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Lead lists"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">People in CRM</label>
                              <input
                                type="text"
                                value={formData.salesNavigatorCriteria.peopleInCRM}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  salesNavigatorCriteria: { ...prev.salesNavigatorCriteria, peopleInCRM: e.target.value }
                                }))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="People in CRM"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">People You Interacted With</label>
                              <input
                                type="text"
                                value={formData.salesNavigatorCriteria.peopleInteractedWith}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  salesNavigatorCriteria: { ...prev.salesNavigatorCriteria, peopleInteractedWith: e.target.value }
                                }))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="People you interacted with"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Saved Leads and Accounts</label>
                              <input
                                type="text"
                                value={formData.salesNavigatorCriteria.savedLeadsAccounts}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  salesNavigatorCriteria: { ...prev.salesNavigatorCriteria, savedLeadsAccounts: e.target.value }
                                }))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Saved leads and accounts"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetFormData();
                      setError('');
                    }}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateCampaign}
                    disabled={actionLoading || !formData.name}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Creating...
                      </div>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2 inline" />
                        Create Campaign
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CampaignsPage;