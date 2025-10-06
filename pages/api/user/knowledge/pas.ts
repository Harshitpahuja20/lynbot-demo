import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../../lib/middleware/withAuth';
import { getSupabaseClient } from '../../../../lib/supabase';

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
      title, 
      pain_points, 
      agitation, 
      solution, 
      offer_details, 
      call_to_action 
    } = req.body;

    if (!title || !pain_points || !solution) {
      return res.status(400).json({
        success: false,
        error: 'Title, pain points, and solution are required'
      });
    }

    const pasContent = `Pain, Agitate, Solution Framework: ${title}

PAIN POINTS:
${pain_points}

AGITATION:
${agitation || 'Not specified'}

SOLUTION:
${solution}

OFFER DETAILS:
${offer_details || 'Not specified'}

CALL TO ACTION:
${call_to_action || 'Not specified'}

This PAS framework will help the AI create compelling messages that identify prospect pain points, agitate the consequences of inaction, and present your solution as the answer.`;

    const supabase = getSupabaseClient();
    const { data: item, error } = await supabase
      .from('user_knowledge')
      .insert([{
        user_id: userId,
        title: `PAS: ${title}`,
        content: pasContent,
        category: 'pain_agitate_solution',
        type: 'pain_points',
        metadata: {
          pain_points,
          agitation,
          solution,
          offer_details,
          call_to_action,
          framework: 'PAS',
          created_at: new Date().toISOString()
        },
        tags: ['pas', 'framework', 'pain-points', 'solution'],
        is_active: true
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating PAS framework:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to add PAS framework'
      });
    }

    console.log(`PAS framework added for user: ${req.user.email} - Title: ${title}`);

    res.json({
      success: true,
      message: 'PAS framework added successfully',
      item
    });

  } catch (error) {
    console.error('Error adding PAS framework:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add PAS framework'
    });
  }
}

export default withAuth(handler);