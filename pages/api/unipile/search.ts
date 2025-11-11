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

    jwt.verify(token, JWT_SECRET);
    const { account_id, keywords, location, limit, api, category, salesNavigatorCriteria } = req.body;

    if (!account_id) {
      return res.status(400).json({ success: false, error: 'Account ID required' });
    }
    console.log(NEST_API_URL)
    const response = await fetch(`${NEST_API_URL}/unipile/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_id, keywords, location, limit, api, category, salesNavigatorCriteria })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json({ 
        success: false, 
        error: data.message || 'Failed to search LinkedIn' 
      });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('LinkedIn search error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to search LinkedIn' 
    });
  }
}
