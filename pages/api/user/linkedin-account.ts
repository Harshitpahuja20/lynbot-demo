import { NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/withAuth';
import { userOperations } from '../../../lib/database';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`
    });
  }

  try {
    const { email, password } = req.body;
    const userId = req.user.id;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'LinkedIn email and password are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid email address'
      });
    }

    // Encrypt the password
    const salt = await bcrypt.genSalt(12);
    const encryptedPassword = await bcrypt.hash(password, salt);

    // Find user and update LinkedIn account
    const user = await userOperations.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if LinkedIn account with this email already exists
    const existingAccountIndex = user.linkedin_accounts.findIndex(
      (account: any) => account.email === email
    );

    const updatedLinkedInAccounts = [...user.linkedin_accounts];

    if (existingAccountIndex >= 0) {
      // Update existing account
      updatedLinkedInAccounts[existingAccountIndex] = {
        ...updatedLinkedInAccounts[existingAccountIndex],
        encryptedPassword: encryptedPassword,
        isActive: true
      };
    } else {
      // Add new LinkedIn account
      updatedLinkedInAccounts.push({
        email: email,
        encryptedPassword: encryptedPassword,
        isActive: true,
        accountHealth: {
          status: 'healthy',
          lastCheck: new Date().toISOString(),
          restrictions: []
        },
        dailyLimits: {
          connections: 50,
          messages: 25,
          profileViews: 100
        },
        dailyUsage: {
          connections: 0,
          messages: 0,
          profileViews: 0,
          lastReset: new Date().toISOString()
        }
      });
    }

    await userOperations.update(userId, {
      linkedin_accounts: updatedLinkedInAccounts
    });

    console.log(`LinkedIn account saved for user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'LinkedIn account saved successfully'
    });

  } catch (error) {
    console.error('Error saving LinkedIn account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save LinkedIn account'
    });
  }
}

export default withAuth(handler);