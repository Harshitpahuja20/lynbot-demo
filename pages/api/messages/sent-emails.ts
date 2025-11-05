import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/withAuth';
import { getSupabaseAdminClient } from '../../../lib/supabase';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const userId = req.user.id;
    const { from } = req.query;

    const supabase = getSupabaseAdminClient();
    let query = supabase
      .from('sent_emails')
      .select('*')
      .eq('user_id', userId)
      .order('sent_at', { ascending: false });

    if (from && from !== 'all') {
      query = query.eq('from_email', from);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      emails: data || []
    });
  } catch (error) {
    console.error('Error fetching sent emails:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sent emails' });
  }
}

export default withAuth(handler);
