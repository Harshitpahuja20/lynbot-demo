import { NextApiResponse } from 'next';
import { NextApiRequest } from 'next';
import jwt from 'jsonwebtoken';
import { getSupabaseAdminClient } from '../../../lib/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`
    });
  }

  try {
    // Authenticate user
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.id;

    const { notifications } = req.body;

    if (!notifications || typeof notifications !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Notification settings are required'
      });
    }

    // Get current user
    const supabase = getSupabaseAdminClient();
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userError || !currentUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update user with new notification settings
    const { data: user, error: updateError } = await supabase
      .from('users')
      .update({
      settings: {
        ...currentUser.settings,
        notifications
      }
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError || !user) {
      return res.status(404).json({
        success: false,
        error: 'Failed to update notification settings'
      });
    }

    console.log(`Notification settings updated for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Notification settings updated successfully',
      user
    });

  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification settings'
    });
  }
}
