import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { userOperations } from '../../../lib/database';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        error: 'Please enter a valid email address' 
      });
    }

    // Check if user already exists
    const existingUser = await userOperations.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        error: 'An account with this email already exists. Please use a different email or sign in instead.' 
      });
    }

    // Hash password
    const hashedPassword = await userOperations.hashPassword(password);
    
    // Create user with proper data structure
    const user = await userOperations.create({
      email: email.toLowerCase().trim(),
      password_hash: hashedPassword,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      company: company ? company.trim() : null,
      role: 'user',
      subscription: {
        plan: 'free',
        status: 'active'
      },
      email_verified: true,
      onboarding_complete: false,
      is_active: true,
      linkedin_accounts: [],
      email_accounts: [],
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

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        company: user.company,
        role: user.role,
        subscription: user.subscription,
        email_verified: user.email_verified,
        onboarding_complete: user.onboarding_complete
      },
      redirectTo: user.role === 'admin' ? '/admin/analytics' : '/onboarding'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      error: 'An unexpected error occurred during registration. Please try again.' 
    });
  }
}