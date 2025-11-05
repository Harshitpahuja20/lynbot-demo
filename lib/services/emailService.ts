export interface EmailAccount {
  email: string;
  encryptedPassword?: string;
  provider: "gmail" | "outlook" | "smtp";
  smtpSettings?: {
    host: string;
    port: number;
    secure: boolean;
  };
  imapSettings?: {
    host: string;
    port: number;
    secure: boolean;
  };
  isActive: boolean;
  lastSyncAt?: string;
}

export interface EmailMessage {
  messageId: string;
  threadId?: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  content: string;
  htmlContent?: string;
  date: Date;
  inReplyTo?: string;
  references?: string[];
  attachments?: Array<{
    filename: string;
    contentType: string;
    size: number;
    content: Buffer;
  }>;
}

export interface SendEmailOptions {
  to: string | string[];
  from: string;
  subject: string;
  text?: string;
  html?: string;
  cc?: string[];
  bcc?: string[];
  inReplyTo?: string;
  references?: string[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

class EmailService {
  async sendEmail(
    emailAccount: EmailAccount,
    options: SendEmailOptions
  ): Promise<string> {
    const nodemailer = require('nodemailer');
    let transportConfig: any;

    console.log(`emailAccount ${JSON.stringify(emailAccount)}`)

    // Configure based on provider
    if (emailAccount.smtpSettings) {
      // Custom SMTP
      transportConfig = {
        host: emailAccount.smtpSettings.host,
        port: emailAccount.smtpSettings.port,
        secure: emailAccount.smtpSettings.secure,
        auth: {
          user: emailAccount.email,
          pass: emailAccount.encryptedPassword
        }
      };
    } else if (emailAccount.provider === 'gmail') {
      // Gmail
      transportConfig = {
        service: 'gmail',
        auth: {
          user: emailAccount.email,
          pass: emailAccount.encryptedPassword
        }
      };
    } else if (emailAccount.provider === 'outlook') {
      // Outlook
      transportConfig = {
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        auth: {
          user: emailAccount.email,
          pass: emailAccount.encryptedPassword
        }
      };
    }

    const transporter = nodemailer.createTransport(transportConfig);

    const mailOptions = {
      from: options.from || emailAccount.email,
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      cc: options.cc?.join(", "),
      bcc: options.bcc?.join(", "),
      subject: options.subject,
      text: options.text,
      html: options.html,
      inReplyTo: options.inReplyTo,
      references: options.references?.join(" "),
      attachments: options.attachments,
    };

    const result = await transporter.sendMail(mailOptions);
    return result.messageId;
  }

  async testConnection(emailAccount: EmailAccount): Promise<boolean> {
    try {
      const nodemailer = require('nodemailer');
      let transportConfig: any;

      if (emailAccount.smtpSettings) {
        transportConfig = {
          host: emailAccount.smtpSettings.host,
          port: emailAccount.smtpSettings.port,
          secure: emailAccount.smtpSettings.secure,
          auth: {
            user: emailAccount.email,
            pass: emailAccount.encryptedPassword
          }
        };
      } else if (emailAccount.provider === 'gmail') {
        transportConfig = {
          service: 'gmail',
          auth: {
            user: emailAccount.email,
            pass: emailAccount.encryptedPassword
          }
        };
      } else if (emailAccount.provider === 'outlook') {
        transportConfig = {
          host: 'smtp-mail.outlook.com',
          port: 587,
          secure: false,
          auth: {
            user: emailAccount.email,
            pass: emailAccount.encryptedPassword
          }
        };
      }

      const transporter = nodemailer.createTransport(transportConfig);
      await transporter.verify();
      return true;
    } catch (error) {
      console.error("Email connection test failed:", error);
      return false;
    }
  }
}

export default EmailService;
