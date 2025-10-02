import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { getSupabaseAdminClient } from '../../../lib/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get token from headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as any;
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    if (req.method === 'GET') {
      // Get user profile
      const supabase = getSupabaseAdminClient();
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.id)
        .single();

      if (error || !user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Return safe user data
      const safeUser = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        company: user.company,
        role: user.role,
        subscription: user.subscription || { plan: 'free', status: 'inactive' },
        linkedin_accounts: (user.linkedin_accounts || []).map((account: any) => ({
          email: account.email,
          isActive: account.isActive || false,
          hasPassword: !!account.encryptedPassword
        })),
        email_accounts: (user.email_accounts || []).map((account: any) => ({
          email: account.email,
          provider: account.provider,
          isActive: account.isActive || false
        })),
        api_keys: {
          openai: user.api_keys?.encryptedOpenAI ? '********' : undefined,
          perplexity: user.api_keys?.encryptedPerplexity ? '********' : undefined,
          claude: user.api_keys?.encryptedClaude ? '********' : undefined
        },
        settings: user.settings || {
          timezone: 'UTC',
          notifications: {
            email: true,
            webhook: false
          }
        }
      };

      return res.json({
        success: true,
        user: safeUser
      });

    } else if (req.method === 'PUT') {
      // Update user profile
      const { first_name, last_name, company } = req.body;

      if (!first_name || !last_name) {
        return res.status(400).json({
          success: false,
          error: 'First name and last name are required'
        });
      }

      const supabase = getSupabaseAdminClient();
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({
          first_name: first_name.trim(),
          last_name: last_name.trim(),
          company: company ? company.trim() : null
        })
        .eq('id', decoded.id)
        .select()
        .single();

      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to update profile'
        });
      }

      // Generate new JWT token
      const newToken = jwt.sign(
        { 
          id: updatedUser.id, 
          email: updatedUser.email, 
          role: updatedUser.role,
          firstName: updatedUser.first_name,
          lastName: updatedUser.last_name,
          onboardingComplete: updatedUser.onboarding_complete,
          emailVerified: updatedUser.email_verified,
          subscription: updatedUser.subscription
        },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      return res.json({
        success: true,
        message: 'Profile updated successfully',
        user: updatedUser,
        token: newToken
      });

    } else {
      res.setHeader('Allow', ['GET', 'PUT']);
      return res.status(405).json({
        success: false,
        error: `Method ${req.method} not allowed`
      });
    }

  } catch (error) {
    console.error('Profile API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}