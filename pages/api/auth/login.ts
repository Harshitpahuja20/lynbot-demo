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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email and password are required' 
      });
    }

    // Find user using admin client to bypass RLS
    const supabase = getSupabaseAdminClient();
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

      console.log(`user ${JSON.stringify(user)}`)
    
    if (findError && findError.code !== 'PGRST116') {
      console.error('Database error during login:', findError);
      return res.status(500).json({
        success: false,
        error: 'Database error occurred'
      });
    }
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'No account found with this email address. Please check your email or sign up for a new account.' 
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({ 
        success: false,
        error: 'Account is deactivated' 
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false,
        error: 'Incorrect password. Please try again or use "Forgot your password?" to reset it.' 
      });
    }

    console.log(`isValidPassword ${isValidPassword}`)

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

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
    const { password_hash, ...userResponse } = user;
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userResponse,
      redirectTo: user.role === 'admin' ? '/admin/analytics' : '/dashboard'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to login' 
    });
  }
}