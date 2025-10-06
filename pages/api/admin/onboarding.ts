import { NextApiResponse } from 'next';
import { withAdminAuth, AuthenticatedRequest } from '../../../lib/middleware/withAuth';

// Mock data for onboarding steps
const mockOnboardingSteps = [
  {
    id: '1',
    order: 1,
    title: 'Welcome to Lync Bot',
    description: 'Introduction and platform overview',
    type: 'welcome',
    content: {
      instructions: 'Welcome new users to the platform and explain key benefits',
      checklistItems: [
        'Show platform overview',
        'Highlight key features',
        'Set expectations'
      ]
    },
    isRequired: true,
    isActive: true,
    completionRate: 98,
    averageTimeSpent: 45,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    order: 2,
    title: 'LinkedIn Account Setup',
    description: 'Connect and verify LinkedIn credentials',
    type: 'setup',
    content: {
      instructions: 'Guide users through LinkedIn account connection process',
      formFields: [
        {
          name: 'linkedin_email',
          type: 'email',
          label: 'LinkedIn Email',
          required: true,
          placeholder: 'your-linkedin@email.com'
        },
        {
          name: 'linkedin_password',
          type: 'password',
          label: 'LinkedIn Password',
          required: true,
          placeholder: 'Your LinkedIn password'
        }
      ],
      checklistItems: [
        'Verify credentials are correct',
        'Test connection',
        'Save securely'
      ]
    },
    isRequired: true,
    isActive: true,
    completionRate: 87,
    averageTimeSpent: 120,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    order: 3,
    title: 'AI Configuration',
    description: 'Set up AI API keys for message generation',
    type: 'setup',
    content: {
      instructions: 'Help users configure AI settings for automated message generation',
      formFields: [
        {
          name: 'openai_api_key',
          type: 'password',
          label: 'OpenAI API Key',
          required: false,
          placeholder: 'sk-...'
        }
      ],
      checklistItems: [
        'Explain API key benefits',
        'Show how to get API key',
        'Test API connection'
      ]
    },
    isRequired: false,
    isActive: true,
    completionRate: 65,
    averageTimeSpent: 180,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return handleGetOnboardingSteps(req, res);
    case 'POST':
      return handleCreateOnboardingStep(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({
        success: false,
        error: `Method ${req.method} not allowed`
      });
  }
}

async function handleGetOnboardingSteps(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    // In a real implementation, you would fetch from database
    res.json({
      success: true,
      steps: mockOnboardingSteps
    });
  } catch (error) {
    console.error('Error fetching onboarding steps:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch onboarding steps'
    });
  }
}

async function handleCreateOnboardingStep(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { title, description, type, instructions, isRequired, isActive } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: 'Title and description are required'
      });
    }

    // In a real implementation, you would save to database
    const newStep = {
      id: Date.now().toString(),
      order: mockOnboardingSteps.length + 1,
      title,
      description,
      type,
      content: {
        instructions: instructions || '',
        checklistItems: []
      },
      isRequired: isRequired !== false,
      isActive: isActive !== false,
      completionRate: 0,
      averageTimeSpent: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      message: 'Onboarding step created successfully',
      step: newStep
    });
  } catch (error) {
    console.error('Error creating onboarding step:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create onboarding step'
    });
  }
}

export default withAdminAuth(handler);