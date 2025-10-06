import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../../lib/middleware/withAuth';
import { getSupabaseClient } from '../../../../lib/supabase';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`
    });
  }

  try {
    const userId = req.user.id;
    const { category, type } = req.query;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('user_knowledge')
      .select('*')
      .eq('user_id', userId)
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
      console.error('Error fetching user knowledge:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch knowledge items'
      });
    }

    res.json({
      success: true,
      items: items || []
    });

  } catch (error) {
    console.error('Error in user knowledge API:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch knowledge items'
    });
  }
}

export default withAuth(handler);