import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  Brain, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Save,
  Upload,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  Globe,
  HelpCircle,
  Target,
  Lightbulb,
  Link as LinkIcon,
  Download,
  Eye,
  Zap
} from 'lucide-react';

interface UserKnowledge {
  id: string;
  title: string;
  content: string;
  category: 'website' | 'faq' | 'value_prop' | 'pain_agitate_solution' | 'offer' | 'general';
  type: 'text' | 'website' | 'faq' | 'value_prop' | 'pain_points' | 'solution' | 'offer';
  source_url?: string;
  metadata: any;
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface KnowledgeDocument {
  id: string;
  filename: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  extracted_text?: string;
  summary?: string;
  status: 'uploaded' | 'processing' | 'processed' | 'failed';
  tags: string[];
  created_at: string;
}

const KnowledgePage: React.FC = () => {
  const [knowledgeItems, setKnowledgeItems] = useState<UserKnowledge[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'website' | 'faq' | 'value_prop' | 'documents'>('website');
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states for different knowledge types
  const [websiteForm, setWebsiteForm] = useState({
    url: '',
    sitemap: '',
    title: '',
    description: ''
  });

  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    category: 'general'
  });

  const [valuePropsForm, setValuePropsForm] = useState({
    title: '',
    headline: '',
    subheadline: '',
    benefits: '',
    features: '',
    target_audience: '',
    unique_selling_points: ''
  });

