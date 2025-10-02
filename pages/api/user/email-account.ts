import { NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/withAuth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`
    });
  }

  try {
    const { email, password, provider, smtpSettings, imapSettings } = req.body;
    const userId = req.user.id;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email address is required'
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

    // Validate provider
    if (!['gmail', 'outlook', 'smtp'].includes(provider)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email provider'
      });
    }

    // Encrypt the password if provided
    let encryptedPassword;
    if (password) {
      const salt = await bcrypt.genSalt(12);
      encryptedPassword = await bcrypt.hash(password, salt);
    }

    // Find user and update email accounts
    const user = await userOperations.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if email account with this email already exists
    const existingAccountIndex = (user.email_accounts || []).findIndex(
      (account: any) => account.email === email
    );

    const updatedEmailAccounts = [...(user.email_accounts || [])];

    if (existingAccountIndex >= 0) {
      // Update existing account
      updatedEmailAccounts[existingAccountIndex] = {
        ...updatedEmailAccounts[existingAccountIndex],
        ...(encryptedPassword && { encryptedPassword }),
        provider,
        ...(smtpSettings && { smtpSettings }),
        ...(imapSettings && { imapSettings }),
        isActive: true,
        lastUsed: new Date().toISOString()
      };
    } else {
      // Add new email account
      updatedEmailAccounts.push({
        email: email,
        encryptedPassword: encryptedPassword,
        provider: provider,
        ...(smtpSettings && { smtpSettings }),
        ...(imapSettings && { imapSettings }),
        isActive: true,
        lastUsed: new Date().toISOString(),
        lastSyncAt: new Date().toISOString(),
        dailyLimits: {
          emails: 50
        },
        dailyUsage: {
          emails: 0,
          lastReset: new Date().toISOString()
        },
        accountHealth: {
          status: 'healthy',
          lastCheck: new Date().toISOString(),
          restrictions: []
        }
      });
    }

    await userOperations.update(userId, {
      email_accounts: updatedEmailAccounts
    });

    console.log(`Email account saved for user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Email account saved successfully'
    });

  } catch (error) {
    console.error('Error saving email account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save email account'
    });
  }
}

export default withAuth(handler);