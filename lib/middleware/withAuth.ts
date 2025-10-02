import jwt from 'jsonwebtoken';
import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdminClient } from '../supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthenticatedRequest extends NextApiRequest {
  user?: any;
}

export type AuthenticatedHandler = (
  req: AuthenticatedRequest,
  res: NextApiResponse
) => Promise<void> | void;

export function withAuth(handler: AuthenticatedHandler) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ 
          success: false,
          error: 'Access denied. No token provided.' 
        });
      }

      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET) as any;
      } catch (jwtError) {
        console.error('JWT verification failed:', jwtError);
        return res.status(401).json({ 
          success: false,
          error: 'Invalid or expired token.' 
        });
      }
      
      const supabase = getSupabaseAdminClient();
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.id)
        .single();
      
      if (userError || !user) {
        return res.status(401).json({ 
          success: false,
          error: 'Invalid token. User not found.' 
        });
      }

      if (!user.is_active) {
        return res.status(401).json({ 
          success: false,
          error: 'Account is deactivated.' 
        });
      }

      req.user = user;
      return handler(req, res);
    } catch (error) {
      console.error('Auth middleware error:', error);
      
      return res.status(500).json({ 
        success: false,
        error: 'Server error during authentication.' 
      });
    }
  };
}

export function withAdminAuth(handler: AuthenticatedHandler) {
  return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied. Admin privileges required.' 
      });
    }
    
    return handler(req, res);
  });
}