import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { userOperations } from '../../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false,
        error: 'Email is required' 
      });
    }

    // Find user by email
    const user = await userOperations.findByEmail(email);
    if (!user) {
      // For security, don't reveal if email exists or not
      return res.json({
        success: true,
        message: 'If an account with that email exists, we have sent a password reset link.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token to user
    await userOperations.update(user.id, {
      password_reset_token: resetToken,
      password_reset_expires: resetTokenExpiry.toISOString()
    });

    // In a real application, you would send an email here
    // For now, we'll just log the reset token (for development purposes)
    console.log(`Password reset token for ${email}: ${resetToken}`);
    console.log(`Reset URL would be: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`);

    // TODO: Send email with reset link
    // await sendPasswordResetEmail(user.email, resetToken);

    res.json({
      success: true,
      message: 'If an account with that email exists, we have sent a password reset link.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to process password reset request' 
    });
  }
}