import { NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/withAuth';
import { userOperations } from '../../../lib/database';

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
    const user = await userOperations.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    // Create safe user object for response
    const safeUser = {
      ...user,
      password_hash: undefined, // Never send password hash
      linkedin_accounts: user.linkedin_accounts?.map((account: any) => ({
        ...account,
        encryptedPassword: undefined, // Never send encrypted password
        password: account.encryptedPassword ? '********' : '',
        hasPassword: !!account.encryptedPassword
      })) || [],
      email_accounts: user.email_accounts?.map((account: any) => ({
        ...account,
        encryptedPassword: undefined // Never send encrypted password
      })) || [],
      api_keys: {
        ...user.api_keys,
        encryptedOpenAI: user.api_keys?.encryptedOpenAI ? '********' : undefined,
        encryptedPerplexity: user.api_keys?.encryptedPerplexity ? '********' : undefined,
        encryptedClaude: user.api_keys?.encryptedClaude ? '********' : undefined
      }
    }

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

    const user = await userOperations.update(userId, {
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      company: company ? company.trim() : undefined
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
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