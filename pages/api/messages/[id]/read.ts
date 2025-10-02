import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../../lib/middleware/withAuth';
import { messageOperations } from '../../../../lib/database';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`
    });
  }


  try {
    const userId = req.user.id;
    const { id } = req.query;

    // Find and update the message
    const message = await messageOperations.markAsRead(id as string, userId);

    if (!message) {
      return res.status(404).json({ 
        success: false,
        error: 'Message not found or cannot be marked as read' 
      });
    }

    console.log(`Message marked as read: ${message.id}`);

    res.json({
      success: true,
      message: 'Message marked as read',
      data: message
    });

  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to mark message as read' 
    });
  }
}

export default withAuth(handler);