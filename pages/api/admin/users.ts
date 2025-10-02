import { NextApiResponse } from 'next';
import { withAdminAuth, AuthenticatedRequest } from '../../../lib/middleware/withAuth';
import { userOperations } from '../../../lib/database';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {

  switch (req.method) {
    case 'GET':
      return handleGetUsers(req, res);
    case 'POST':
      return handleCreateUser(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({
        success: false,
        error: `Method ${req.method} not allowed`
      });
  }
}

async function handleGetUsers(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    // Verify user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin privileges required.'
      });
    }

    const { page = 1, limit = 50, search, role, status } = req.query;
    
    // Build query
    const options: any = { page: Number(page), limit: Number(limit) };
    
    if (search) {
      options.search = search as string;
    }
    
    if (role && role !== 'all') {
      options.role = role as string;
    }
    
    if (status && status !== 'all') {
      options.status = status as string;
    }

    // Get users with pagination
    try {
      const { users, total } = await userOperations.findAll(options);

      res.json({
        success: true,
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      res.json({
        success: true,
        users: [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: 0,
          pages: 0
        }
      });
    }

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch users' 
    });
  }
}

async function handleCreateUser(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const { email, password, first_name, last_name, company, role = 'user' } = req.body;

    // Validation
    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ 
        success: false,
        error: 'Email, password, first name, and last name are required' 
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ 
        success: false,
        error: 'Password must be at least 8 characters long' 
      });
    }

    // Check if user already exists
    const existingUser = await userOperations.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        error: 'User with this email already exists' 
      });
    }

    // Create new user
    const hashedPassword = await userOperations.hashPassword(password);
    
    const user = await userOperations.create({
      email: email.toLowerCase(),
      password_hash: hashedPassword,
      first_name,
      last_name,
      company,
      role,
      email_accounts: [],
      email_verified: true,
      onboarding_complete: true,
      is_active: true,
      email_accounts: [],
      subscription: { plan: 'free', status: 'inactive' },
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
          profileViews: { enabled: false },
          emailSending: { enabled: false }
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

    console.log(`New user created by admin: ${email}`);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create user' 
    });
  }
}

export default withAdminAuth(handler);