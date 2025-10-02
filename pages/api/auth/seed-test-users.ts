import { NextApiRequest, NextApiResponse } from 'next';
import { userOperations } from '../../../lib/database';

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

    const createdUsers = [];

    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await userOperations.findByEmail(userData.email);
      if (existingUser) {
        console.log(`User ${userData.email} already exists, skipping...`);
        continue;
      }

      // Create new user
      const hashedPassword = await userOperations.hashPassword(userData.password);
      
      const user = await userOperations.create({
        ...userData,
        password_hash: hashedPassword,
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
      });

      createdUsers.push({
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
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