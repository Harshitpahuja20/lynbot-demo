import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { Plus, Search, Users, BarChart3, Settings, Loader2 } from 'lucide-react';

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
      }
    });
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
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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
                  <h3 className="text-lg font-medium text-gray-900 mb-3">LinkedIn Search Criteria</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Define your target prospects. These criteria will be used when searching for prospects on LinkedIn.
                  </p>
                  
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

                  <div className="mt-4">
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
                  <h3 className="text-lg font-medium text-gray-900 mb-3">LinkedIn Search Criteria</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Update your target prospect criteria for profile scraping and lead generation. These criteria work with LinkedIn Sales Navigator to find and analyze prospect profiles.
                  </p>
                  
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

                  <div className="mt-4">
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