import { NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/withAuth';
import { userOperations } from '../../../lib/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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

    // Update user's onboarding status
    const user = await userOperations.update(userId, {
      onboarding_complete: true
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Generate new JWT token with updated onboarding status
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
      { expiresIn: '7d' }
    );

    console.log(`Onboarding completed for user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Onboarding completed successfully',
      user,
      token
    });

  } catch (error) {
    console.error('Error completing onboarding:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete onboarding'
    });
  }
}

export default withAuth(handler);