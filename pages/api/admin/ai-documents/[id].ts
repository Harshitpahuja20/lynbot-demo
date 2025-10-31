import { NextApiResponse } from 'next';
import { withAdminAuth, AuthenticatedRequest } from '../../../../lib/middleware/withAuth';

interface UploadedDocument {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  processedAt?: string;
  status: 'uploading' | 'processing' | 'processed' | 'failed';
  extractedText?: string;
  summary?: string;
  tags: string[];
  isActive: boolean;
}

// Mock storage for uploaded documents (in production, use a database)
let mockDocuments: UploadedDocument[] = [];

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query;

  switch (req.method) {
    case 'GET':
      return handleGetDocument(req, res, id as string);
    case 'PUT':
      return handleUpdateDocument(req, res, id as string);
    case 'DELETE':
      return handleDeleteDocument(req, res, id as string);
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).json({
        success: false,
        error: `Method ${req.method} not allowed`
      });
  }
}

async function handleGetDocument(req: AuthenticatedRequest, res: NextApiResponse, id: string) {
  try {
    const document = mockDocuments.find(doc => doc.id === id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    res.json({
      success: true,
      document
    });

  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch document'
    });
  }
}

async function handleUpdateDocument(req: AuthenticatedRequest, res: NextApiResponse, id: string) {
  try {
    const { tags, isActive } = req.body;
    
    const docIndex = mockDocuments.findIndex(doc => doc.id === id);
    if (docIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Update document
    mockDocuments[docIndex] = {
      ...mockDocuments[docIndex],
      ...(tags && { tags: Array.isArray(tags) ? tags : tags.split(',').map((tag: string) => tag.trim()) }),
      ...(typeof isActive === 'boolean' && { isActive })
    };

    res.json({
      success: true,
      message: 'Document updated successfully',
      document: mockDocuments[docIndex]
    });

  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update document'
    });
  }
}

async function handleDeleteDocument(req: AuthenticatedRequest, res: NextApiResponse, id: string) {
  try {
    const docIndex = mockDocuments.findIndex(doc => doc.id === id);
    if (docIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Remove document from mock storage
    const deletedDoc = mockDocuments.splice(docIndex, 1)[0];

    console.log(`Document deleted by admin: ${deletedDoc.originalName}`);

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete document'
    });
  }
}

export default withAdminAuth(handler);