import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { getSupabaseAdminClient } from '../../../lib/supabase';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, firstName, lastName, company } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
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
    const supabase = getSupabaseAdminClient();
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email.toLowerCase())
      .single();
    
    if (findError && findError.code !== 'PGRST116') {
      console.error('Error checking existing user:', findError);
      return res.status(500).json({
        success: false,
        error: 'Database error occurred'
      });
    }
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        error: 'User with this email already exists' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const { data: user, error: createError } = await supabase
      .from('users')
      .insert([{
      email: email.toLowerCase(),
      password_hash: hashedPassword,
      first_name: firstName,
      last_name: lastName,
      company,
      role: 'user',
      subscription: {
        plan: 'free',
        status: 'inactive'
      },
      email_verified: true,
      onboarding_complete: false,
      is_active: true,
      email_accounts: [],
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
      }])
      .select()
      .single();

    if (createError) {
      console.error('Error creating user:', createError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create user account'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        onboardingComplete: user.onboarding_complete,
        emailVerified: user.email_verified,
        subscription: user.subscription
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Remove password from response
    const userResponse = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      company: user.company,
      role: user.role,
      subscription: user.subscription,
      email_verified: user.email_verified,
      onboarding_complete: user.onboarding_complete
    };
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: userResponse,
      redirectTo: user.role === 'admin' ? '/admin/users' : '/dashboard'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to register user' 
    });
  }
}