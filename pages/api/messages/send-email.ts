import type { NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/withAuth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { to, from, subject, content } = req.body;
    if (!to || !subject || !content) {
      return res.status(400).json({ success: false, error: 'to, subject and content are required' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.NEXT_PUBLIC_SMTP_USER,
        pass: process.env.NEXT_PUBLIC_SMTP_PASS
      }
    });

    const mailOptions = {
      from: from || `"Lync Bot" <${process.env.NEXT_PUBLIC_SMTP_USER}>`,
      to,
      subject,
      text: content,
      html: (content || '').replace(/\n/g, '<br>')
    };

    const info = await transporter.sendMail(mailOptions);

    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Error sending email via send-email API:', error);
    return res.status(500).json({ success: false, error: 'Failed to send email' });
  }
}

export default withAuth(handler);
