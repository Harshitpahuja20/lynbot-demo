import { NextApiResponse } from 'next';
import { NextApiRequest } from 'next';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getSupabaseAdminClient } from '../../../lib/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`
    });
  }

  try {
    // Authenticate user
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.id;

    const { email, password, provider, smtpSettings, imapSettings } = req.body;

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
    const supabase = getSupabaseAdminClient();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
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

    const { error: updateError } = await supabase
      .from('users')
      .update({
      email_accounts: updatedEmailAccounts
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to save email account'
      });
    }

    console.log(`Email account saved for user: ${user.email}`);

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
