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
let mockDocuments: UploadedDocument[] = [
  {
    id: '1',
    filename: 'linkedin-best-practices.pdf',
    originalName: 'LinkedIn Best Practices Guide.pdf',
    size: 2048576,
    mimeType: 'application/pdf',
    uploadedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    processedAt: new Date(Date.now() - 86340000).toISOString(), // 1 day ago + 1 minute
    status: 'processed',
    extractedText: 'LinkedIn automation best practices include maintaining authentic communication, respecting daily limits, personalizing messages, and following platform guidelines...',
    summary: 'Comprehensive guide covering LinkedIn automation best practices, safety guidelines, and performance optimization strategies.',
    tags: ['linkedin', 'automation', 'best-practices', 'guidelines'],
    isActive: true
  },
  {
    id: '2',
    filename: 'cold-email-templates.pdf',
    originalName: 'Cold Email Templates and Strategies.pdf',
    size: 1536000,
    mimeType: 'application/pdf',
    uploadedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    processedAt: new Date(Date.now() - 172740000).toISOString(), // 2 days ago + 1 minute
    status: 'processed',
    extractedText: 'Effective cold email strategies focus on personalization, value proposition, clear call-to-action, and follow-up sequences...',
    summary: 'Collection of proven cold email templates and strategies for B2B outreach, including personalization techniques and follow-up sequences.',
    tags: ['email', 'cold-outreach', 'templates', 'b2b'],
    isActive: true
  }
];

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`
    });
  }

  try {
    // In a real implementation, you would fetch from database
    // For now, return mock data
    res.json({
      success: true,
      documents: mockDocuments.sort((a, b) => 
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      )
    });

  } catch (error) {
    console.error('Error fetching uploaded documents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch uploaded documents'
    });
  }
}

export default withAdminAuth(handler);