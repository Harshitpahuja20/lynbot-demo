import { NextApiRequest, NextApiResponse } from 'next';
import { userOperations } from '../../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  try {
    // Check if admin user already exists
    const existingAdmin = await userOperations.findByEmail('admin@lyncbot.com');
    if (existingAdmin) {
      return res.json({
        success: true,
        message: 'Admin user already exists',
        user: {
          email: existingAdmin.email,
          role: existingAdmin.role
        }
      });
    }

    // Create admin user
    const hashedPassword = await userOperations.hashPassword('LyncBot123!');
    
    const adminUser = await userOperations.create({
      email: 'admin@lyncbot.com',
      password_hash: hashedPassword,
      first_name: 'Admin',
      last_name: 'User',
      company: 'Lync Bot',
      role: 'admin',
      subscription: {
        plan: 'full_access' as const,
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


    console.log('Admin user created successfully');

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        email: adminUser.email,
        role: adminUser.role,
        firstName: adminUser.first_name,
        lastName: adminUser.last_name
      }
    });

  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create admin user' 
    });
  }
}