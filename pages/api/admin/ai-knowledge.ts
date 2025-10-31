import { NextApiResponse } from 'next';
import { withAdminAuth, AuthenticatedRequest } from '../../../lib/middleware/withAuth';

// Mock data for AI knowledge items
const mockAIKnowledge = [
  {
    id: '1',
    title: 'LinkedIn Connection Request Prompt',
    description: 'Professional connection request template for LinkedIn outreach',
    category: 'prompts',
    content: `You are an expert LinkedIn outreach specialist. Generate a personalized connection request message that:

1. References the prospect's current role or company
2. Explains a genuine reason for connecting
3. Is professional but personable
4. Stays under 300 characters
5. Avoids generic templates

Prospect Information:
- Name: {name}
- Title: {title}
- Company: {company}
- Industry: {industry}

Generate a connection request that feels authentic and increases acceptance rates.`,
    tags: ['linkedin', 'connection', 'outreach', 'professional'],
    isActive: true,
    usageCount: 1247,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Email Follow-up Template',
    description: 'AI-powered email follow-up for cold outreach campaigns',
    category: 'templates',
    content: `Create a professional follow-up email that:

1. References the previous outreach attempt
2. Provides additional value or insight
3. Has a clear but soft call-to-action
4. Maintains professional tone
5. Personalizes based on prospect data

Previous context: {previous_message}
Prospect: {name} at {company}
Industry: {industry}

Generate an email that re-engages without being pushy.`,
    tags: ['email', 'follow-up', 'cold-outreach', 'professional'],
    isActive: true,
    usageCount: 892,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return handleGetAIKnowledge(req, res);
    case 'POST':
      return handleCreateAIKnowledge(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({
        success: false,
        error: `Method ${req.method} not allowed`
      });
  }
}

async function handleGetAIKnowledge(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    // In a real implementation, you would fetch from database
    // For now, return mock data
    res.json({
      success: true,
      items: mockAIKnowledge
    });
  } catch (error) {
    console.error('Error fetching AI knowledge:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AI knowledge'
    });
  }
}

async function handleCreateAIKnowledge(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { title, description, category, content, tags, isActive } = req.body;

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
      description: description || '',
      category,
      content,
      tags: Array.isArray(tags) ? tags : [],
      isActive: isActive !== false,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      message: 'AI knowledge item created successfully',
      item: newItem
    });
  } catch (error) {
    console.error('Error creating AI knowledge:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create AI knowledge item'
    });
  }
}

export default withAdminAuth(handler);