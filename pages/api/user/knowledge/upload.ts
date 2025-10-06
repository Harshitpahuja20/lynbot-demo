import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../../lib/middleware/withAuth';
import { getSupabaseClient } from '../../../../lib/supabase';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

// Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`
    });
  }

  try {
    const userId = req.user.id;

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

    const title = Array.isArray(fields.title) ? fields.title[0] : fields.title || '';
    const description = Array.isArray(fields.description) ? fields.description[0] : fields.description || '';
    const tags = Array.isArray(fields.tags) ? fields.tags[0] : fields.tags || '';

    // Mock text extraction (in production, use pdf-parse or similar)
    const mockExtractedText = `Extracted content from ${file.originalFilename || 'document'}:

This is a simulation of text content extracted from the uploaded PDF document. In a production environment, this would contain the actual text content extracted using PDF parsing libraries.

The extracted text would include:
- Document headings and sections
- Paragraph content
- Key information and data points
- Tables and structured data
- Important insights and knowledge

This content will be used by the AI to enhance its understanding of your business and improve message personalization.

Document details:
- Original filename: ${file.originalFilename}
- File size: ${file.size} bytes
- Upload date: ${new Date().toISOString()}
- Description: ${description}`;

    const mockSummary = `Summary of ${file.originalFilename || 'document'}: ${description || 'This document contains important business information that will enhance AI-powered messaging capabilities.'}`;

    const supabase = getSupabaseClient();
    const { data: document, error } = await supabase
      .from('knowledge_documents')
      .insert([{
        user_id: userId,
        filename: file.newFilename || file.originalFilename || 'unknown.pdf',
        original_name: file.originalFilename || 'unknown.pdf',
        file_size: file.size,
        mime_type: file.mimetype || 'application/pdf',
        file_path: file.filepath || '',
        extracted_text: mockExtractedText,
        summary: mockSummary,
        status: 'processed',
        tags: tags ? tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : [],
        is_global: false
      }])
      .select()
      .single();

    if (error) {
      console.error('Error saving document:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to save document'
      });
    }

    // Clean up uploaded file from temp directory
    try {
      if (file.filepath) {
        fs.unlinkSync(file.filepath);
      }
    } catch (cleanupError) {
      console.error('Error cleaning up temp file:', cleanupError);
    }

    console.log(`Document uploaded for user: ${req.user.email} - File: ${file.originalFilename}`);

    res.json({
      success: true,
      message: 'Document uploaded and processed successfully',
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

export default withAuth(handler);