  const [pasForm, setPasForm] = useState({
    title: '',
    pain_points: '',
    agitation: '',
    solution: '',
    offer_details: '',
    call_to_action: ''
  });

  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    title: '',
    description: '',
    tags: ''
  });

  useEffect(() => {
    fetchKnowledgeData();
  }, []);

  const fetchKnowledgeData = async () => {
    try {
      setLoading(true);
      setError('');

      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (!token) {
        window.location.href = '/signin';
        return;
      }

      // Fetch user knowledge and documents
      const [knowledgeRes, documentsRes] = await Promise.all([
        fetch('/api/user/knowledge', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/user/knowledge/documents', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (knowledgeRes.ok) {
        const knowledgeData = await knowledgeRes.json();
        if (knowledgeData.success) {
          setKnowledgeItems(knowledgeData.items || []);
        }
      }

      if (documentsRes.ok) {
        const documentsData = await documentsRes.json();
        if (documentsData.success) {
          setDocuments(documentsData.documents || []);
        }
      }

    } catch (err) {
      console.error('Error fetching knowledge data:', err);
      setError('Failed to load knowledge data');
    } finally {
      setLoading(false);
    }
  };

  const handleWebsiteSubmit = async () => {
    if (!websiteForm.url) {
      setError('Website URL is required');
      return;
    }

    setActionLoading(true);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const response = await fetch('/api/user/knowledge/website', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(websiteForm)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add website knowledge');
      }

      const data = await response.json();
      if (data.success) {
        setKnowledgeItems(prev => [data.item, ...prev]);
        setShowModal(false);
        setWebsiteForm({ url: '', sitemap: '', title: '', description: '' });
        setSuccess('Website knowledge added successfully!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add website knowledge');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFaqSubmit = async () => {
    if (!faqForm.question || !faqForm.answer) {
      setError('Question and answer are required');
      return;
    }

    setActionLoading(true);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const response = await fetch('/api/user/knowledge/faq', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(faqForm)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add FAQ');
      }

      const data = await response.json();
      if (data.success) {
        setKnowledgeItems(prev => [data.item, ...prev]);
        setShowModal(false);
        setFaqForm({ question: '', answer: '', category: 'general' });
        setSuccess('FAQ added successfully!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add FAQ');
    } finally {
      setActionLoading(false);
    }
  };

  const handleValuePropSubmit = async () => {
    if (!valuePropsForm.title || !valuePropsForm.headline) {
      setError('Title and headline are required');
      return;
    }

    setActionLoading(true);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const response = await fetch('/api/user/knowledge/value-prop', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(valuePropsForm)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add value proposition');
      }

      const data = await response.json();
      if (data.success) {
        setKnowledgeItems(prev => [data.item, ...prev]);
        setShowModal(false);
        setValuePropsForm({
          title: '', headline: '', subheadline: '', benefits: '', 
          features: '', target_audience: '', unique_selling_points: ''
        });
        setSuccess('Value proposition added successfully!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add value proposition');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePasSubmit = async () => {
    if (!pasForm.title || !pasForm.pain_points || !pasForm.solution) {
      setError('Title, pain points, and solution are required');
      return;
    }

    setActionLoading(true);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const response = await fetch('/api/user/knowledge/pas', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pasForm)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add PAS framework');
      }

      const data = await response.json();
      if (data.success) {
        setKnowledgeItems(prev => [data.item, ...prev]);
        setShowModal(false);
        setPasForm({
          title: '', pain_points: '', agitation: '', 
          solution: '', offer_details: '', call_to_action: ''
        });
        setSuccess('PAS framework added successfully!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add PAS framework');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDocumentUpload = async () => {
    if (!uploadForm.file) {
      setError('Please select a PDF file');
      return;
    }

    setActionLoading(true);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      formData.append('tags', uploadForm.tags);

      const response = await fetch('/api/user/knowledge/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload document');
      }

      const data = await response.json();
      if (data.success) {
        setDocuments(prev => [data.document, ...prev]);
        setShowModal(false);
        setUploadForm({ file: null, title: '', description: '', tags: '' });
        setSuccess('Document uploaded successfully!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setActionLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'website': return <Globe className="h-5 w-5" />;
      case 'faq': return <HelpCircle className="h-5 w-5" />;
      case 'value_prop': return <Target className="h-5 w-5" />;
      case 'pain_agitate_solution': return <Zap className="h-5 w-5" />;
      case 'offer': return <Lightbulb className="h-5 w-5" />;
      default: return <Brain className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'website': return 'bg-blue-100 text-blue-800';
      case 'faq': return 'bg-green-100 text-green-800';
      case 'value_prop': return 'bg-purple-100 text-purple-800';
      case 'pain_agitate_solution': return 'bg-red-100 text-red-800';
      case 'offer': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'website':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website URL *
              </label>
              <input
                type="url"
                value={websiteForm.url}
                onChange={(e) => setWebsiteForm(prev => ({ ...prev, url: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sitemap URL (Optional)
              </label>
              <input
                type="url"
                value={websiteForm.sitemap}
                onChange={(e) => setWebsiteForm(prev => ({ ...prev, sitemap: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/sitemap.xml"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={websiteForm.title}
                onChange={(e) => setWebsiteForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Website knowledge title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={websiteForm.description}
                onChange={(e) => setWebsiteForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description of what this website contains"
              />
            </div>
          </div>
        );

      case 'faq':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question *
              </label>
              <input
                type="text"
                value={faqForm.question}
                onChange={(e) => setFaqForm(prev => ({ ...prev, question: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="What is your question?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Answer *
              </label>
              <textarea
                value={faqForm.answer}
                onChange={(e) => setFaqForm(prev => ({ ...prev, answer: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Provide a detailed answer..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={faqForm.category}
                onChange={(e) => setFaqForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="general">General</option>
                <option value="product">Product</option>
                <option value="pricing">Pricing</option>
                <option value="support">Support</option>
                <option value="technical">Technical</option>
              </select>
            </div>
          </div>
        );

      case 'value_prop':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={valuePropsForm.title}
                  onChange={(e) => setValuePropsForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Value Proposition Title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={valuePropsForm.target_audience}
                  onChange={(e) => setValuePropsForm(prev => ({ ...prev, target_audience: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Who is this for?"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Headline *
              </label>
              <input
                type="text"
                value={valuePropsForm.headline}
                onChange={(e) => setValuePropsForm(prev => ({ ...prev, headline: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Main value proposition headline"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subheadline
              </label>
              <input
                type="text"
                value={valuePropsForm.subheadline}
                onChange={(e) => setValuePropsForm(prev => ({ ...prev, subheadline: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Supporting subheadline"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Key Benefits
              </label>
              <textarea
                value={valuePropsForm.benefits}
                onChange={(e) => setValuePropsForm(prev => ({ ...prev, benefits: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="List the main benefits (one per line)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unique Selling Points
              </label>
              <textarea
                value={valuePropsForm.unique_selling_points}
                onChange={(e) => setValuePropsForm(prev => ({ ...prev, unique_selling_points: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="What makes you different from competitors?"
              />
            </div>
          </div>
        );

      case 'documents':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload PDF Document
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500"
                    >
                      <span>Upload a PDF file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        accept=".pdf"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setUploadForm(prev => ({ ...prev, file }));
                          }
                        }}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF up to 10MB</p>
                </div>
              </div>
              
              {uploadForm.file && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-red-600 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{uploadForm.file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(uploadForm.file.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setUploadForm(prev => ({ ...prev, file: null }))}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={uploadForm.title}
                onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Document title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={uploadForm.description}
                onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description of the document content"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={uploadForm.tags}
                onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., sales, marketing, product"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getSubmitHandler = () => {
    switch (activeTab) {
      case 'website': return handleWebsiteSubmit;
      case 'faq': return handleFaqSubmit;
      case 'value_prop': return handleValuePropSubmit;
      case 'documents': return handleDocumentUpload;
      default: return handlePasSubmit;
    }
  };

  const getModalTitle = () => {
    switch (activeTab) {
      case 'website': return 'Add Website Knowledge';
      case 'faq': return 'Add FAQ';
      case 'value_prop': return 'Add Value Proposition';
      case 'documents': return 'Upload PDF Document';
      default: return 'Add Knowledge';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading knowledge base...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout error={error} onClearError={() => setError('')}>
      <div className="space-y-6">
        {/* Success Message */}
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
            <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
            <p className="text-gray-600">Manage your AI knowledge base to improve personalized messaging</p>
          </div>
        </div>

        {/* Knowledge Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <button
            onClick={() => {
              setActiveTab('website');
              setShowModal(true);
            }}
            className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left"
          >
            <div className="flex items-center mb-3">
              <Globe className="h-8 w-8 text-blue-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">Website Knowledge</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Learn from your website content and sitemap to understand your business better
            </p>
            <div className="mt-4 flex items-center text-blue-600">
              <Plus className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">Add Website</span>
            </div>
          </button>

          <button
            onClick={() => {
              setActiveTab('faq');
              setShowModal(true);
            }}
            className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-green-300 hover:shadow-md transition-all text-left"
          >
            <div className="flex items-center mb-3">
              <HelpCircle className="h-8 w-8 text-green-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">FAQ Knowledge</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Add frequently asked questions and answers to help AI respond accurately
            </p>
            <div className="mt-4 flex items-center text-green-600">
              <Plus className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">Add FAQ</span>
            </div>
          </button>

          <button
            onClick={() => {
              setActiveTab('value_prop');
              setShowModal(true);
            }}
            className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all text-left"
          >
            <div className="flex items-center mb-3">
              <Target className="h-8 w-8 text-purple-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">Value Propositions</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Define your value propositions, benefits, and unique selling points
            </p>
            <div className="mt-4 flex items-center text-purple-600">
              <Plus className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">Add Value Prop</span>
            </div>
          </button>

          <button
            onClick={() => {
              setActiveTab('documents');
              setShowModal(true);
            }}
            className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all text-left"
          >
            <div className="flex items-center mb-3">
              <FileText className="h-8 w-8 text-orange-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">PDF Documents</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Upload PDF documents to extract knowledge and insights
            </p>
            <div className="mt-4 flex items-center text-orange-600">
              <Upload className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">Upload PDF</span>
            </div>
          </button>
        </div>

        {/* PAS Framework Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Pain, Agitate, Solution Framework</h3>
              <p className="text-gray-600 text-sm">Define your PAS framework for compelling messaging</p>
            </div>
            <button
              onClick={() => {
                setActiveTab('value_prop');
                setShowModal(true);
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
            >
              <Zap className="h-4 w-4 mr-2" />
              Add PAS Framework
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-red-50 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">Pain Points</h4>
              <p className="text-sm text-red-700">Identify customer problems and challenges</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-medium text-orange-800 mb-2">Agitation</h4>
              <p className="text-sm text-orange-700">Amplify the consequences of inaction</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Solution</h4>
              <p className="text-sm text-green-700">Present your solution and call-to-action</p>
            </div>
          </div>
        </div>

        {/* Knowledge Items List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Your Knowledge Base</h3>
          </div>
          
          {knowledgeItems.length === 0 && documents.length === 0 ? (
            <div className="p-12 text-center">
              <Brain className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No knowledge items yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start building your AI knowledge base to improve message personalization
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {/* Knowledge Items */}
              {knowledgeItems.map((item) => (
                <div key={item.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        {getCategoryIcon(item.category)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-medium text-gray-900">{item.title}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                            {item.category.replace('_', ' ')}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-3">
                          {item.content.substring(0, 150)}
                          {item.content.length > 150 && '...'}
                        </p>
                        
                        {item.source_url && (
                          <div className="flex items-center text-sm text-blue-600 mb-2">
                            <LinkIcon className="h-4 w-4 mr-1" />
                            <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              {item.source_url}
                            </a>
                          </div>
                        )}
                        
                        {item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.tags.map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Documents */}
              {documents.map((doc) => (
                <div key={doc.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        <FileText className="h-5 w-5 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-medium text-gray-900">{doc.original_name}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            doc.status === 'processed' ? 'bg-green-100 text-green-800' :
                            doc.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                            doc.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {doc.status}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-2">
                          <span>Size: {formatFileSize(doc.file_size)}</span>
                          <span className="mx-2">•</span>
                          <span>Uploaded: {new Date(doc.created_at).toLocaleDateString()}</span>
                        </div>
                        
                        {doc.summary && (
                          <p className="text-gray-600 mb-3">{doc.summary}</p>
                        )}
                        
                        {doc.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {doc.tags.map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Knowledge Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">{getModalTitle()}</h3>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setError('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                {renderTabContent()}
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setError('');
                    }}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={getSubmitHandler()}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Processing...
                      </div>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2 inline" />
                        {activeTab === 'documents' ? 'Upload' : 'Add'} {activeTab === 'website' ? 'Website' : 
                         activeTab === 'faq' ? 'FAQ' : 
                         activeTab === 'value_prop' ? 'Value Prop' : 'Document'}
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

export default KnowledgePage;