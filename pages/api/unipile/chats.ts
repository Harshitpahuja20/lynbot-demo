import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const NEST_API_URL = process.env.NEXT_PUBLIC_NEST_API_URL || 'http://localhost:4000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    jwt.verify(token, JWT_SECRET);
    const { account_id } = req.query;

    if (!account_id) {
      return res.status(400).json({ success: false, error: 'Account ID required' });
    }

    const response = await fetch(`${NEST_API_URL}/unipile/chats?account_id=${account_id}`, {
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json({ 
        success: false, 
        error: data.message || 'Failed to fetch chats' 
      });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch chats' 
    });
  }
}
