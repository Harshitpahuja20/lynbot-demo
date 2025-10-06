import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { 
  UserCheck, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  Eye,
  Settings,
  Play
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  order: number;
  title: string;
  description: string;
  type: 'welcome' | 'setup' | 'tutorial' | 'verification' | 'completion';
  content: {
    instructions?: string;
    videoUrl?: string;
    imageUrl?: string;
    formFields?: Array<{
      name: string;
      type: string;
      label: string;
      required: boolean;
      placeholder?: string;
    }>;
    checklistItems?: string[];
  };
  isRequired: boolean;
  isActive: boolean;
  completionRate: number;
  averageTimeSpent: number;
  createdAt: string;
  updatedAt: string;
}

const AdminOnboardingPage: React.FC = () => {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStep, setSelectedStep] = useState<OnboardingStep | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'setup' as const,
    instructions: '',
    isRequired: true,
    isActive: true
  });

  useEffect(() => {
    fetchOnboardingSteps();
  }, []);

  const fetchOnboardingSteps = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        window.location.href = '/signin';
        return;
      }

      const response = await fetch('/api/admin/onboarding', {
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
        throw new Error('Failed to fetch onboarding steps');
      }

      const data = await response.json();
      if (data.success) {
        setSteps(data.steps || []);
      } else {
        throw new Error(data.error || 'Failed to fetch onboarding steps');
      }
    } catch (err) {
      console.error('Error fetching onboarding steps:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch onboarding steps');
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'welcome': return 'bg-blue-100 text-blue-800';
      case 'setup': return 'bg-green-100 text-green-800';
      case 'tutorial': return 'bg-purple-100 text-purple-800';
      case 'verification': return 'bg-orange-100 text-orange-800';
      case 'completion': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading onboarding steps...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout error={error} onClearError={() => setError('')}>
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
            <h1 className="text-2xl font-bold text-gray-900">Onboarding Management</h1>
            <p className="text-gray-600">Configure and manage the user onboarding process</p>
          </div>
          <div className="flex gap-3">
            <button 
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <Play className="h-4 w-4 mr-2" />
              Preview Flow
            </button>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Step
            </button>
          </div>
        </div>

        {/* Onboarding Flow Overview */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Onboarding Flow</h3>
          
          {steps.length === 0 ? (
            <div className="text-center py-12">
              <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No onboarding steps configured</h3>
              <p className="text-gray-600 mb-4">Create steps to guide new users through the setup process</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Create First Step
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {steps
                .sort((a, b) => a.order - b.order)
                .map((step, index) => (
                <div key={step.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                        {step.order}
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{step.title}</h4>
                        <p className="text-gray-600 text-sm">{step.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(step.type)}`}>
                            {step.type}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            step.isRequired ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {step.isRequired ? 'Required' : 'Optional'}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            step.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {step.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right text-sm text-gray-500 mr-4">
                        <div>{step.completionRate}% completion</div>
                        <div>{step.averageTimeSpent}s avg time</div>
                      </div>
                      
                      <button
                        disabled={index === 0}
                        className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded disabled:opacity-50"
                        title="Move Up"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      
                      <button
                        disabled={index === steps.length - 1}
                        className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded disabled:opacity-50"
                        title="Move Down"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      
                      <button
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        title="Edit Step"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      <button
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        title="Delete Step"
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

        {/* Onboarding Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">Completion Rate</h4>
            <div className="text-3xl font-bold text-green-600 mb-2">87%</div>
            <p className="text-sm text-gray-600">Users complete onboarding</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">Average Time</h4>
            <div className="text-3xl font-bold text-blue-600 mb-2">4.2m</div>
            <p className="text-sm text-gray-600">To complete onboarding</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">Drop-off Rate</h4>
            <div className="text-3xl font-bold text-red-600 mb-2">13%</div>
            <p className="text-sm text-gray-600">Users abandon onboarding</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOnboardingPage;