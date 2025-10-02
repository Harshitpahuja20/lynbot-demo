import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseAdminClient } from '../../../lib/supabase';
import bcrypt from 'bcryptjs';

interface TestUserData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  company: string;
  role: 'user' | 'admin' | 'premium';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  try {
    const testUsers: TestUserData[] = [
      {
        email: 'sean@sitehues.com',
        password: 'password123',
        first_name: 'Sean',
        last_name: 'Developer',
        company: 'Sitehues Media Inc',
        role: 'user' as const
      },
      {
        email: 'test@example.com',
        password: 'test123456',
        first_name: 'Test',
        last_name: 'User',
        company: 'Test Company',
        role: 'user' as const
      }
    ];

    // Use admin client to bypass RLS
    const adminSupabase = getSupabaseAdminClient();
    const createdUsers = [];

    for (const userData of testUsers) {
      // Check if user already exists
      const { data: existingUser, error: findError } = await adminSupabase
        .from('users')
        .select('email')
        .eq('email', userData.email.toLowerCase())
        .single();
      
      if (findError && findError.code !== 'PGRST116') {
        console.error(`Error checking for existing user ${userData.email}:`, findError);
        continue;
      }
      
      if (existingUser) {
        console.log(`User ${userData.email} already exists, skipping...`);
        continue;
      }

      // Create new user
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      const { data: user, error: createError } = await adminSupabase
        .from('users')
        .insert([{
        email: userData.email.toLowerCase(),
        password_hash: hashedPassword,
        first_name: userData.first_name,
        last_name: userData.last_name,
        company: userData.company,
        role: userData.role,
        subscription: {
          plan: 'free' as const,
          status: 'active'
        },
        email_verified: true,
        onboarding_complete: true,
        is_active: true,
        linkedin_accounts: [],
        api_keys: {},
        settings: {
          timezone: 'UTC',
          workingHours: { start: 9, end: 18 },
          workingDays: [1, 2, 3, 4, 5],
          automation: {
            enabled: false,
            connectionRequests: { enabled: false },
            welcomeMessages: { enabled: false },
            followUpMessages: { enabled: false },
            profileViews: { enabled: false }
          },
          notifications: {
            email: true,
            webhook: false
          }
        },
        usage: {
          totalConnections: 0,
          totalMessages: 0,
          totalCampaigns: 0,
          totalProspects: 0
        }
        }])
        .select()
        .single();

      if (createError) {
        console.error(`Error creating user ${userData.email}:`, createError);
        continue;
      }

      createdUsers.push({
        email: user?.email || userData.email,
        firstName: user?.first_name || userData.first_name,
        lastName: user?.last_name || userData.last_name
      });

      console.log(`Created test user: ${userData.email}`);
    }

    res.json({
      success: true,
      message: `Created ${createdUsers.length} test users`,
      users: createdUsers
    });

  } catch (error) {
    console.error('Error creating test users:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create test users' 
    });
  }
}