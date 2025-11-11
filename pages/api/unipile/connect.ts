import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const NEST_API_URL = process.env.NEXT_NEST_API_URL || 'http://localhost:4000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password required' });
    }

    const response = await fetch(`${NEST_API_URL}/unipile/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    
    // Handle NestJS error responses
    if (!response.ok) {
      // Check for Unipile error structure
      if (data.status === 401 || data.type === 'errors/invalid_credentials') {
        return res.status(401).json({ 
          success: false,
          data: {
            status: data.status,
            type: data.type,
            title: data.title || 'Invalid LinkedIn credentials',
            detail: data.detail
          }
        });
      }
      return res.status(response.status).json({ 
        success: false, 
        error: data.message || 'Failed to connect account' 
      });
    }

    res.json({ success: true, data })
  } catch (error) {
    console.error('Unipile connect error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to connect account' 
    });
  }
}
