import type { NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/withAuth';
import { getSupabaseAdminClient } from '../../../lib/supabase';
import { messageOperations } from '../../../lib/database';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { to, from, subject, content, prospectId } = req.body;
    if (!to || !subject || !content) {
      return res.status(400).json({ success: false, error: 'to, subject and content are required' });
    }

    const userId = req.user.id;
    let emailAccount: any = null;
    let transportConfig: any = {
      service: 'gmail',
      auth: {
        user: process.env.NEXT_PUBLIC_SMTP_USER,
        pass: process.env.NEXT_PUBLIC_SMTP_PASS
      }
    };

    // If from email specified, get user's email account
    if (from) {
      const supabase = getSupabaseAdminClient();
      const { data: user } = await supabase
        .from('users')
        .select('email_accounts')
        .eq('id', userId)
        .single();

      if (user?.email_accounts) {
        emailAccount = user.email_accounts.find((acc: any) => acc.email === from);
        if (emailAccount) {
          const password = emailAccount.encryptedPassword || process.env.NEXT_PUBLIC_SMTP_PASS;
          console.log(`Using email account for ${emailAccount.email} ${password}`);
          // Use custom SMTP settings if provided
          if (emailAccount.smtpSettings) {
            transportConfig = {
              host: emailAccount.smtpSettings.host,
              port: emailAccount.smtpSettings.port,
              secure: emailAccount.smtpSettings.secure,
              auth: {
                user: emailAccount.email,
                pass: password
              }
            };
          } else if (emailAccount.provider === 'gmail') {
            transportConfig = {
              service: 'gmail',
              auth: {
                user: emailAccount.email,
                pass: password
              }
            };
          } else if (emailAccount.provider === 'outlook') {
            transportConfig = {
              host: 'smtp-mail.outlook.com',
              port: 587,
              secure: false,
              auth: {
                user: emailAccount.email,
                pass: password
              }
            };
          }
        }
      }
    }

    const transporter = nodemailer.createTransport(transportConfig);

    const mailOptions = {
      from: from || `"Lync Bot" <${process.env.NEXT_PUBLIC_SMTP_USER}>`,
      to,
      subject,
      text: content,
      html: (content || '').replace(/\n/g, '<br>')
    };

    const info = await transporter.sendMail(mailOptions);

    // Save to sent_emails table
    try {
      const supabase = getSupabaseAdminClient();
      await supabase.from('sent_emails').insert({
        user_id: userId,
        from_email: from || process.env.NEXT_PUBLIC_SMTP_USER,
        to_email: to,
        subject,
        content,
        message_id: info.messageId,
        status: 'sent',
        sent_at: new Date().toISOString()
      });
    } catch (dbError) {
      console.error('Error saving to database:', dbError);
    }

    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Error sending email via send-email API:', error);
    return res.status(500).json({ success: false, error: 'Failed to send email' });
  }
}

export default withAuth(handler);
