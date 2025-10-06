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

    const supabase = getSupabaseClient();
    const { data: documents, error } = await supabase
      .from('knowledge_documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user documents:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch documents'
      });
    }

    res.json({
      success: true,
      documents: documents || []
    });

  } catch (error) {
    console.error('Error in user documents API:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch documents'
    });
  }
}

export default withAuth(handler);