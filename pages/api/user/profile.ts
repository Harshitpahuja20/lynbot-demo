import { NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/withAuth';
import { getSupabaseAdminClient } from '../../../lib/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGetProfile(req, res);
    case 'PUT':
      return handleUpdateProfile(req, res);
    default:
      res.setHeader('Allow', ['GET', 'PUT']);
      return res.status(405).json({
        success: false,
        error: `Method ${method} not allowed`
      });
  }
}

async function handleGetProfile(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const supabase = getSupabaseAdminClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    // Create safe user object for response
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

    res.json({
      success: true,
      user: safeUser
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch user profile' 
    });
  }
}

async function handleUpdateProfile(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { first_name, last_name, company } = req.body;
    const userId = req.user.id;

    if (!first_name || !last_name) {
      return res.status(400).json({
        success: false,
        error: 'First name and last name are required'
      });
    }

    const supabase = getSupabaseAdminClient();
    const { data: user, error } = await supabase
      .from('users')
      .update({
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        company: company ? company.trim() : null
      })
      .eq('id', userId)
      .select()
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        error: 'User not found or failed to update'
      });
    }

    // Generate new JWT token with updated user info
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        onboardingComplete: user.onboarding_complete,
        emailVerified: user.email_verified,
        subscription: user.subscription
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log(`Profile updated for user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user,
      token
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
}

export default withAuth(handler);