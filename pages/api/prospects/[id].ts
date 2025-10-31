import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/withAuth';
import { prospectOperations } from '../../../lib/database';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {

  const { id } = req.query;

  switch (req.method) {
    case 'GET':
      return handleGetProspect(req, res, id as string);
    case 'PUT':
      return handleUpdateProspect(req, res, id as string);
    case 'DELETE':
      return handleDeleteProspect(req, res, id as string);
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).json({
        success: false,
        error: `Method ${req.method} not allowed`
      });
  }
}

async function handleGetProspect(req: AuthenticatedRequest, res: NextApiResponse, id: string) {
  try {
    const userId = req.user.id;

    const prospect = await prospectOperations.findById(id, userId);
    
    if (!prospect) {
      return res.status(404).json({ 
        success: false,
        error: 'Prospect not found' 
      });
    }

    res.json({
      success: true,
      prospect
    });

  } catch (error) {
    console.error('Error fetching prospect:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch prospect' 
    });
  }
}

async function handleUpdateProspect(req: AuthenticatedRequest, res: NextApiResponse, id: string) {
  try {
    const userId = req.user.id;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.id;
    delete updates.user_id;
    delete updates.created_at;
    delete updates.updated_at;

    const prospect = await prospectOperations.update(id, userId, updates);

    if (!prospect) {
      return res.status(404).json({ 
        success: false,
        error: 'Prospect not found' 
      });
    }

    console.log(`Prospect updated: ${prospect.linkedin_data.name}`);

    res.json({
      success: true,
      message: 'Prospect updated successfully',
      prospect
    });

  } catch (error) {
    console.error('Error updating prospect:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update prospect' 
    });
  }
}

async function handleDeleteProspect(req: AuthenticatedRequest, res: NextApiResponse, id: string) {
  try {
    const userId = req.user.id;

    const prospect = await prospectOperations.findById(id, userId);

    if (!prospect) {
      return res.status(404).json({ 
        success: false,
        error: 'Prospect not found' 
      });
    }

    await prospectOperations.delete(id, userId);

    console.log(`Prospect deleted: ${prospect.linkedin_data.name}`);

    res.json({
      success: true,
      message: 'Prospect deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting prospect:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete prospect' 
    });
  }
}

export default withAuth(handler);