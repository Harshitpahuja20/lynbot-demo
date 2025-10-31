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
    const { question, answer, category = 'general' } = req.body;

    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        error: 'Question and answer are required'
      });
    }

    const faqContent = `FAQ: ${question}

Question: ${question}

Answer: ${answer}

Category: ${category}

This FAQ will help the AI provide accurate information about your business when prospects ask similar questions during conversations.`;

    const supabase = getSupabaseClient();
    const { data: item, error } = await supabase
      .from('user_knowledge')
      .insert([{
        user_id: userId,
        title: `FAQ: ${question}`,
        content: faqContent,
        category: 'faq',
        type: 'faq',
        metadata: {
          question,
          answer,
          faq_category: category,
          created_at: new Date().toISOString()
        },
        tags: ['faq', category, 'questions'],
        is_active: true
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating FAQ:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to add FAQ'
      });
    }

    console.log(`FAQ added for user: ${req.user.email} - Question: ${question}`);

    res.json({
      success: true,
      message: 'FAQ added successfully',
      item
    });

  } catch (error) {
    console.error('Error adding FAQ:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add FAQ'
    });
  }
}

export default withAuth(handler);