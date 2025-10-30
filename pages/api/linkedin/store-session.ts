import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdminClient } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, sessionToken, sessionExpiry } = req.body;

  if (!email || !sessionToken) {
    return res.status(400).json({ error: 'Email and session token are required' });
  }

  try {
    const supabase = getSupabaseAdminClient();
    
    // Find user with this LinkedIn email
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .contains('linkedin_accounts', [{ email }]);

    if (userError || !users || users.length === 0) {
      return res.status(404).json({ error: 'User with LinkedIn account not found' });
    }

    const user = users[0];
    const updatedLinkedInAccounts = user.linkedin_accounts.map((account: any) => {
      if (account.email === email) {
        return {
          ...account,
          sessionToken,
          sessionExpiry: sessionExpiry ? new Date(sessionExpiry).toISOString() : null,
          lastLogin: new Date().toISOString(),
          accountHealth: {
            ...account.accountHealth,
            status: 'healthy',
            lastCheck: new Date().toISOString()
          }
        };
      }
      return account;
    });

    const { error: updateError } = await supabase
      .from('users')
      .update({ linkedin_accounts: updatedLinkedInAccounts })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    res.json({ success: true, message: 'LinkedIn session stored successfully' });

  } catch (error) {
    console.error('Error storing LinkedIn session:', error);
    res.status(500).json({ error: 'Failed to store LinkedIn session' });
  }
}