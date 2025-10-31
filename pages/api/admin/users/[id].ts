import { NextApiResponse } from 'next';
import { withAdminAuth, AuthenticatedRequest } from '../../../../lib/middleware/withAuth';
import { userOperations } from '../../../../lib/database';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {

  const { id } = req.query;

  switch (req.method) {
    case 'GET':
      return handleGetUser(req, res, id as string);
    case 'PUT':
      return handleUpdateUser(req, res, id as string);
    case 'DELETE':
      return handleDeleteUser(req, res, id as string);
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).json({
        success: false,
        error: `Method ${req.method} not allowed`
      });
  }
}

async function handleGetUser(req: AuthenticatedRequest, res: NextApiResponse, id: string) {
  try {
    const user = await userOperations.findById(id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch user' 
    });
  }
}

async function handleUpdateUser(req: AuthenticatedRequest, res: NextApiResponse, id: string) {
  try {
    const updates = req.body;
    
    // Prevent updating sensitive fields
    delete updates.password_hash;
    delete updates.id;
    delete updates.created_at;
    delete updates.updated_at;

    // Prevent admin from deactivating themselves
    if (updates.is_active === false && req.user.id === id) {
      return res.status(400).json({
        success: false,
        error: 'You cannot deactivate your own account'
      });
    }

    const user = await userOperations.update(id, updates);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    console.log(`User updated by admin: ${user.email}`);

    res.json({
      success: true,
      message: 'User updated successfully',
      user
    });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update user' 
    });
  }
}

async function handleDeleteUser(req: AuthenticatedRequest, res: NextApiResponse, id: string) {
  try {
    // Prevent admin from deleting themselves
    if (req.user.id === id) {
      return res.status(400).json({
        success: false,
        error: 'You cannot delete your own account'
      });
    }

    const user = await userOperations.findById(id);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    await userOperations.delete(id);

    console.log(`User deleted by admin: ${user.email}`);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete user' 
    });
  }
}

export default withAdminAuth(handler);