import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { Plus, Search, Users, BarChart3, Settings, Loader2, Target } from 'lucide-react';

interface Campaign {
  _id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'completed';
  createdAt: string;
  searchCriteria: {
    keywords: string;
    location: string;
    currentCompany: string;
    title: string;
    industry: string;
    connectionLevel: string;
    pastCompany: string;
    school: string;
    salesNavigatorUrl: string;
    customFilters: string;
  };
  stats?: {
    totalProspects: number;
    contacted: number;
    responded: number;
  };
}

export default function Campaigns() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [searchingProspects, setSearchingProspects] = useState<string | null>(null);
  const [searchType, setSearchType] = useState<'standard' | 'sales_navigator'>('standard');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    searchCriteria: {
      keywords: '',
      location: '',
      currentCompany: '',
      title: '',
      industry: '',
      connectionLevel: '',
      pastCompany: '',
      school: '',
      salesNavigatorUrl: '',
      customFilters: ''
    },
    salesNavigatorCriteria: {
      // Company
      company: '',
      currentCompany: '',
      expandCurrentCompany: false,
      companyHeadcount: '',
      expandCompanyHeadcount: false,
      pastCompany: '',
      expandPastCompany: false,
      companyType: '',
      expandCompanyType: false,
      companyHeadquarters: '',
      expandCompanyHeadquarters: false,
      
      // Role
      function: '',
      expandFunction: false,
      currentJobTitle: '',
      expandCurrentJobTitle: false,
      seniorityLevel: '',
      expandSeniorityLevel: false,
      pastJobTitle: '',
      expandPastJobTitle: false,
      yearsInCurrentCompany: '',
      expandYearsInCurrentCompany: false,
      yearsInCurrentPosition: '',
      expandYearsInCurrentPosition: false,
      
      // Personal
      geography: '',
      expandGeography: false,
      industry: '',
      expandIndustry: false,
      firstName: '',
      expandFirstName: false,
      lastName: '',
      expandLastName: false,
      profileLanguage: '',
      expandProfileLanguage: false,
      yearsOfExperience: '',
      expandYearsOfExperience: false,
      groups: '',
      expandGroups: false,
      school: '',
      expandSchool: false,
      
      // Buyer intent
      categoryInterest: '',
      expandCategoryInterest: false,
      followingYourCompany: false,
      viewedYourProfile: false,
      
      // Best path in
      connection: '',
      expandConnection: false,
      connectionsOf: '',
      expandConnectionsOf: false,
      pastColleague: false,
      sharedExperiences: false,
      
      // Recent updates
      changedJobs: false,
      postedOnLinkedIn: false,
      
      // Workflow
      persona: '',
      expandPersona: false,
      accountLists: '',
      expandAccountLists: false,
      leadLists: '',
      expandLeadLists: false,
      peopleInCRM: '',
      expandPeopleInCRM: false,
      peopleYouInteractedWith: '',
      expandPeopleYouInteractedWith: false,
      savedLeadsAndAccounts: ''
    }
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/campaigns', {
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
        throw new Error('Failed to fetch campaigns');
      }
      
      const data = await response.json();
      if (data.success && Array.isArray(data.campaigns)) {
        setCampaigns(data.campaigns);
      } else {
        console.error('Invalid campaigns data:', data);
        setCampaigns([]);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create campaign');
      }

      const data = await response.json();
      if (data.success) {
        await fetchCampaigns();
        setShowCreateModal(false);
        resetFormData();
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const handleEditCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;

    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`/api/campaigns/${editingCampaign._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update campaign');
      }

      const data = await response.json();
      if (data.success) {
        await fetchCampaigns();
        setShowEditModal(false);
        setEditingCampaign(null);
        resetFormData();
      }
    } catch (error) {
      console.error('Error updating campaign:', error);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete campaign');
      }

      const data = await response.json();
      if (data.success) {
        await fetchCampaigns();
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  };

  const handleSearchProspects = async (campaignId: string) => {
    setSearchingProspects(campaignId);
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`/api/campaigns/${campaignId}/search-prospects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ maxResults: 25 })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to search prospects');
      }

      const data = await response.json();
      if (data.success) {
        alert(`Found ${data.results?.newProspects || 0} new prospects for this campaign!`);
        await fetchCampaigns();
      }
    } catch (error) {
      console.error('Error searching prospects:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to search prospects'}`);
    } finally {
      setSearchingProspects(null);
    }
  };

  const openEditModal = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      description: campaign.description,
      searchCriteria: campaign.searchCriteria || {
        keywords: '',
        location: '',
        currentCompany: '',
        title: '',
        industry: '',
        connectionLevel: '',
        pastCompany: '',
        school: '',
        salesNavigatorUrl: '',
        customFilters: ''
      }
    });
    setShowEditModal(true);
  };

  const resetFormData = () => {
    setFormData({
      name: '',
      description: '',
      searchCriteria: {
        keywords: '',
        location: '',
        currentCompany: '',
        title: '',
        industry: '',
        connectionLevel: '',
        pastCompany: '',
        school: '',
        salesNavigatorUrl: '',
        customFilters: ''
      },
      salesNavigatorCriteria: {
        company: '',
        currentCompany: '',
        expandCurrentCompany: false,
        companyHeadcount: '',
        expandCompanyHeadcount: false,
        pastCompany: '',
        expandPastCompany: false,
        companyType: '',
        expandCompanyType: false,
        companyHeadquarters: '',
        expandCompanyHeadquarters: false,
        function: '',
        expandFunction: false,
        currentJobTitle: '',
        expandCurrentJobTitle: false,
        seniorityLevel: '',
        expandSeniorityLevel: false,
        pastJobTitle: '',
        expandPastJobTitle: false,
        yearsInCurrentCompany: '',
        expandYearsInCurrentCompany: false,
        yearsInCurrentPosition: '',
        expandYearsInCurrentPosition: false,
        geography: '',
        expandGeography: false,
        industry: '',
        expandIndustry: false,
        firstName: '',
        expandFirstName: false,
        lastName: '',
        expandLastName: false,
        profileLanguage: '',
        expandProfileLanguage: false,
        yearsOfExperience: '',
        expandYearsOfExperience: false,
        groups: '',
        expandGroups: false,
        school: '',
        expandSchool: false,
        categoryInterest: '',
        expandCategoryInterest: false,
        followingYourCompany: false,
        viewedYourProfile: false,
        connection: '',
        expandConnection: false,
        connectionsOf: '',
        expandConnectionsOf: false,
        pastColleague: false,
        sharedExperiences: false,
        changedJobs: false,
        postedOnLinkedIn: false,
        persona: '',
        expandPersona: false,
        accountLists: '',
        expandAccountLists: false,
        leadLists: '',
        expandLeadLists: false,
        peopleInCRM: '',
        expandPeopleInCRM: false,
        peopleYouInteractedWith: '',
        expandPeopleYouInteractedWith: false,
        savedLeadsAndAccounts: ''
      }
    });
    setSearchType('standard');
  };

  const getSearchCriteriaPreview = (searchCriteria: Campaign['searchCriteria']) => {
    if (!searchCriteria) return 'No search criteria defined';
    
    const criteria = [];
    if (searchCriteria.keywords) criteria.push(`Keywords: ${searchCriteria.keywords}`);
    if (searchCriteria.location) criteria.push(`Location: ${searchCriteria.location}`);
    if (searchCriteria.currentCompany) criteria.push(`Company: ${searchCriteria.currentCompany}`);
    if (searchCriteria.title) criteria.push(`Title: ${searchCriteria.title}`);
    if (searchCriteria.industry) criteria.push(`Industry: ${searchCriteria.industry}`);
    
    if (criteria.length === 0) return 'No search criteria defined';
    if (criteria.length <= 3) return criteria.join(', ');
    return criteria.slice(0, 3).join(', ') + '...';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
            <p className="text-gray-600">Manage your LinkedIn outreach campaigns</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        </div>

        {/* Campaigns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <div key={campaign._id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{campaign.description}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                  campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {campaign.status}
                </span>
              </div>

              {/* LinkedIn Prospect Search Section */}
              <div className="border-t border-gray-200 pt-4 mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">LinkedIn Prospect Search</h4>
                <p className="text-xs text-gray-600 mb-3">
                  {getSearchCriteriaPreview(campaign.searchCriteria)}
                </p>
                <button
                  onClick={() => handleSearchProspects(campaign._id)}
                  disabled={searchingProspects === campaign._id}
                  className="w-full bg-purple-600 text-white px-3 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  {searchingProspects === campaign._id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Searching LinkedIn...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Find Prospects
                    </>
                  )}
                </button>
              </div>

              {/* Stats */}
              {campaign.stats && (
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{campaign.stats.totalProspects}</div>
                    <div className="text-xs text-gray-600">Prospects</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{campaign.stats.contacted}</div>
                    <div className="text-xs text-gray-600">Contacted</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{campaign.stats.responded}</div>
                    <div className="text-xs text-gray-600">Responded</div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(campaign)}
                  className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteCampaign(campaign._id)}
                  className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded-md hover:bg-red-200 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {campaigns.length === 0 && (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
            <p className="text-gray-600 mb-4">Create your first campaign to start reaching out to prospects</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              Create Campaign
            </button>
          </div>
        )}

        {/* Quick Actions Panel */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Search className="w-8 h-8 text-purple-600" />
              <div>
                <h4 className="font-medium text-gray-900">Sales Navigator Search</h4>
                <p className="text-sm text-gray-600">Advanced prospect targeting with Sales Navigator</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-purple-600" />
              <div>
                <h4 className="font-medium text-gray-900">Multi-Channel Campaigns</h4>
                <p className="text-sm text-gray-600">LinkedIn + Email automation campaigns</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-purple-600" />
              <div>
                <h4 className="font-medium text-gray-900">AI-Powered Analytics</h4>
                <p className="text-sm text-gray-600">Lead scoring, appointment tracking, and ROI analysis</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Campaign</h2>
              <form onSubmit={handleCreateCampaign} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Campaign Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                </div>

                {/* LinkedIn Search Criteria */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">LinkedIn Search Criteria</h3>
                    <div className="flex items-center space-x-3">
                      <span className={`text-sm font-medium ${searchType === 'standard' ? 'text-blue-600' : 'text-gray-500'}`}>
                        Standard Search
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={searchType === 'sales_navigator'}
                          onChange={(e) => setSearchType(e.target.checked ? 'sales_navigator' : 'standard')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                      <span className={`text-sm font-medium ${searchType === 'sales_navigator' ? 'text-blue-600' : 'text-gray-500'}`}>
                        Sales Navigator
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    {searchType === 'standard' 
                      ? 'Define your target prospects. These criteria will be used when searching for prospects on LinkedIn.'
                      : 'Use LinkedIn Sales Navigator advanced search criteria for more precise targeting.'
                    }
                  </p>
                  
                  {searchType === 'standard' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Keywords
                        </label>
                        <input
                          type="text"
                          value={formData.searchCriteria.keywords}
                          onChange={(e) => setFormData({
                            ...formData,
                            searchCriteria: { ...formData.searchCriteria, keywords: e.target.value }
                          })}
                          placeholder="e.g., software engineer, marketing"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Location
                        </label>
                        <input
                          type="text"
                          value={formData.searchCriteria.location}
                          onChange={(e) => setFormData({
                            ...formData,
                            searchCriteria: { ...formData.searchCriteria, location: e.target.value }
                          })}
                          placeholder="e.g., San Francisco, CA"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Company
                        </label>
                        <input
                          type="text"
                          value={formData.searchCriteria.currentCompany}
                          onChange={(e) => setFormData({
                            ...formData,
                            searchCriteria: { ...formData.searchCriteria, currentCompany: e.target.value }
                          })}
                          placeholder="e.g., Google, Microsoft"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Job Title
                        </label>
                        <input
                          type="text"
                          value={formData.searchCriteria.title}
                          onChange={(e) => setFormData({
                            ...formData,
                            searchCriteria: { ...formData.searchCriteria, title: e.target.value }
                          })}
                          placeholder="e.g., CEO, Director, Manager"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Industry
                        </label>
                        <input
                          type="text"
                          value={formData.searchCriteria.industry}
                          onChange={(e) => setFormData({
                            ...formData,
                            searchCriteria: { ...formData.searchCriteria, industry: e.target.value }
                          })}
                          placeholder="e.g., Technology, Healthcare"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Connection Level
                        </label>
                        <select
                          value={formData.searchCriteria.connectionLevel}
                          onChange={(e) => setFormData({
                            ...formData,
                            searchCriteria: { ...formData.searchCriteria, connectionLevel: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">Any connection level</option>
                          <option value="1st">1st connections</option>
                          <option value="2nd">2nd connections</option>
                          <option value="3rd+">3rd+ connections</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Past Company
                        </label>
                        <input
                          type="text"
                          value={formData.searchCriteria.pastCompany}
                          onChange={(e) => setFormData({
                            ...formData,
                            searchCriteria: { ...formData.searchCriteria, pastCompany: e.target.value }
                          })}
                          placeholder="e.g., Apple, Amazon"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          School
                        </label>
                        <input
                          type="text"
                          value={formData.searchCriteria.school}
                          onChange={(e) => setFormData({
                            ...formData,
                            searchCriteria: { ...formData.searchCriteria, school: e.target.value }
                          })}
                          placeholder="e.g., Stanford, MIT"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Company Section */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-md font-semibold text-gray-900 mb-4">Company</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Company
                            </label>
                            <input
                              type="text"
                              value={formData.salesNavigatorCriteria.company}
                              onChange={(e) => setFormData({
                                ...formData,
                                salesNavigatorCriteria: { ...formData.salesNavigatorCriteria, company: e.target.value }
                              })}
                              placeholder="Company name"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Current Company
                            </label>
                            <input
                              type="text"
                              value={formData.salesNavigatorCriteria.currentCompany}
                              onChange={(e) => setFormData({
                                ...formData,
                                salesNavigatorCriteria: { ...formData.salesNavigatorCriteria, currentCompany: e.target.value }
                              })}
                              placeholder="Current company"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Company Headcount
                            </label>
                            <select
                              value={formData.salesNavigatorCriteria.companyHeadcount}
                              onChange={(e) => setFormData({
                                ...formData,
                                salesNavigatorCriteria: { ...formData.salesNavigatorCriteria, companyHeadcount: e.target.value }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="">Any size</option>
                              <option value="1-10">1-10 employees</option>
                              <option value="11-50">11-50 employees</option>
                              <option value="51-200">51-200 employees</option>
                              <option value="201-500">201-500 employees</option>
                              <option value="501-1000">501-1000 employees</option>
                              <option value="1001-5000">1001-5000 employees</option>
                              <option value="5001-10000">5001-10000 employees</option>
                              <option value="10001+">10001+ employees</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Past Company
                            </label>
                            <input
                              type="text"
                              value={formData.salesNavigatorCriteria.pastCompany}
                              onChange={(e) => setFormData({
                                ...formData,
                                salesNavigatorCriteria: { ...formData.salesNavigatorCriteria, pastCompany: e.target.value }
                              })}
                              placeholder="Past company"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Company Type
                            </label>
                            <select
                              value={formData.salesNavigatorCriteria.companyType}
                              onChange={(e) => setFormData({
                                ...formData,
                                salesNavigatorCriteria: { ...formData.salesNavigatorCriteria, companyType: e.target.value }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="">Any type</option>
                              <option value="public">Public Company</option>
                              <option value="private">Private Company</option>
                              <option value="nonprofit">Non-profit</option>
                              <option value="government">Government Agency</option>
                              <option value="educational">Educational Institution</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Company Headquarters
                            </label>
                            <input
                              type="text"
                              value={formData.salesNavigatorCriteria.companyHeadquarters}
                              onChange={(e) => setFormData({
                                ...formData,
                                salesNavigatorCriteria: { ...formData.salesNavigatorCriteria, companyHeadquarters: e.target.value }
                              })}
                              placeholder="Headquarters location"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Role Section */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-md font-semibold text-gray-900 mb-4">Role</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Function
                            </label>
                            <select
                              value={formData.salesNavigatorCriteria.function}
                              onChange={(e) => setFormData({
                                ...formData,
                                salesNavigatorCriteria: { ...formData.salesNavigatorCriteria, function: e.target.value }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Current Job Title
                            </label>
                            <input
                              type="text"
                              value={formData.salesNavigatorCriteria.currentJobTitle}
                              onChange={(e) => setFormData({
                                ...formData,
                                salesNavigatorCriteria: { ...formData.salesNavigatorCriteria, currentJobTitle: e.target.value }
                              })}
                              placeholder="Current job title"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Seniority Level
                            </label>
                            <select
                              value={formData.salesNavigatorCriteria.seniorityLevel}
                              onChange={(e) => setFormData({
                                ...formData,
                                salesNavigatorCriteria: { ...formData.salesNavigatorCriteria, seniorityLevel: e.target.value }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Past Job Title
                            </label>
                            <input
                              type="text"
                              value={formData.salesNavigatorCriteria.pastJobTitle}
                              onChange={(e) => setFormData({
                                ...formData,
                                salesNavigatorCriteria: { ...formData.salesNavigatorCriteria, pastJobTitle: e.target.value }
                              })}
                              placeholder="Past job title"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Years in Current Company
                            </label>
                            <select
                              value={formData.salesNavigatorCriteria.yearsInCurrentCompany}
                              onChange={(e) => setFormData({
                                ...formData,
                                salesNavigatorCriteria: { ...formData.salesNavigatorCriteria, yearsInCurrentCompany: e.target.value }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Years in Current Position
                            </label>
                            <select
                              value={formData.salesNavigatorCriteria.yearsInCurrentPosition}
                              onChange={(e) => setFormData({
                                ...formData,
                                salesNavigatorCriteria: { ...formData.salesNavigatorCriteria, yearsInCurrentPosition: e.target.value }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-md font-semibold text-gray-900 mb-4">Personal</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Geography
                            </label>
                            <input
                              type="text"
                              value={formData.salesNavigatorCriteria.geography}
                              onChange={(e) => setFormData({
                                ...formData,
                                salesNavigatorCriteria: { ...formData.salesNavigatorCriteria, geography: e.target.value }
                              })}
                              placeholder="Geographic location"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Industry
                            </label>
                            <input
                              type="text"
                              value={formData.salesNavigatorCriteria.industry}
                              onChange={(e) => setFormData({
                                ...formData,
                                salesNavigatorCriteria: { ...formData.salesNavigatorCriteria, industry: e.target.value }
                              })}
                              placeholder="Industry"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              First Name
                            </label>
                            <input
                              type="text"
                              value={formData.salesNavigatorCriteria.firstName}
                              onChange={(e) => setFormData({
                                ...formData,
                                salesNavigatorCriteria: { ...formData.salesNavigatorCriteria, firstName: e.target.value }
                              })}
                              placeholder="First name"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Last Name
                            </label>
                            <input
                              type="text"
                              value={formData.salesNavigatorCriteria.lastName}
                              onChange={(e) => setFormData({
                                ...formData,
                                salesNavigatorCriteria: { ...formData.salesNavigatorCriteria, lastName: e.target.value }
                              })}
                              placeholder="Last name"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Profile Language
                            </label>
                            <select
                              value={formData.salesNavigatorCriteria.profileLanguage}
                              onChange={(e) => setFormData({
                                ...formData,
                                salesNavigatorCriteria: { ...formData.salesNavigatorCriteria, profileLanguage: e.target.value }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                              <option value="ar">Arabic</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Years of Experience
                            </label>
                            <select
                              value={formData.salesNavigatorCriteria.yearsOfExperience}
                              onChange={(e) => setFormData({
                                ...formData,
                                salesNavigatorCriteria: { ...formData.salesNavigatorCriteria, yearsOfExperience: e.target.value }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="">Any experience</option>
                              <option value="1-2">1-2 years</option>
                              <option value="3-5">3-5 years</option>
                              <option value="6-10">6-10 years</option>
                              <option value="11-15">11-15 years</option>
                              <option value="16-20">16-20 years</option>
                              <option value="20+">20+ years</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Groups
                            </label>
                            <input
                              type="text"
                              value={formData.salesNavigatorCriteria.groups}
                              onChange={(e) => setFormData({
                                ...formData,
                                salesNavigatorCriteria: { ...formData.salesNavigatorCriteria, groups: e.target.value }
                              })}
                              placeholder="LinkedIn groups"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              School
                            </label>
                            <input
                              type="text"
                              value={formData.salesNavigatorCriteria.school}
                              onChange={(e) => setFormData({
                                ...formData,
                                salesNavigatorCriteria: { ...formData.salesNavigatorCriteria, school: e.target.value }
                              })}
                              placeholder="School or university"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Buyer Intent Section */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-md font-semibold text-gray-900 mb-4">Buyer Intent</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Category Interest
                            </label>
                            <input
                              type="text"
                              value={formData.salesNavigatorCriteria.categoryInterest}
                              onChange={(e) => setFormData({
                                ...formData,
                                salesNavigatorCriteria: { ...formData.salesNavigatorCriteria, categoryInterest: e.target.value }
                              })}
                              placeholder="Category of interest"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.salesNavigatorCriteria.followingYourCompany}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  salesNavigatorCriteria: { ...formData.salesNavigatorCriteria, followingYourCompany: e.target.checked }
                                })}
                                className="rounded border-gray-300 text-purple-600 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                              />
                              <span className="ml-2 text-sm text-gray-700">Following your company</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.salesNavigatorCriteria.viewedYourProfile}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  salesNavigatorCriteria: { ...formData.salesNavigatorCriteria, viewedYourProfile: e.target.checked }
                                })}
                                className="rounded border-gray-300 text-purple-600 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                              />
                              <span className="ml-2 text-sm text-gray-700">Viewed your profile recently</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Best Path In Section */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-md font-semibold text-gray-900 mb-4">Best Path In</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Connection
                            </label>
                            <select
                              value={formData.salesNavigatorCriteria.connection}
                              onChange={(e) => setFormData({
                                ...formData,
                                salesNavigatorCriteria: { ...formData.salesNavigatorCriteria, connection: e.target.value }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="">Any connection</option>
                              <option value="1st">1st connections</option>
                              <option value="2nd">2nd connections</option>
                              <option value="3rd+">3rd+ connections</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Connections Of
                            </label>
                            <input
                              type="text"
                              value={formData.salesNavigatorCriteria.connectionsOf}
                              onChange={(e) => setFormData({
                                ...formData,
                                salesNavigatorCriteria: { ...formData.salesNavigatorCriteria, connectionsOf: e.target.value }
                              })}
                              placeholder="Connections of specific person"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div className="md:col-span-2 space-y-3">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.salesNavigatorCriteria.pastColleague}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  salesNavigatorCriteria: { ...formData.salesNavigatorCriteria, pastColleague: e.target.checked }
                                })}
                                className="rounded border-gray-300 text-purple-600 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                              />
                              <span className="ml-2 text-sm text-gray-700">Past colleague</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.salesNavigatorCriteria.sharedExperiences}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  salesNavigatorCriteria: { ...formData.salesNavigatorCriteria, sharedExperiences: e.target.checked }
                                })}
                                className="rounded border-gray-300 text-purple-600 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                              />
                              <span className="ml-2 text-sm text-gray-700">Shared experiences</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Recent Updates Section */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-md font-semibold text-gray-900 mb-4">Recent Updates</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.salesNavigatorCriteria.changedJobs}
                              onChange={(e) => setFormData({
                                ...formData,
                                salesNavigatorCriteria: { ...formData.salesNavigatorCriteria, changedJobs: e.target.checked }
                              })}
                              className="rounded border-gray-300 text-purple-600 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                            />
                            <span className="ml-2 text-sm text-gray-700">Changed jobs</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.salesNavigatorCriteria.postedOnLinkedIn}
                              onChange={(e) => setFormData({
                                ...formData,
                                salesNavigatorCriteria: { ...formData.salesNavigatorCriteria, postedOnLinkedIn: e.target.checked }
                              })}
                              className="rounded border-gray-300 text-purple-600 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                            />
                            <span className="ml-2 text-sm text-gray-700">Posted on LinkedIn</span>
                          </label>
                        </div>
                      </div>

                      {/* Workflow Section */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-md font-semibold text-gray-900 mb-4">Workflow</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Persona
                            </label>
                            <input
                              type="text"
                              value={formData.salesNavigatorCriteria.persona}
                              onChange={(e) => setFormData({
                                ...formData,
                                salesNavigatorCriteria: { ...formData.salesNavigatorCriteria, persona: e.target.value }
                              })}
                              placeholder="Persona type"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Account Lists
                            </label>
                            <input
                              type="text"
                              value={formData.salesNavigatorCriteria.accountLists}
                              onChange={(e) => setFormData({
                                ...formData,
                                salesNavigatorCriteria: { ...formData.salesNavigatorCriteria, accountLists: e.target.value }
                              })}
                              placeholder="Account lists"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Lead Lists
                            </label>
                            <input
                              type="text"
                              value={formData.salesNavigatorCriteria.leadLists}
                              onChange={(e) => setFormData({
                                ...formData,
                                salesNavigatorCriteria: { ...formData.salesNavigatorCriteria, leadLists: e.target.value }
                              })}
                              placeholder="Lead lists"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              People in CRM
                            </label>
                            <input
                              type="text"
                              value={formData.salesNavigatorCriteria.peopleInCRM}
                              onChange={(e) => setFormData({
                                ...formData,
                                salesNavigatorCriteria: { ...formData.salesNavigatorCriteria, peopleInCRM: e.target.value }
                              })}
                              placeholder="People in CRM"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              People You Interacted With
                            </label>
                            <input
                              type="text"
                              value={formData.salesNavigatorCriteria.peopleYouInteractedWith}
                              onChange={(e) => setFormData({
                                ...formData,
                                salesNavigatorCriteria: { ...formData.salesNavigatorCriteria, peopleYouInteractedWith: e.target.value }
                              })}
                              placeholder="People you've interacted with"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Saved Leads and Accounts
                            </label>
                            <input
                              type="text"
                              value={formData.salesNavigatorCriteria.savedLeadsAndAccounts}
                              onChange={(e) => setFormData({
                                ...formData,
                                salesNavigatorCriteria: { ...formData.salesNavigatorCriteria, savedLeadsAndAccounts: e.target.value }
                              })}
                              placeholder="Saved leads and accounts"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {searchType === 'standard' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sales Navigator URL (Optional)
                      </label>
                      <input
                        type="url"
                        value={formData.searchCriteria.salesNavigatorUrl}
                        onChange={(e) => setFormData({
                          ...formData,
                          searchCriteria: { ...formData.searchCriteria, salesNavigatorUrl: e.target.value }
                        })}
                        placeholder="Paste LinkedIn Sales Navigator search URL"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        If provided, this URL will override the individual search criteria above
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetFormData();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  >
                    Create Campaign
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Campaign Modal */}
      {showEditModal && editingCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Campaign</h2>
              <form onSubmit={handleEditCampaign} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Campaign Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                </div>

                {/* LinkedIn Search Criteria */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">LinkedIn Search Criteria</h3>
                    <div className="flex items-center space-x-3">
                      <span className={`text-sm font-medium ${searchType === 'standard' ? 'text-blue-600' : 'text-gray-500'}`}>
                        Standard Search
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={searchType === 'sales_navigator'}
                          onChange={(e) => setSearchType(e.target.checked ? 'sales_navigator' : 'standard')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                      <span className={`text-sm font-medium ${searchType === 'sales_navigator' ? 'text-blue-600' : 'text-gray-500'}`}>
                        Sales Navigator
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    {searchType === 'standard' 
                      ? 'Update your target prospect criteria for profile scraping and lead generation.'
                      : 'Use LinkedIn Sales Navigator advanced search criteria for more precise targeting.'
                    }
                  </p>
                  
                  {searchType === 'standard' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Keywords
                        </label>
                        <input
                          type="text"
                          value={formData.searchCriteria.keywords}
                          onChange={(e) => setFormData({
                            ...formData,
                            searchCriteria: { ...formData.searchCriteria, keywords: e.target.value }
                          })}
                          placeholder="e.g., software engineer, marketing"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Location
                        </label>
                        <input
                          type="text"
                          value={formData.searchCriteria.location}
                          onChange={(e) => setFormData({
                            ...formData,
                            searchCriteria: { ...formData.searchCriteria, location: e.target.value }
                          })}
                          placeholder="e.g., San Francisco, CA"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Company
                        </label>
                        <input
                          type="text"
                          value={formData.searchCriteria.currentCompany}
                          onChange={(e) => setFormData({
                            ...formData,
                            searchCriteria: { ...formData.searchCriteria, currentCompany: e.target.value }
                          })}
                          placeholder="e.g., Google, Microsoft"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Job Title
                        </label>
                        <input
                          type="text"
                          value={formData.searchCriteria.title}
                          onChange={(e) => setFormData({
                            ...formData,
                            searchCriteria: { ...formData.searchCriteria, title: e.target.value }
                          })}
                          placeholder="e.g., CEO, Director, Manager"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Industry
                        </label>
                        <input
                          type="text"
                          value={formData.searchCriteria.industry}
                          onChange={(e) => setFormData({
                            ...formData,
                            searchCriteria: { ...formData.searchCriteria, industry: e.target.value }
                          })}
                          placeholder="e.g., Technology, Healthcare"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Connection Level
                        </label>
                        <select
                          value={formData.searchCriteria.connectionLevel}
                          onChange={(e) => setFormData({
                            ...formData,
                            searchCriteria: { ...formData.searchCriteria, connectionLevel: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">Any connection level</option>
                          <option value="1st">1st connections</option>
                          <option value="2nd">2nd connections</option>
                          <option value="3rd+">3rd+ connections</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Past Company
                        </label>
                        <input
                          type="text"
                          value={formData.searchCriteria.pastCompany}
                          onChange={(e) => setFormData({
                            ...formData,
                            searchCriteria: { ...formData.searchCriteria, pastCompany: e.target.value }
                          })}
                          placeholder="e.g., Apple, Amazon"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          School
                        </label>
                        <input
                          type="text"
                          value={formData.searchCriteria.school}
                          onChange={(e) => setFormData({
                            ...formData,
                            searchCriteria: { ...formData.searchCriteria, school: e.target.value }
                          })}
                          placeholder="e.g., Stanford, MIT"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-blue-50 rounded-lg">
                      <p className="text-blue-800 font-medium">Sales Navigator Search Fields</p>
                      <p className="text-blue-600 text-sm mt-1">Advanced targeting options will be available here</p>
                    </div>
                  )}

                  {searchType === 'standard' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sales Navigator URL (Optional)
                      </label>
                      <input
                        type="url"
                        value={formData.searchCriteria.salesNavigatorUrl}
                        onChange={(e) => setFormData({
                          ...formData,
                          searchCriteria: { ...formData.searchCriteria, salesNavigatorUrl: e.target.value }
                        })}
                        placeholder="Paste LinkedIn Sales Navigator search URL"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        If provided, this URL will override the individual search criteria above
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-blue-50 rounded-lg">
                      <p className="text-blue-800 font-medium">Sales Navigator Search Fields</p>
                      <p className="text-blue-600 text-sm mt-1">Advanced targeting options available in edit mode</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingCampaign(null);
                      resetFormData();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  >
                    Update Campaign
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}