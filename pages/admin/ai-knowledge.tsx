import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
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
  Sparkles,
  Settings,
  File,
  Download,
  Trash,
  Eye
} from 'lucide-react';

interface AIKnowledge {
  id: string;
  title: string;
  description: string;
  category: 'prompts' | 'templates' | 'guidelines' | 'examples';
  content: string;
  tags: string[];
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface UploadedDocument {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  processedAt?: string;
  status: 'uploading' | 'processing' | 'processed' | 'failed';
  extractedText?: string;
  summary?: string;
  tags: string[];
  isActive: boolean;
}

const AdminAIKnowledgePage: React.FC = () => {
  const [knowledgeItems, setKnowledgeItems] = useState<AIKnowledge[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AIKnowledge | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<UploadedDocument | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'knowledge' | 'documents'>('knowledge');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'prompts' as const,
    content: '',
    tags: '',
    isActive: true
  });

  const [uploadData, setUploadData] = useState({
    file: null as File | null,
    tags: '',
    autoProcess: true
  });

  useEffect(() => {
    fetchKnowledgeItems();
    fetchUploadedDocuments();
  }, []);

  const fetchKnowledgeItems = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        window.location.href = '/signin';
        return;
      }

      const response = await fetch('/api/admin/ai-knowledge', {
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
        throw new Error('Failed to fetch AI knowledge');
      }

      const data = await response.json();
      if (data.success) {
        setKnowledgeItems(data.items || []);
      } else {
        throw new Error(data.error || 'Failed to fetch AI knowledge');
      }
    } catch (err) {
      console.error('Error fetching AI knowledge:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch AI knowledge');
    } finally {
      setLoading(false);
    }
  };

  const fetchUploadedDocuments = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/admin/ai-documents', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUploadedDocs(data.documents || []);
        }
      }
    } catch (err) {
      console.error('Error fetching uploaded documents:', err);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadData.file) {
      setError('Please select a PDF file to upload');
      return;
    }

    if (uploadData.file.type !== 'application/pdf') {
      setError('Only PDF files are supported');
      return;
    }

    if (uploadData.file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB');
      return;
    }

    setActionLoading(true);
    setUploadProgress(0);

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        window.location.href = '/signin';
        return;
      }

      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('tags', uploadData.tags);
      formData.append('autoProcess', uploadData.autoProcess.toString());

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/admin/ai-documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload document');
      }

      const data = await response.json();
      if (data.success) {
        setUploadedDocs(prev => [data.document, ...prev]);
        setShowUploadModal(false);
        resetUploadData();
        setSuccess('Document uploaded successfully! Processing will begin shortly.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setActionLoading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document? This will remove it from the AI knowledge base.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/admin/ai-documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setUploadedDocs(prev => prev.filter(doc => doc.id !== documentId));
        setSuccess('Document deleted successfully');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete document');
      }
    } catch (err) {
      setError('Failed to delete document');
    }
  };

  const handleCreateItem = async () => {
    if (!formData.title || !formData.content) {
      setError('Title and content are required');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('/api/admin/ai-knowledge', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create AI knowledge item');
      }

      const data = await response.json();
      if (data.success) {
        setKnowledgeItems(prev => [data.item, ...prev]);
        setShowCreateModal(false);
        resetFormData();
        setSuccess('AI knowledge item created successfully!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create AI knowledge item');
    } finally {
      setActionLoading(false);
    }
  };

  const resetFormData = () => {
    setFormData({
      title: '',
      description: '',
      category: 'prompts',
      content: '',
      tags: '',
      isActive: true
    });
  };

  const resetUploadData = () => {
    setUploadData({
      file: null,
      tags: '',
      autoProcess: true
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'uploading': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'prompts': return 'bg-blue-100 text-blue-800';
      case 'templates': return 'bg-green-100 text-green-800';
      case 'guidelines': return 'bg-purple-100 text-purple-800';
      case 'examples': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredItems = knowledgeItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  const filteredDocs = uploadedDocs.filter(doc => {
    const matchesSearch = doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading AI knowledge...</span>
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
            <h1 className="text-2xl font-bold text-gray-900">AI Knowledge Base</h1>
            <p className="text-gray-600">Manage global AI prompts, templates, and knowledge for all users</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowUploadModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload PDF
            </button>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Knowledge
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('knowledge')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'knowledge'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Brain className="h-4 w-4" />
                Knowledge Items ({knowledgeItems.length})
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'documents'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="h-4 w-4" />
                Uploaded Documents ({uploadedDocs.length})
              </button>
            </nav>
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
                  placeholder={activeTab === 'knowledge' ? "Search knowledge items..." : "Search documents..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            {activeTab === 'knowledge' && (
              <div className="flex gap-2">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="prompts">Prompts</option>
                  <option value="templates">Templates</option>
                  <option value="guidelines">Guidelines</option>
                  <option value="examples">Examples</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Knowledge Items Tab */}
        {activeTab === 'knowledge' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                    {item.category}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="bg-gray-50 rounded-md p-3 max-h-32 overflow-y-auto">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                      {item.content.substring(0, 200)}
                      {item.content.length > 200 && '...'}
                    </pre>
                  </div>
                </div>

                {item.tags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                  <span>Used {item.usageCount} times</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {item.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedItem(item);
                      setFormData({
                        title: item.title,
                        description: item.description,
                        category: item.category,
                        content: item.content,
                        tags: item.tags.join(', '),
                        isActive: item.isActive
                      });
                      setShowEditModal(true);
                    }}
                    className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-200 text-sm flex items-center justify-center"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                  <button
                    className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded-md hover:bg-red-200 text-sm flex items-center justify-center"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {filteredItems.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No AI knowledge items yet</h3>
                <p className="text-gray-600 mb-4">Create prompts, templates, and guidelines for AI-powered features</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Create First Item
                </button>
              </div>
            )}
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Uploaded Documents ({filteredDocs.length})
              </h3>
            </div>
            
            {filteredDocs.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {uploadedDocs.length === 0 ? 'No documents uploaded yet' : 'No documents match your search'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {uploadedDocs.length === 0 
                    ? 'Upload PDF documents to enhance the AI knowledge base.'
                    : 'Try adjusting your search criteria.'
                  }
                </p>
                {uploadedDocs.length === 0 && (
                  <div className="mt-6">
                    <button 
                      onClick={() => setShowUploadModal(true)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center mx-auto"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload First Document
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredDocs.map((doc) => (
                  <div key={doc.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-6 w-6 text-red-600" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="text-lg font-medium text-gray-900">{doc.originalName}</h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                              {doc.status}
                            </span>
                          </div>
                          
                          <div className="space-y-1 text-sm text-gray-600">
                            <div>Size: {formatFileSize(doc.size)}</div>
                            <div>Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</div>
                            {doc.processedAt && (
                              <div>Processed: {new Date(doc.processedAt).toLocaleDateString()}</div>
                            )}
                          </div>
                          
                          {doc.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
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
                        <button
                          onClick={() => {
                            setSelectedDocument(doc);
                            setShowDocumentModal(true);
                          }}
                          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                          title="Delete Document"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Upload PDF Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Upload PDF Document</h3>
                  <button
                    onClick={() => {
                      setShowUploadModal(false);
                      resetUploadData();
                      setError('');
                      setUploadProgress(0);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">PDF Processing</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Upload PDF documents to automatically extract text content and enhance the AI knowledge base. 
                      The system will process the document and make it available for AI-powered responses.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select PDF File
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
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
                                  setUploadData(prev => ({ ...prev, file }));
                                }
                              }}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PDF up to 10MB</p>
                      </div>
                    </div>
                    
                    {uploadData.file && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <File className="h-5 w-5 text-red-600 mr-2" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{uploadData.file.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(uploadData.file.size)}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setUploadData(prev => ({ ...prev, file: null }))}
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
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={uploadData.tags}
                      onChange={(e) => setUploadData(prev => ({ ...prev, tags: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., linkedin, automation, best-practices"
                    />
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={uploadData.autoProcess}
                        onChange={(e) => setUploadData(prev => ({ ...prev, autoProcess: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Automatically process and extract text content
                      </span>
                    </label>
                  </div>

                  {uploadProgress > 0 && (
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Upload Progress</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowUploadModal(false);
                      resetUploadData();
                      setError('');
                      setUploadProgress(0);
                    }}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFileUpload}
                    disabled={actionLoading || !uploadData.file}
                    className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Uploading...
                      </div>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2 inline" />
                        Upload Document
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Document Details Modal */}
        {showDocumentModal && selectedDocument && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Document Details</h3>
                  <button
                    onClick={() => {
                      setShowDocumentModal(false);
                      setSelectedDocument(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Document Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Document Information</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="text-gray-500">Filename:</span> {selectedDocument.originalName}</div>
                        <div><span className="text-gray-500">Size:</span> {formatFileSize(selectedDocument.size)}</div>
                        <div><span className="text-gray-500">Uploaded:</span> {new Date(selectedDocument.uploadedAt).toLocaleString()}</div>
                        <div>
                          <span className="text-gray-500">Status:</span>{' '}
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedDocument.status)}`}>
                            {selectedDocument.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Processing Status</h4>
                      <div className="space-y-2 text-sm">
                        {selectedDocument.processedAt && (
                          <div><span className="text-gray-500">Processed:</span> {new Date(selectedDocument.processedAt).toLocaleString()}</div>
                        )}
                        {selectedDocument.extractedText && (
                          <div><span className="text-gray-500">Text Extracted:</span> {selectedDocument.extractedText.length} characters</div>
                        )}
                        {selectedDocument.summary && (
                          <div><span className="text-gray-500">Summary Available:</span> Yes</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {selectedDocument.tags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedDocument.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  {selectedDocument.summary && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">AI-Generated Summary</h4>
                      <div className="bg-gray-50 rounded-md p-4">
                        <p className="text-sm text-gray-700">{selectedDocument.summary}</p>
                      </div>
                    </div>
                  )}

                  {/* Extracted Text Preview */}
                  {selectedDocument.extractedText && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Extracted Text (Preview)</h4>
                      <div className="bg-gray-50 rounded-md p-4 max-h-64 overflow-y-auto">
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                          {selectedDocument.extractedText.substring(0, 1000)}
                          {selectedDocument.extractedText.length > 1000 && '\n\n... (truncated)'}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => {
                      setShowDocumentModal(false);
                      setSelectedDocument(null);
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

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Create AI Knowledge Item</h3>
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
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., LinkedIn Connection Request Prompt"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="prompts">Prompts</option>
                        <option value="templates">Templates</option>
                        <option value="guidelines">Guidelines</option>
                        <option value="examples">Examples</option>
                      </select>
                    </div>
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
                      placeholder="Brief description of this knowledge item"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Content
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      placeholder="Enter the AI prompt, template, or knowledge content..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., linkedin, connection, professional"
                    />
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active (available for use)</span>
                    </label>
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
                    onClick={handleCreateItem}
                    disabled={actionLoading || !formData.title || !formData.content}
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
                        Create Item
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

export default AdminAIKnowledgePage;