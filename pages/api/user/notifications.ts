import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/withAuth';
import { userOperations } from '../../../lib/database';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`
    });
  }

  try {
    const { notifications } = req.body;
    const userId = req.user.id;

    if (!notifications || typeof notifications !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Notification settings are required'
      });
    }

    // Get current user
    const currentUser = await userOperations.findById(userId);
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update user with new notification settings
    const user = await userOperations.update(userId, {
      settings: {
        ...currentUser.settings,
        notifications
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log(`Notification settings updated for user: ${req.user.email}`);

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

export default withAuth(handler);