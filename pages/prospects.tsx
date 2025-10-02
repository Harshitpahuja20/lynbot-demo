import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ExportModal from '../components/ExportModal';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  X,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Building,
  MapPin,
  Briefcase,
  Download
} from 'lucide-react';

interface Campaign {
  _id: string;
  name: string;
}

interface Prospect {
  _id: string;
  campaignId: Campaign;
  linkedinData: {
    profileUrl: string;
    name: string;
    firstName?: string;
    lastName?: string;
    headline?: string;
    title?: string;
    company?: string;
    location?: string;
    industry?: string;
    connectionLevel?: string;
    profileImageUrl?: string;
    summary?: string;
  };
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
  };
  status: 'new' | 'connection_pending' | 'connection_sent' | 'connected' | 'connection_failed' | 'connection_declined' | 'message_sent' | 'message_replied' | 'message_failed' | 'follow_up_sent' | 'follow_up_replied' | 'unresponsive' | 'qualified' | 'not_qualified' | 'archived';
  scoring?: {
    leadScore: number;
  };
  interactions: any[];
  tags: string[];
  notes: any[];
  source: string;
  createdAt: string;
  lastUpdated: string;
}

const ProspectsPage: React.FC = () => {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | string>('all');
  const [filterCampaign, setFilterCampaign] = useState<'all' | string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Form data for create/edit
  const [formData, setFormData] = useState({
    campaignId: '',
    linkedinData: {
      profileUrl: '',
      name: '',
      headline: '',
      title: '',
      company: '',
      location: '',
      industry: '',
      connectionLevel: '3rd',
      summary: ''
    },
    contactInfo: {
      email: '',
      phone: '',
      website: ''
    }
  });

  useEffect(() => {
    fetchProspects();
    fetchCampaigns();
  }, []);

  const fetchProspects = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/prospects', {
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
        throw new Error('Failed to fetch prospects');
      }

      const data = await response.json();
      if (data.success) {
        setProspects(data.prospects || []);
      } else {
        throw new Error(data.error || 'Failed to fetch prospects');
      }
    } catch (err) {
      console.error('Error fetching prospects:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch prospects');
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCampaigns(data.campaigns || []);
        }
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    }
  };

  const handleCreateProspect = async () => {
    if (!formData.campaignId || !formData.linkedinData.profileUrl || !formData.linkedinData.name) {
      setError('Campaign, LinkedIn profile URL, and name are required');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('/api/prospects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create prospect');
      }

      const data = await response.json();
      if (data.success) {
        setProspects(prev => [data.prospect, ...prev]);
        setShowCreateModal(false);
        resetFormData();
        setError('');
      } else {
        throw new Error(data.error || 'Failed to create prospect');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create prospect');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditProspect = async () => {
    if (!selectedProspect || !formData.linkedinData.name) {
      setError('Name is required');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/prospects/${selectedProspect._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          linkedinData: formData.linkedinData,
          contactInfo: formData.contactInfo
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update prospect');
      }

      const data = await response.json();
      if (data.success) {
        setProspects(prev => prev.map(p => 
          p._id === selectedProspect._id ? data.prospect : p
        ));
        setShowEditModal(false);
        setSelectedProspect(null);
        resetFormData();
        setError('');
      } else {
        throw new Error(data.error || 'Failed to update prospect');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update prospect');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProspect = async () => {
    if (!selectedProspect) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/prospects/${selectedProspect._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete prospect');
      }

      setProspects(prev => prev.filter(p => p._id !== selectedProspect._id));
      setShowDeleteModal(false);
      setSelectedProspect(null);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete prospect');
    } finally {
      setActionLoading(false);
    }
  };

  const resetFormData = () => {
    setFormData({
      campaignId: '',
      linkedinData: {
        profileUrl: '',
        name: '',
        headline: '',
        title: '',
        company: '',
        location: '',
        industry: '',
        connectionLevel: '3rd',
        summary: ''
      },
      contactInfo: {
        email: '',
        phone: '',
        website: ''
      }
    });
  };

  const openEditModal = (prospect: Prospect) => {
    setSelectedProspect(prospect);
    setFormData({
      campaignId: prospect.campaignId._id,
      linkedinData: {
        profileUrl: prospect.linkedinData.profileUrl,
        name: prospect.linkedinData.name,
        headline: prospect.linkedinData.headline || '',
        title: prospect.linkedinData.title || '',
        company: prospect.linkedinData.company || '',
        location: prospect.linkedinData.location || '',
        industry: prospect.linkedinData.industry || '',
        connectionLevel: prospect.linkedinData.connectionLevel || '3rd',
        summary: prospect.linkedinData.summary || ''
      },
      contactInfo: {
        email: prospect.contactInfo?.email || '',
        phone: prospect.contactInfo?.phone || '',
        website: prospect.contactInfo?.website || ''
      }
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (prospect: Prospect) => {
    setSelectedProspect(prospect);
    setShowDeleteModal(true);
  };

  const openDetailsModal = (prospect: Prospect) => {
    setSelectedProspect(prospect);
    setShowDetailsModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'connection_sent': return 'bg-blue-100 text-blue-800';
      case 'message_sent': return 'bg-purple-100 text-purple-800';
      case 'message_replied': return 'bg-green-100 text-green-800';
      case 'qualified': return 'bg-emerald-100 text-emerald-800';
      case 'not_qualified': return 'bg-red-100 text-red-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const filteredProspects = prospects.filter(prospect => {
    const matchesSearch = prospect.linkedinData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prospect.linkedinData.company && prospect.linkedinData.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (prospect.linkedinData.title && prospect.linkedinData.title.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || prospect.status === filterStatus;
    const matchesCampaign = filterCampaign === 'all' || prospect.campaignId._id === filterCampaign;
    
    return matchesSearch && matchesStatus && matchesCampaign;
  });

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading prospects...</span>
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
            <h1 className="text-2xl font-bold text-gray-900">Prospects</h1>
            <p className="text-gray-600">Manage your LinkedIn prospects and connections</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowExportModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Prospect
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search prospects by name, company, or title..."
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
                <option value="new">New</option>
                <option value="connection_sent">Connection Sent</option>
                <option value="connected">Connected</option>
                <option value="message_sent">Message Sent</option>
                <option value="message_replied">Replied</option>
                <option value="qualified">Qualified</option>
                <option value="not_qualified">Not Qualified</option>
              </select>
              <select
                value={filterCampaign}
                onChange={(e) => setFilterCampaign(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Campaigns</option>
                {campaigns.map(campaign => (
                  <option key={campaign._id} value={campaign._id}>{campaign.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Prospects List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Your Prospects ({filteredProspects.length})
            </h3>
          </div>
          
          {filteredProspects.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {prospects.length === 0 ? 'No prospects yet' : 'No prospects match your search'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {prospects.length === 0 
                  ? 'Start by adding prospects to begin your outreach campaigns.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
              {prospects.length === 0 && (
                <div className="mt-6">
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Prospects
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredProspects.map((prospect) => (
                <div key={prospect._id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Profile Image or Placeholder */}
                      <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                        {prospect.linkedinData.profileImageUrl ? (
                          <img 
                            src={prospect.linkedinData.profileImageUrl} 
                            alt={prospect.linkedinData.name}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <Users className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      
                      {/* Prospect Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="text-lg font-medium text-gray-900">{prospect.linkedinData.name}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(prospect.status)}`}>
                            {formatStatus(prospect.status)}
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600">
                          {prospect.linkedinData.title && (
                            <div className="flex items-center">
                              <Briefcase className="h-4 w-4 mr-1" />
                              {prospect.linkedinData.title}
                            </div>
                          )}
                          {prospect.linkedinData.company && (
                            <div className="flex items-center">
                              <Building className="h-4 w-4 mr-1" />
                              {prospect.linkedinData.company}
                            </div>
                          )}
                          {prospect.linkedinData.location && (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {prospect.linkedinData.location}
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-2 text-xs text-gray-500">
                          Campaign: {prospect.campaignId.name} • Added {new Date(prospect.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => openDetailsModal(prospect)}
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      <a
                        href={prospect.linkedinData.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md"
                        title="View LinkedIn Profile"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      
                      <button
                        onClick={() => openEditModal(prospect)}
                        disabled={actionLoading}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md disabled:opacity-50"
                        title="Edit Prospect"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => openDeleteModal(prospect)}
                        disabled={actionLoading}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md disabled:opacity-50"
                        title="Delete Prospect"
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
      </div>

      {/* Create Prospect Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add New Prospect</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Add prospects manually by entering their LinkedIn profile information, or import them from LinkedIn searches and profile scraping campaigns. Each prospect will be enriched with comprehensive profile data for personalized outreach.
                </p>
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
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Profile Data Collection</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Prospect profiles are enriched with scraped LinkedIn data including experience, education, 
                    skills, and company information to enable AI-powered conversation starters and personalized outreach.
                  </p>
                </div>

                {/* Campaign Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Campaign *
                  </label>
                  <select
                    value={formData.campaignId}
                    onChange={(e) => setFormData(prev => ({ ...prev, campaignId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a campaign</option>
                    {campaigns.map(campaign => (
                      <option key={campaign._id} value={campaign._id}>{campaign.name}</option>
                    ))}
                  </select>
                </div>

                {/* LinkedIn Data */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">LinkedIn Information</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        LinkedIn Profile URL *
                      </label>
                      <input
                        type="url"
                        value={formData.linkedinData.profileUrl}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          linkedinData: { ...prev.linkedinData, profileUrl: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={formData.linkedinData.name}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          linkedinData: { ...prev.linkedinData, name: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="John Doe"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Job Title
                      </label>
                      <input
                        type="text"
                        value={formData.linkedinData.title}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          linkedinData: { ...prev.linkedinData, title: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Software Engineer"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company
                      </label>
                      <input
                        type="text"
                        value={formData.linkedinData.company}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          linkedinData: { ...prev.linkedinData, company: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Tech Company Inc"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={formData.linkedinData.location}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          linkedinData: { ...prev.linkedinData, location: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="San Francisco, CA"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">Contact Information (Optional)</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.contactInfo.email}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          contactInfo: { ...prev.contactInfo, email: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="john@example.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.contactInfo.phone}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          contactInfo: { ...prev.contactInfo, phone: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
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
                  onClick={handleCreateProspect}
                  disabled={actionLoading || !formData.campaignId || !formData.linkedinData.profileUrl || !formData.linkedinData.name}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Adding...
                    </div>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2 inline" />
                      Add Prospect
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Prospect Modal */}
      {showEditModal && selectedProspect && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit Prospect</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedProspect(null);
                    resetFormData();
                    setError('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-6 max-h-96 overflow-y-auto">
                {/* LinkedIn Data */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">LinkedIn Information</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        LinkedIn Profile URL
                      </label>
                      <input
                        type="url"
                        value={formData.linkedinData.profileUrl}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          linkedinData: { ...prev.linkedinData, profileUrl: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={formData.linkedinData.name}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          linkedinData: { ...prev.linkedinData, name: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Job Title
                      </label>
                      <input
                        type="text"
                        value={formData.linkedinData.title}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          linkedinData: { ...prev.linkedinData, title: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company
                      </label>
                      <input
                        type="text"
                        value={formData.linkedinData.company}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          linkedinData: { ...prev.linkedinData, company: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={formData.linkedinData.location}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          linkedinData: { ...prev.linkedinData, location: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">Contact Information</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.contactInfo.email}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          contactInfo: { ...prev.contactInfo, email: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.contactInfo.phone}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          contactInfo: { ...prev.contactInfo, phone: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedProspect(null);
                    resetFormData();
                    setError('');
                  }}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditProspect}
                  disabled={actionLoading || !formData.linkedinData.name}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Saving...
                    </div>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2 inline" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedProspect && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Prospect</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete <strong>{selectedProspect.linkedinData.name}</strong>? 
                  This action cannot be undone and will remove all associated data.
                </p>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedProspect(null);
                  }}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProspect}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedProspect && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Prospect Details</h3>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedProspect(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-6 max-h-96 overflow-y-auto">
                {/* Basic Info */}
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center">
                    {selectedProspect.linkedinData.profileImageUrl ? (
                      <img 
                        src={selectedProspect.linkedinData.profileImageUrl} 
                        alt={selectedProspect.linkedinData.name}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <Users className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">{selectedProspect.linkedinData.name}</h4>
                    {selectedProspect.linkedinData.headline && (
                      <p className="text-gray-600">{selectedProspect.linkedinData.headline}</p>
                    )}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getStatusColor(selectedProspect.status)}`}>
                      {formatStatus(selectedProspect.status)}
                    </span>
                  </div>
                </div>

                {/* Professional Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Professional Information</h5>
                    <div className="space-y-2 text-sm">
                      {selectedProspect.linkedinData.title && (
                        <div className="flex items-center">
                          <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{selectedProspect.linkedinData.title}</span>
                        </div>
                      )}
                      {selectedProspect.linkedinData.company && (
                        <div className="flex items-center">
                          <Building className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{selectedProspect.linkedinData.company}</span>
                        </div>
                      )}
                      {selectedProspect.linkedinData.location && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{selectedProspect.linkedinData.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Contact Information</h5>
                    <div className="space-y-2 text-sm">
                      {selectedProspect.contactInfo?.email && (
                        <div>
                          <span className="text-gray-500">Email:</span> {selectedProspect.contactInfo.email}
                        </div>
                      )}
                      {selectedProspect.contactInfo?.phone && (
                        <div>
                          <span className="text-gray-500">Phone:</span> {selectedProspect.contactInfo.phone}
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">LinkedIn:</span>{' '}
                        <a 
                          href={selectedProspect.linkedinData.profileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View Profile <ExternalLink className="h-3 w-3 inline ml-1" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Campaign Info */}
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-2">Campaign Information</h5>
                  <div className="text-sm text-gray-600">
                    <p>Campaign: {selectedProspect.campaignId.name}</p>
                    <p>Added: {new Date(selectedProspect.createdAt).toLocaleDateString()}</p>
                    <p>Last Updated: {new Date(selectedProspect.lastUpdated).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Summary */}
                {selectedProspect.linkedinData.summary && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Summary</h5>
                    <p className="text-sm text-gray-600">{selectedProspect.linkedinData.summary}</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedProspect(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        campaigns={campaigns}
        selectedCampaignId={filterCampaign !== 'all' ? filterCampaign : undefined}
      />
    </Layout>
  );
};

export default ProspectsPage;