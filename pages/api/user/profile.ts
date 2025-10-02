import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { getSupabaseAdminClient } from '../../../lib/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Simple auth check without middleware
async function authenticateUser(req: NextApiRequest): Promise<any> {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    throw new Error('No token provided');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Get user from database
    const supabase = getSupabaseAdminClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.id)
      .single();
    
    if (error || !user) {
      throw new Error('User not found');
    }

    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    return user;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Authenticate user
    const user = await authenticateUser(req);

    if (req.method === 'GET') {
      // Return user profile data
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
          isActive: account.isActive,
          hasPassword: !!account.encryptedPassword
        })),
        email_accounts: (user.email_accounts || []).map((account: any) => ({
          email: account.email,
          provider: account.provider,
          isActive: account.isActive
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
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to update profile'
        });
      }

      // Generate new JWT token
      const token = jwt.sign(
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
        token
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
    
    if (error instanceof Error && error.message.includes('token')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}