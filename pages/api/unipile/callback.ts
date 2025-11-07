import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { getSupabaseAdminClient } from '../../../lib/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.id;

    const { account_id, provider_status } = req.body;

    if (!account_id) {
      return res.status(400).json({ success: false, error: 'Account ID required' });
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
      (acc: any) => acc.unipile_account_id === account_id
    );

    const accountData = {
      unipile_account_id: account_id,
      provider_status: provider_status || 'connected',
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

    res.json({ success: true, message: 'LinkedIn account connected successfully' });
  } catch (error) {
    console.error('Unipile callback error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to save account' 
    });
  }
}
