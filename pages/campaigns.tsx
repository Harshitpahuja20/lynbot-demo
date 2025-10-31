import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
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
  _id: string;
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
  const [useSalesNavigator, setUseSalesNavigator] = useState(false);
  
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

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/campaigns', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
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
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
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
                <div key={campaign._id} className="p-6 hover:bg-gray-50">
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
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      <button
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md"
                        title="Edit Campaign"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      <button
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