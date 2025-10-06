import { NextApiResponse } from 'next';
import { withAdminAuth, AuthenticatedRequest } from '../../../lib/middleware/withAuth';
import { getSupabaseAdminClient } from '../../../lib/supabase';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return handleGetGlobalKnowledge(req, res);
    case 'POST':
      return handleCreateGlobalKnowledge(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({
        success: false,
        error: `Method ${req.method} not allowed`
      });
  }
}

async function handleGetGlobalKnowledge(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { category, type } = req.query;

    const supabase = getSupabaseAdminClient();
    let query = supabase
      .from('global_knowledge')
      .select('*')
      .eq('is_active', true);

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    query = query.order('created_at', { ascending: false });

    const { data: items, error } = await query;

    if (error) {
      console.error('Error fetching global knowledge:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch global knowledge'
      });
    }

    res.json({
      success: true,
      items: items || []
    });

  } catch (error) {
    console.error('Error in global knowledge API:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch global knowledge'
    });
  }
}

async function handleCreateGlobalKnowledge(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { title, content, category, type, tags, isActive } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title and content are required'
      });
    }

    const supabase = getSupabaseAdminClient();
    const { data: item, error } = await supabase
      .from('global_knowledge')
      .insert([{
        title,
        content,
        category: category || 'general',
        type: type || 'text',
        tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map((tag: string) => tag.trim()) : []),
        is_active: isActive !== false,
        created_by: req.user.id
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating global knowledge:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create global knowledge'
      });
    }

    console.log(`Global knowledge created by admin: ${req.user.email} - Title: ${title}`);

    res.json({
      success: true,
      message: 'Global knowledge created successfully',
      item
    });

  } catch (error) {
    console.error('Error creating global knowledge:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create global knowledge'
    });
  }
}

export default withAdminAuth(handler);