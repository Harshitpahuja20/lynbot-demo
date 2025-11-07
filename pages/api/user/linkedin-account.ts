import { NextApiResponse } from 'next';
import { NextApiRequest } from 'next';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getSupabaseAdminClient } from '../../../lib/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const NEST_API_URL = process.env.NEST_API_URL || 'http://localhost:4000';

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

    const { email, password, sessionToken, useUnipile, unipile_account_id } = req.body;

    // Handle Unipile integration
    if (useUnipile) {
      if (!unipile_account_id) {
        return res.status(400).json({
          success: false,
          error: 'Unipile account ID required'
        });
      }

      const supabase = getSupabaseAdminClient();
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      const updatedLinkedInAccounts = [...(user.linkedin_accounts || [])];
      const existingIndex = updatedLinkedInAccounts.findIndex(
        (acc: any) => acc.unipile_account_id === unipile_account_id
      );

      const accountData = {
        unipile_account_id,
        provider: 'unipile',
        isActive: true,
        lastLogin: new Date().toISOString(),
        accountHealth: {
          status: 'healthy',
          lastCheck: new Date().toISOString(),
          restrictions: []
        }
      };

      if (existingIndex >= 0) {
        updatedLinkedInAccounts[existingIndex] = {
          ...updatedLinkedInAccounts[existingIndex],
          ...accountData
        };
      } else {
        updatedLinkedInAccounts.push(accountData);
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({ linkedin_accounts: updatedLinkedInAccounts })
        .eq('id', userId);

      if (updateError) {
        throw new Error('Failed to save LinkedIn account');
      }

      return res.json({
        success: true,
        message: 'LinkedIn account connected via Unipile'
      });
    }

    // Legacy: Handle email/password authentication
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
    
    // Store session token as-is for LinkedIn automation
    const rawSessionToken = sessionToken || null;

    // Find user and update LinkedIn account
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
        isActive: true,
        sessionToken: rawSessionToken,
        lastLogin: new Date().toISOString()
      };
    } else {
      // Add new LinkedIn account
      updatedLinkedInAccounts.push({
        email: email,
        encryptedPassword: encryptedPassword,
        isActive: true,
        sessionToken: rawSessionToken,
        lastLogin: new Date().toISOString(),
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

    const { error: updateError } = await supabase
      .from('users')
      .update({
      linkedin_accounts: updatedLinkedInAccounts
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to save LinkedIn account'
      });
    }

    console.log(`LinkedIn account saved for user: ${user.email}`);

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

export default handler;
