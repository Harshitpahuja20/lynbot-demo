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
      headline, 
      subheadline, 
      benefits, 
      features, 
      target_audience, 
      unique_selling_points 
    } = req.body;

    if (!title || !headline) {
      return res.status(400).json({
        success: false,
        error: 'Title and headline are required'
      });
    }

    const valuePropsContent = `Value Proposition: ${title}

Headline: ${headline}
${subheadline ? `Subheadline: ${subheadline}` : ''}

Target Audience: ${target_audience || 'Not specified'}

Key Benefits:
${benefits || 'Not specified'}

Features:
${features || 'Not specified'}

Unique Selling Points:
${unique_selling_points || 'Not specified'}

This value proposition will help the AI craft compelling messages that highlight your unique value and resonate with your target audience.`;

    const supabase = getSupabaseClient();
    const { data: item, error } = await supabase
      .from('user_knowledge')
      .insert([{
        user_id: userId,
        title: `Value Prop: ${title}`,
        content: valuePropsContent,
        category: 'value_prop',
        type: 'value_prop',
        metadata: {
          headline,
          subheadline,
          benefits,
          features,
          target_audience,
          unique_selling_points,
          created_at: new Date().toISOString()
        },
        tags: ['value-proposition', 'benefits', 'usp'],
        is_active: true
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating value proposition:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to add value proposition'
      });
    }

    console.log(`Value proposition added for user: ${req.user.email} - Title: ${title}`);

    res.json({
      success: true,
      message: 'Value proposition added successfully',
      item
    });

  } catch (error) {
    console.error('Error adding value proposition:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add value proposition'
    });
  }
}

export default withAuth(handler);