import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/withAuth';
import { prospectOperations } from '../../../lib/database';
import { generateAIEmail } from '../../../lib/services/openaiService';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`
    });
  }

  try {
    const userId = req.user.id;
    const { 
      prospectId, 
      messageType = 'cold_email', 
      tone = 'professional',
      context,
      customPrompt 
    } = req.body;

    if (!prospectId) {
      return res.status(400).json({
        success: false,
        error: 'Prospect ID is required'
      });
    }

    // Get prospect data
    const prospect = await prospectOperations.findById(prospectId, userId);
    if (!prospect) {
      return res.status(404).json({
        success: false,
        error: 'Prospect not found'
      });
    }

    // Prepare prospect data for AI
    const prospectData = {
      name: prospect.linkedin_data.name,
      title: prospect.linkedin_data.title,
      company: prospect.linkedin_data.company,
      industry: prospect.linkedin_data.industry,
      location: prospect.linkedin_data.location
    };

    // Prepare campaign data
    const campaignData = {
      tone: tone,
      description: context || '',
      useAI: true,
      customPrompt: customPrompt
    };

    // Generate AI email
    const aiEmail = await generateAIEmail({
      prospectData,
      messageType: messageType as any,
      campaignData
    });

    res.json({
      success: true,
      draft: {
        subject: aiEmail.subject,
        content: aiEmail.content,
        to: prospect.contact_info?.email || '',
        prospectName: prospect.linkedin_data.name,
        prospectCompany: prospect.linkedin_data.company
      }
    });

  } catch (error) {
    console.error('Error generating email draft:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate email draft'
    });
  }
}

export default withAuth(handler);