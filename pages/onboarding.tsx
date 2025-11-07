import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getCurrentUser, setToken } from '../utils/auth';
import { 
  CheckCircle, 
  ArrowRight, 
  Users, 
  MessageSquare, 
  BarChart3,
  Key,
  Shield,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}



const OnboardingPage: React.FC = () => {
  const router = useRouter();
  const user = getCurrentUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [linkedinStatus, setLinkedinStatus] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [linkedinVerified, setLinkedinVerified] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [linkedinEmail, setLinkedinEmail] = useState('');
  const [linkedinPassword, setLinkedinPassword] = useState('');
  const [showLinkedinPassword, setShowLinkedinPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [pendingAccountId, setPendingAccountId] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    if (!user) {
      router.push('/signin');
      return;
    }

    if (user.onboardingComplete) {
      router.push('/dashboard');
      return;
    }
  }, [user, router, mounted]);

  // WebSocket listeners removed - now using Unipile OAuth

  const steps: OnboardingStep[] = [
    {
      id: 1,
      title: 'Welcome to Lync Bot',
      description: 'Your LinkedIn automation platform for lead generation and outreach campaigns.',
      icon: <Users className="w-8 h-8 text-blue-600" />
    },
    {
      id: 2,
      title: 'LinkedIn Account Setup',
      description: 'Connect your LinkedIn account to enable automated outreach and connection requests.',
      icon: <Key className="w-8 h-8 text-blue-600" />
    },
    {
      id: 3,
      title: 'OpenAI API Configuration',
      description: 'Add your OpenAI API key to enable AI-powered message generation and personalization.',
      icon: <Shield className="w-8 h-8 text-purple-600" />
    },
    {
      id: 4,
      title: 'Automate Your Outreach',
      description: 'Send personalized connection requests and messages to your target prospects.',
      icon: <MessageSquare className="w-8 h-8 text-green-600" />
    },
    {
      id: 5,
      title: 'Track Your Success',
      description: 'Monitor your campaign performance with detailed analytics and reporting.',
      icon: <BarChart3 className="w-8 h-8 text-purple-600" />
    }
  ];

  // Removed WebSocket verification functions - now using Unipile OAuth

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1: // LinkedIn Account Setup
        if (!linkedinVerified) {
          setError('Please connect your LinkedIn account');
          return false;
        }
        break;
      case 2: // OpenAI API Key
        if (!openaiApiKey.trim()) {
          setError('Please provide your OpenAI API key');
          return false;
        }
        if (!openaiApiKey.startsWith('sk-')) {
          setError('OpenAI API key should start with "sk-"');
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    
    // Validate current step before proceeding
    if (!validateCurrentStep()) {
      return;
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  // LinkedIn account is saved automatically via Unipile callback

  const saveOpenAIKey = async () => {
    const response = await fetch('/api/user/openai-key', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: openaiApiKey
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to save OpenAI API key');
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    setError('');

    try {
      // Save OpenAI key before completing onboarding
      if (openaiApiKey) {
        await saveOpenAIKey();
      }

      const response = await fetch('/api/user/complete-onboarding', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok && response.status !== 304) {
        const data = await response.json();
        
        // Update the token in NEXT_NEST_API_URLStorage with the new one that includes onboardingComplete: true
        if (data.token) {
          setToken(data.token);
        }
        
        // Redirect to dashboard
        if (user?.role === 'admin') {
          router.push('/admin/users');
        } else {
          router.push('/dashboard');
        }
      } else if (response.status === 304) {
        // Already completed, redirect anyway
        console.log('Onboarding already completed');
        if (user?.role === 'admin') {
          router.push('/admin/users');
        } else {
          router.push('/dashboard');
        }
      } else {
        let errorMessage = 'Failed to complete onboarding';
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch (jsonError) {
          console.error('Error parsing error response:', jsonError);
        }
        throw new Error(errorMessage);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  // Full page loading states
  if (!mounted || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Lync Bot</h2>
          <p className="text-gray-600">Preparing your onboarding experience...</p>
        </div>
      </div>
    );
  }

  // Removed WebSocket loading states

  // Loading state during onboarding completion
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <Loader2 className="w-16 h-16 animate-spin text-green-600 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Completing Setup</h2>
            <p className="text-gray-600 mb-4">Finalizing your Lync Bot configuration...</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm">
                <strong>Almost done!</strong> We're saving your settings and preparing your dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          ></div>
        </div>

        {/* Step Counter */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center gap-2 mb-6">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="mb-6">
            {steps[currentStep].icon}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {steps[currentStep].title}
          </h1>

          <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto">
            {steps[currentStep].description}
          </p>

          {/* Welcome Message for First Step */}
          {currentStep === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800">
                Hello <strong>{user.firstName || user.email}</strong>! 
                Let's get you started with your LinkedIn automation journey.
              </p>
            </div>
          )}

          {/* LinkedIn Account Setup */}
          {currentStep === 1 && (
            <div className="space-y-4 mb-6 text-left max-w-md mx-auto">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-yellow-800 text-sm">
                  <strong>Security Note:</strong> Your LinkedIn credentials are encrypted and stored securely. 
                  We'll use these for automation via Unipile API.
                </p>
              </div>
              
              {/* LinkedIn Email Input */}
              <div>
                <label htmlFor="linkedin-email" className="block text-sm font-medium text-gray-700 mb-1">
                  LinkedIn Email
                </label>
                <input
                  id="linkedin-email"
                  type="email"
                  value={linkedinEmail}
                  onChange={(e) => setLinkedinEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your-linkedin@email.com"
                  disabled={linkedinVerified}
                />
              </div>

              {/* LinkedIn Password Input */}
              <div>
                <label htmlFor="linkedin-password" className="block text-sm font-medium text-gray-700 mb-1">
                  LinkedIn Password
                </label>
                <div className="relative">
                  <input
                    id="linkedin-password"
                    type={showLinkedinPassword ? 'text' : 'password'}
                    value={linkedinPassword}
                    onChange={(e) => setLinkedinPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your LinkedIn password"
                    disabled={linkedinVerified}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLinkedinPassword(!showLinkedinPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showLinkedinPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                  </button>
                </div>
              </div>

              {/* Verification Code Input */}
              {showCodeInput && (
                <div>
                  <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 mb-1">
                    Verification Code
                  </label>
                  <input
                    id="verification-code"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter verification code"
                  />
                </div>
              )}

              {/* Connect Button */}
              <button
                onClick={async () => {
                  // Handle verification code submission
                  if (showCodeInput && verificationCode) {
                    setIsVerifying(true);
                    setError('');
                    try {
                      const token = sessionStorage.getItem('token');
                      const response = await fetch('/api/unipile/verify-code', {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          account_id: pendingAccountId,
                          code: verificationCode
                        })
                      });
                      const data = await response.json();
                      
                      if (data.success && !data.data?.error) {
                        await fetch('/api/user/linkedin-account', {
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({
                            email: linkedinEmail,
                            password: linkedinPassword,
                            useUnipile: true,
                            unipile_account_id: pendingAccountId
                          })
                        });
                        
                        setLinkedinVerified(true);
                        setLinkedinStatus('✅ LinkedIn connected successfully!');
                        setShowCodeInput(false);
                        setIsVerifying(false);
                        setTimeout(() => setCurrentStep(currentStep + 1), 1000);
                      } else {
                        throw new Error(data.error || 'Invalid verification code');
                      }
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Verification failed');
                      setIsVerifying(false);
                    }
                    return;
                  }
                  
                  // Original connect logic
                  if (!linkedinEmail || !linkedinPassword) {
                    setError('Please enter both email and password');
                    return;
                  }
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (!emailRegex.test(linkedinEmail)) {
                    setError('Please enter a valid email address');
                    return;
                  }

                  setIsVerifying(true);
                  setError('');
                  setLinkedinStatus('Connecting to LinkedIn via Unipile...');
                  try {
                    const token = sessionStorage.getItem('token');

                    // Connect to Unipile with credentials
                    const unipileResponse = await fetch('/api/unipile/connect', {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        username: linkedinEmail,
                        password: linkedinPassword
                      })
                    });
                    const unipileData = await unipileResponse.json();
                    
                    // Check for Unipile error response
                    if (unipileData.data?.status === 401 || unipileData.data?.type === 'errors/invalid_credentials') {
                      throw new Error(unipileData.data?.title || 'Invalid LinkedIn credentials');
                    }
                    
                    // Check for checkpoint
                    if (unipileData.success && unipileData.data?.object === 'Checkpoint') {
                      const checkpointType = unipileData.data?.checkpoint?.type;
                      const accountId = unipileData.data?.account_id;
                      
                      // Handle OTP verification checkpoint
                      if (checkpointType === 'OTP' && accountId) {
                        setPendingAccountId(accountId);
                        setShowCodeInput(true);
                        setLinkedinStatus('⚠️ LinkedIn requires a verification code. Please check your email or phone.');
                        setIsVerifying(false);
                        return;
                      }
                      
                      // Handle in-app validation checkpoint
                      if (checkpointType === 'IN_APP_VALIDATION' && accountId) {
                        const accountId = unipileData.data.account_id;
                        
                        setLinkedinStatus('⚠️ LinkedIn requires verification! Please check your LinkedIn mobile app and approve the login request.\n\nWaiting for approval...');
                        
                        // Poll for account status
                        const pollInterval = setInterval(async () => {
                          try {
                            const statusResponse = await fetch(`/api/unipile/account/${accountId}`, {
                              headers: { 'Authorization': `Bearer ${token}` }
                            });
                            const statusData = await statusResponse.json();

                            console.log(`statusData ${JSON.stringify(statusData)}`);
                            
                            const sourceStatus = statusData.data?.sources?.[0]?.status;
                            if (sourceStatus === 'OK') {
                              clearInterval(pollInterval);
                              
                              // Save credentials + connected account_id
                              await fetch('/api/user/linkedin-account', {
                                method: 'POST',
                                headers: {
                                  'Authorization': `Bearer ${token}`,
                                  'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                  email: linkedinEmail,
                                  password: linkedinPassword,
                                  useUnipile: true,
                                  unipile_account_id: accountId
                                })
                              });
                              
                              setLinkedinVerified(true);
                              setLinkedinStatus('✅ LinkedIn connected successfully!');
                              setIsVerifying(false);
                              
                              // Auto-advance to next step after 1 second
                              setTimeout(() => {
                                setCurrentStep(currentStep + 1);
                              }, 1000);
                            } else if (sourceStatus === 'ERROR' || sourceStatus === 'FAILED') {
                              clearInterval(pollInterval);
                              setError('Connection failed. Please try again.');
                              setLinkedinStatus('');
                              setIsVerifying(false);
                            }
                          } catch (err) {
                            console.error('Poll error:', err);
                          }
                        }, 5000);
                        
                        // Timeout after 2 minutes
                        setTimeout(() => {
                          clearInterval(pollInterval);
                          if (!linkedinVerified) {
                            setError('Verification timeout. Please try again.');
                            setLinkedinStatus('');
                            setIsVerifying(false);
                          }
                        }, 120000);
                        
                        return;
                      }
                    }
                    
                    if (unipileData.success && unipileData.data?.id) {
                      // Save credentials + Unipile account_id in one call
                      await fetch('/api/user/linkedin-account', {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          email: linkedinEmail,
                          password: linkedinPassword,
                          useUnipile: true,
                          unipile_account_id: unipileData.data.id
                        })
                      });
                      
                      setLinkedinVerified(true);
                      setLinkedinStatus('✅ LinkedIn connected successfully!');
                      setIsVerifying(false);
                      
                      // Auto-advance to next step after 1 second
                      setTimeout(() => {
                        setCurrentStep(currentStep + 1);
                      }, 1000);
                    } else {
                      throw new Error(unipileData.data?.title || unipileData.error || 'Failed to connect to Unipile');
                    }
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to connect');
                    setLinkedinStatus('');
                    setIsVerifying(false);
                  }
                }}
                disabled={isVerifying || linkedinVerified || (showCodeInput ? !verificationCode : (!linkedinEmail || !linkedinPassword))}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {showCodeInput ? 'Verifying...' : 'Connecting...'}
                  </>
                ) : linkedinVerified ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    LinkedIn Connected
                  </>
                ) : showCodeInput ? (
                  <>
                    <Key className="w-5 h-5" />
                    Verify Code
                  </>
                ) : (
                  <>
                    <Key className="w-5 h-5" />
                    Connect LinkedIn Account
                  </>
                )}
              </button>

              {/* Status Display */}
              {linkedinStatus && (
                <div className={`p-3 rounded-md text-sm ${
                  linkedinVerified ? 'bg-green-50 text-green-700' : 
                  linkedinStatus.includes('⚠️') ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
                  'bg-blue-50 text-blue-700'
                }`}>
                  <div className="flex items-center gap-2">
                    {linkedinVerified && <CheckCircle className="w-4 h-4" />}
                    {linkedinStatus.includes('⚠️') && <AlertCircle className="w-4 h-4" />}
                    <span className="whitespace-pre-line">{linkedinStatus}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* OpenAI API Key Setup */}
          {currentStep === 2 && (
            <div className="space-y-4 mb-6 text-left max-w-md mx-auto">
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
              
              <div>
                <label htmlFor="openai-key" className="block text-sm font-medium text-gray-700 mb-1">
                  OpenAI API Key
                </label>
                <div className="relative">
                  <input
                    id="openai-key"
                    type={showOpenaiKey ? 'text' : 'password'}
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="sk-..."
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                  >
                    {showOpenaiKey ? (
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
            </div>
          )}

          {/* Feature Highlights */}
          {currentStep === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-left">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Smart Targeting</h3>
                <p className="text-sm text-gray-600">Find and connect with your ideal prospects using advanced search criteria.</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">AI-Powered Messages</h3>
                <p className="text-sm text-gray-600">Generate personalized messages that get responses using AI technology.</p>
              </div>
            </div>
          )}

          {/* Analytics Preview */}
          {currentStep === 5 && (
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">1,247</div>
                  <div className="text-sm text-gray-600">Profiles Scraped</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">89%</div>
                  <div className="text-sm text-gray-600">AI Message Success</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">43</div>
                  <div className="text-sm text-gray-600">Appointments Booked</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center">
            <button
              onClick={handleNext}
              disabled={loading || (currentStep === 1 && !linkedinVerified) || isVerifying}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Completing...
                </div>
              ) : currentStep === steps.length - 1 ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Get Started
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center space-x-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-colors ${
                index <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;