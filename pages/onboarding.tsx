import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getCurrentUser, setToken } from '../utils/auth';
import { useWebSocket } from '../contexts/WebSocketContext';
import { 
  CheckCircle, 
  ArrowRight, 
  Users, 
  MessageSquare, 
  BarChart3,
  Key,
  Mail,
  Shield,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Wifi,
  WifiOff
} from 'lucide-react';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface LinkedInAccount {
  email: string;
  password: string;
}

const OnboardingPage: React.FC = () => {
  const router = useRouter();
  const user = getCurrentUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [linkedinAccount, setLinkedinAccount] = useState<LinkedInAccount>({
    email: '',
    password: ''
  });
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [showLinkedinPassword, setShowLinkedinPassword] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const { socket, isConnected: wsConnected, emit } = useWebSocket();
  const [linkedinStatus, setLinkedinStatus] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [linkedinVerified, setLinkedinVerified] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [verificationType, setVerificationType] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [isWaitingForApp, setIsWaitingForApp] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);

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

  useEffect(() => {
    if (!mounted || !socket) return;

    socket.on('loginStatus', (statusData) => {
      setLinkedinStatus(statusData.message);
    });

    socket.on('login', (result) => {
      setIsVerifying(false);
      setIsWaitingForApp(false);
      
      if (result.success) {
        setLinkedinVerified(true);
        setLinkedinStatus('LinkedIn login successful!');
        setError('');
        setShowVerificationInput(false);
        if (result.sessionData) {
          setSessionData(result.sessionData);
          // Store LinkedIn account with session data immediately
          saveLinkedInAccountWithSession(result.sessionData);
        }
      } else {
        setLinkedinVerified(false);
        setVerificationType(result.type || null);
        
        if (result.type === 'email_verification') {
          setShowVerificationInput(true);
          setLinkedinStatus('Email verification required - Enter the code from your email');
        } else if (result.type === 'app_verification_timeout') {
          setLinkedinStatus('App verification timeout after 5 minutes - Click "Retry" to try again');
        } else if (result.type === 'captcha_failed') {
          setLinkedinStatus('CAPTCHA solving failed - Please try again');
        } else {
          setError(result.message || 'LinkedIn login failed');
          setLinkedinStatus('Login failed');
        }
      }
    });

    socket.on('loginStatus', (statusData) => {
      if (statusData.type === 'app_verification') {
        setIsWaitingForApp(true);
        setIsVerifying(false);
      } else if (statusData.type === 'waiting') {
        setIsWaitingForApp(true);
      } else if (statusData.type === 'success') {
        setIsWaitingForApp(false);
        setLinkedinVerified(true);
        if (statusData.sessionData) {
          setSessionData(statusData.sessionData);
          // Store LinkedIn account with session data immediately
          saveLinkedInAccountWithSession(statusData.sessionData);
        }
      }
      setLinkedinStatus(statusData.message);
    });

    socket.on('verificationResult', (result) => {
      if (result.success) {
        setLinkedinVerified(true);
        setLinkedinStatus('Verification successful!');
        setShowVerificationInput(false);
        setError('');
        if (result.sessionData) {
          setSessionData(result.sessionData);
          // Store LinkedIn account with session data immediately
          saveLinkedInAccountWithSession(result.sessionData);
        }
      } else {
        setError(result.message || 'Verification failed');
      }
    });

    return () => {
      socket.off('loginStatus');
      socket.off('login');
      socket.off('verificationResult');
    };
  }, [mounted, socket]);

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

  const verifyLinkedInCredentials = async () => {
    if (!socket || !wsConnected) {
      setError('Not connected to LinkedIn service');
      return;
    }

    setIsVerifying(true);
    setError('');
    setLinkedinStatus('Starting LinkedIn verification...');
    setShowVerificationInput(false);
    
    emit('login', {
      email: linkedinAccount.email,
      password: linkedinAccount.password
    });
  };

  const submitVerificationCode = () => {
    if (!socket || !verificationCode.trim()) {
      setError('Please enter verification code');
      return;
    }

    emit('submitVerificationCode', {
      code: verificationCode.trim()
    });
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1: // LinkedIn Account Setup
        if (!linkedinAccount.email || !linkedinAccount.password) {
          setError('Please provide both LinkedIn email and password');
          return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(linkedinAccount.email)) {
          setError('Please enter a valid email address');
          return false;
        }
        if (!linkedinVerified) {
          setError('Please verify your LinkedIn credentials first');
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

  const saveLinkedInAccountWithSession = async (sessionData: any) => {
    if (!sessionData?.sessionToken) {
      console.log('No session token to save');
      return;
    }

    // Use credentials from WebSocket response
    const linkedinEmail = sessionData.email;
    const linkedinPassword = sessionData.password;

    console.log('Attempting to save LinkedIn account:', {
      email: linkedinEmail,
      hasPassword: !!linkedinPassword,
      hasSessionToken: !!sessionData.sessionToken
    });

    // Ensure we have valid credentials from WebSocket
    if (!linkedinEmail || !linkedinPassword) {
      console.log('❌ Missing LinkedIn credentials from WebSocket response');
      return;
    }

    try {
      const response = await fetch('/api/user/linkedin-account', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: linkedinEmail,
          password: linkedinPassword,
          sessionToken: sessionData.sessionToken
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('❌ Failed to save LinkedIn account:', data.error);
      } else {
        console.log('✅ LinkedIn account saved successfully with session!');
      }
    } catch (error) {
      console.error('❌ Error saving LinkedIn account:', error);
    }
  };

  const saveLinkedInAccount = async () => {
    // This is now handled automatically when session is obtained
    return Promise.resolve();
  };

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
      // Save LinkedIn account and OpenAI key before completing onboarding
      if (linkedinAccount.email && linkedinAccount.password) {
        await saveLinkedInAccount();
      }
      
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
        
        // Update the token in localStorage with the new one that includes onboardingComplete: true
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

  // Loading state during LinkedIn verification
  if (isVerifying && !isWaitingForApp && !showVerificationInput) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Verifying LinkedIn Account</h2>
            <p className="text-gray-600 mb-4">{linkedinStatus || 'Connecting to LinkedIn...'}</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                <strong>Please wait:</strong> We're securely verifying your LinkedIn credentials. This may take a few moments.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state during app verification wait
  if (isWaitingForApp) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-yellow-600" />
              </div>
              <Loader2 className="w-8 h-8 animate-spin text-yellow-600 mx-auto" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Waiting for App Verification</h2>
            <p className="text-gray-600 mb-4">{linkedinStatus}</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 text-sm">
                <strong>Action Required:</strong> Please check your LinkedIn mobile app and tap "Yes" to approve the login.
              </p>
            </div>
            <div className="text-xs text-gray-500">
              This process may take up to 5 minutes. Please keep this page open.
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                  We recommend using a dedicated LinkedIn account for automation.
                </p>
              </div>
              
              {/* WebSocket Status */}
              <div className={`flex items-center gap-2 p-2 rounded-md text-sm ${
                wsConnected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {wsConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                {wsConnected ? 'Connected to LinkedIn service' : 'Disconnected from service'}
              </div>
              
              <div>
                <label htmlFor="linkedin-email" className="block text-sm font-medium text-gray-700 mb-1">
                  LinkedIn Email Address
                </label>
                <input
                  id="linkedin-email"
                  type="email"
                  value={linkedinAccount.email}
                  onChange={(e) => setLinkedinAccount(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your-linkedin@email.com"
                  disabled={isVerifying}
                />
              </div>
              
              <div>
                <label htmlFor="linkedin-password" className="block text-sm font-medium text-gray-700 mb-1">
                  LinkedIn Password
                </label>
                <div className="relative">
                  <input
                    id="linkedin-password"
                    type={showLinkedinPassword ? 'text' : 'password'}
                    value={linkedinAccount.password}
                    onChange={(e) => setLinkedinAccount(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Your LinkedIn password"
                    disabled={isVerifying}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowLinkedinPassword(!showLinkedinPassword)}
                  >
                    {showLinkedinPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Verify Button */}
              <button
                onClick={verifyLinkedInCredentials}
                disabled={!linkedinAccount.email || !linkedinAccount.password || (isVerifying && !isWaitingForApp) || !wsConnected}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isVerifying && !isWaitingForApp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : linkedinVerified ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Verified
                  </>
                ) : verificationType === 'app_verification_timeout' ? (
                  'Retry Verification'
                ) : (
                  'Verify LinkedIn Credentials'
                )}
              </button>

              {/* Verification Code Input */}
              {showVerificationInput && (
                <div className="space-y-3">
                  <div>
                    <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 mb-1">
                      Verification Code
                    </label>
                    <input
                      id="verification-code"
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                    />
                  </div>
                  <button
                    onClick={submitVerificationCode}
                    disabled={!verificationCode.trim()}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Code
                  </button>
                </div>
              )}

              {/* Status Display */}
              {linkedinStatus && !isWaitingForApp && (
                <div className={`p-3 rounded-md text-sm ${
                  linkedinVerified ? 'bg-green-50 text-green-700' : 
                  verificationType === 'email_verification' ? 'bg-blue-50 text-blue-700' :
                  verificationType === 'captcha_failed' ? 'bg-red-50 text-red-700' :
                  'bg-gray-50 text-gray-700'
                }`}>
                  <div className="flex items-center gap-2">
                    {linkedinVerified && <CheckCircle className="w-4 h-4" />}
                    {linkedinStatus}
                  </div>
                  {verificationType === 'app_verification_timeout' && (
                    <div className="mt-2 text-xs text-orange-600">
                      The verification timed out. You can try again by clicking the "Retry Verification" button above.
                    </div>
                  )}
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
              disabled={loading || (currentStep === 1 && !linkedinVerified) || isVerifying || isWaitingForApp}
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