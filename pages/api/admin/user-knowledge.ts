import { NextApiResponse } from 'next';
import { withAdminAuth, AuthenticatedRequest } from '../../../lib/middleware/withAuth';

// Mock data for user knowledge items
const mockUserKnowledge = [
  {
    id: '1',
    title: 'Getting Started with LinkedIn Automation',
    content: `# Getting Started with LinkedIn Automation

Welcome to Lync Bot! This guide will help you set up your first LinkedIn automation campaign.

## Step 1: Connect Your LinkedIn Account
1. Go to Settings > LinkedIn
2. Enter your LinkedIn credentials
3. Verify the connection

## Step 2: Create Your First Campaign
1. Navigate to Campaigns
2. Click "New Campaign"
3. Define your target audience
4. Set up your message templates

## Step 3: Configure Automation
1. Go to Automation settings
2. Set your daily limits
3. Configure working hours
4. Enable automation types

## Best Practices
- Start with small daily limits
- Always personalize your messages
- Monitor your acceptance rates
- Respect LinkedIn's terms of service`,
    category: 'tutorial',
    type: 'article',
    tags: ['getting-started', 'linkedin', 'automation', 'setup'],
    isPublished: true,
    viewCount: 1543,
    helpfulVotes: 127,
    createdBy: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Troubleshooting Connection Issues',
    content: `# Troubleshooting Connection Issues

If you're experiencing issues with LinkedIn connections, try these solutions:

## Common Issues

### LinkedIn Account Not Connecting
- Verify your credentials are correct
- Check if 2FA is enabled (not supported)
- Ensure your account isn't restricted

### Low Acceptance Rates
- Review your connection request messages
- Check if you're targeting the right audience
- Reduce daily limits to appear more natural

### Messages Not Sending
- Verify your LinkedIn account is active
- Check daily limits haven't been exceeded
- Ensure automation is enabled

## Getting Help
If these solutions don't work, contact our support team with:
- Your account email
- Description of the issue
- Screenshots if applicable`,
    category: 'troubleshooting',
    type: 'article',
    tags: ['troubleshooting', 'linkedin', 'connection', 'support'],
    isPublished: true,
    viewCount: 892,
    helpfulVotes: 76,
    createdBy: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return handleGetUserKnowledge(req, res);
    case 'POST':
      return handleCreateUserKnowledge(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({
        success: false,
        error: `Method ${req.method} not allowed`
      });
  }
}

async function handleGetUserKnowledge(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    // In a real implementation, you would fetch from database
    res.json({
      success: true,
      items: mockUserKnowledge
    });
  } catch (error) {
    console.error('Error fetching user knowledge:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user knowledge'
    });
  }
}

async function handleCreateUserKnowledge(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { title, content, category, type, tags, isPublished } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title and content are required'
      });
    }

    // In a real implementation, you would save to database
    const newItem = {
      id: Date.now().toString(),
      title,
      content,
      category,
      type,
      tags: Array.isArray(tags) ? tags : [],
      isPublished: isPublished !== false,
      viewCount: 0,
      helpfulVotes: 0,
      createdBy: req.user.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      message: 'User knowledge item created successfully',
      item: newItem
    });
  } catch (error) {
    console.error('Error creating user knowledge:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user knowledge item'
    });
  }
}

export default withAdminAuth(handler);