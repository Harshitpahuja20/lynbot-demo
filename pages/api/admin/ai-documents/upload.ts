import { NextApiRequest, NextApiResponse } from 'next';
import { withAdminAuth, AuthenticatedRequest } from '../../../../lib/middleware/withAuth';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

// Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

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
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`
    });
  }

  try {
    // Parse the uploaded file
    const form = formidable({
      uploadDir: '/tmp',
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      filter: ({ mimetype }) => {
        return mimetype === 'application/pdf';
      }
    });

    const [fields, files] = await form.parse(req);
    
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const tags = Array.isArray(fields.tags) ? fields.tags[0] : fields.tags || '';
    const autoProcess = Array.isArray(fields.autoProcess) ? fields.autoProcess[0] === 'true' : fields.autoProcess === 'true';

    // Create document record
    const document: UploadedDocument = {
      id: Date.now().toString(),
      filename: file.newFilename || file.originalFilename || 'unknown.pdf',
      originalName: file.originalFilename || 'unknown.pdf',
      size: file.size,
      mimeType: file.mimetype || 'application/pdf',
      uploadedAt: new Date().toISOString(),
      status: autoProcess ? 'processing' : 'uploaded',
      tags: tags ? tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : [],
      isActive: true
    };

    // Store document in mock storage
    mockDocuments.push(document);

    // Simulate PDF processing if autoProcess is enabled
    if (autoProcess) {
      // In a real implementation, you would:
      // 1. Use a PDF parsing library like pdf-parse or pdf2pic
      // 2. Extract text content from the PDF
      // 3. Generate a summary using AI
      // 4. Store the processed content in the database
      
      setTimeout(async () => {
        try {
          // Mock text extraction
          const mockExtractedText = `This is extracted text from ${document.originalName}. 
          
In a real implementation, this would contain the actual text content extracted from the PDF document using libraries like pdf-parse or similar PDF processing tools.

The extracted text would then be used to enhance the AI knowledge base, allowing the AI to reference this information when generating responses for users.

Key topics covered in this document:
- LinkedIn automation best practices
- Professional networking strategies
- Message personalization techniques
- Compliance and safety guidelines
- Performance optimization tips`;

          const mockSummary = `Summary of ${document.originalName}: This document covers LinkedIn automation best practices, including professional networking strategies, message personalization, and compliance guidelines. It provides actionable insights for improving outreach performance while maintaining platform safety.`;

          // Update document status
          const docIndex = mockDocuments.findIndex(d => d.id === document.id);
          if (docIndex >= 0) {
            mockDocuments[docIndex] = {
              ...mockDocuments[docIndex],
              status: 'processed',
              processedAt: new Date().toISOString(),
              extractedText: mockExtractedText,
              summary: mockSummary
            };
          }
        } catch (error) {
          console.error('Error processing document:', error);
          const docIndex = mockDocuments.findIndex(d => d.id === document.id);
          if (docIndex >= 0) {
            mockDocuments[docIndex] = {
              ...mockDocuments[docIndex],
              status: 'failed'
            };
          }
        }
      }, 3000); // Simulate 3 second processing time
    }

    // Clean up uploaded file from temp directory
    try {
      if (file.filepath) {
        fs.unlinkSync(file.filepath);
      }
    } catch (cleanupError) {
      console.error('Error cleaning up temp file:', cleanupError);
    }

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      document
    });

  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload document'
    });
  }
}

export default withAdminAuth(handler);