import nodemailer from 'nodemailer';
import { ImapFlow } from 'imapflow';
import bcrypt from 'bcryptjs';

interface EmailAccount {
  email: string;
  encryptedPassword?: string;
  provider: 'gmail' | 'outlook' | 'smtp';
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

interface EmailMessage {
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

interface SendEmailOptions {
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
  private async decryptPassword(encryptedPassword: string): Promise<string> {
    // In a real implementation, you would decrypt the password
    // For now, we'll assume it's already decrypted for demo purposes
    return encryptedPassword;
  }

  private getProviderSettings(provider: string) {
    switch (provider) {
      case 'gmail':
        return {
          smtp: { host: 'smtp.gmail.com', port: 587, secure: false },
          imap: { host: 'imap.gmail.com', port: 993, secure: true }
        };
      case 'outlook':
        return {
          smtp: { host: 'smtp-mail.outlook.com', port: 587, secure: false },
          imap: { host: 'outlook.office365.com', port: 993, secure: true }
        };
      default:
        return null;
    }
  }

  private async createTransporter(emailAccount: EmailAccount) {
    const password = emailAccount.encryptedPassword 
      ? await this.decryptPassword(emailAccount.encryptedPassword)
      : '';

    let config;
    
    if (emailAccount.provider === 'smtp' && emailAccount.smtpSettings) {
      config = {
        host: emailAccount.smtpSettings.host,
        port: emailAccount.smtpSettings.port,
        secure: emailAccount.smtpSettings.secure,
        auth: {
          user: emailAccount.email,
          pass: password
        }
      };
    } else {
      const providerSettings = this.getProviderSettings(emailAccount.provider);
      if (!providerSettings) {
        throw new Error(`Unsupported email provider: ${emailAccount.provider}`);
      }
      
      config = {
        ...providerSettings.smtp,
        auth: {
          user: emailAccount.email,
          pass: password
        }
      };
    }

    return nodemailer.createTransporter(config);
  }

  private async createImapClient(emailAccount: EmailAccount) {
    const password = emailAccount.encryptedPassword 
      ? await this.decryptPassword(emailAccount.encryptedPassword)
      : '';

    let config;
    
    if (emailAccount.provider === 'smtp' && emailAccount.imapSettings) {
      config = {
        host: emailAccount.imapSettings.host,
        port: emailAccount.imapSettings.port,
        secure: emailAccount.imapSettings.secure,
        auth: {
          user: emailAccount.email,
          pass: password
        }
      };
    } else {
      const providerSettings = this.getProviderSettings(emailAccount.provider);
      if (!providerSettings) {
        throw new Error(`Unsupported email provider: ${emailAccount.provider}`);
      }
      
      config = {
        ...providerSettings.imap,
        auth: {
          user: emailAccount.email,
          pass: password
        }
      };
    }

    return new ImapFlow(config);
  }

  async sendEmail(emailAccount: EmailAccount, options: SendEmailOptions): Promise<string> {
    try {
      const transporter = await this.createTransporter(emailAccount);
      
      const mailOptions = {
        from: options.from || emailAccount.email,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        cc: options.cc?.join(', '),
        bcc: options.bcc?.join(', '),
        subject: options.subject,
        text: options.text,
        html: options.html,
        inReplyTo: options.inReplyTo,
        references: options.references?.join(' '),
        attachments: options.attachments
      };

      const result = await transporter.sendMail(mailOptions);
      return result.messageId;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async fetchEmails(emailAccount: EmailAccount, options: {
    since?: Date;
    limit?: number;
    folder?: string;
  } = {}): Promise<EmailMessage[]> {
    let client: any = null;
    
    try {
      client = await this.createImapClient(emailAccount);
      await client.connect();

      const folder = options.folder || 'INBOX';
      const lock = await client.getMailboxLock(folder);
      
      try {
        const since = options.since || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
        
        const messages = client.fetch(
          { since },
          {
            envelope: true,
            bodyStructure: true,
            source: true
          },
          { limit: options.limit || 50 }
        );

        const emailMessages: EmailMessage[] = [];

        for await (const message of messages) {
          try {
            const envelope = message.envelope;
            
            // Get text content
            let textContent = '';
            let htmlContent = '';
            
            if (message.source) {
              const sourceStr = message.source.toString();
              textContent = this.extractTextFromEmail(sourceStr);
              htmlContent = this.extractHtmlFromEmail(sourceStr);
            }

            const emailMessage: EmailMessage = {
              messageId: envelope.messageId || `${message.uid}@${emailAccount.email}`,
              threadId: this.extractThreadId(envelope),
              from: envelope.from?.[0]?.address || '',
              to: envelope.to?.map(addr => addr.address) || [],
              cc: envelope.cc?.map(addr => addr.address),
              bcc: envelope.bcc?.map(addr => addr.address),
              subject: envelope.subject || '',
              content: textContent || htmlContent || '',
              htmlContent: htmlContent,
              date: envelope.date || new Date(),
              inReplyTo: envelope.inReplyTo,
              references: envelope.references
            };

            emailMessages.push(emailMessage);
          } catch (parseError) {
            console.error('Error parsing email message:', parseError);
          }
        }

        return emailMessages;
      } finally {
        lock.release();
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
      throw error;
    } finally {
      if (client) {
        await client.logout();
      }
    }
  }

  private extractTextFromEmail(source: string): string {
    // Simple text extraction - in production, use a proper email parser
    const lines = source.split('\n');
    let inBody = false;
    let textContent = '';
    
    for (const line of lines) {
      if (line.trim() === '') {
        inBody = true;
        continue;
      }
      
      if (inBody && !line.startsWith('Content-') && !line.startsWith('--')) {
        textContent += line + '\n';
      }
    }
    
    return textContent.trim();
  }

  private extractHtmlFromEmail(source: string): string {
    // Simple HTML extraction - in production, use a proper email parser
    const htmlMatch = source.match(/<html[\s\S]*?<\/html>/i);
    return htmlMatch ? htmlMatch[0] : '';
  }

  private extractThreadId(envelope: any): string {
    // Try to extract thread ID from various headers
    return envelope.inReplyTo || envelope.messageId || '';
  }

  async testConnection(emailAccount: EmailAccount): Promise<boolean> {
    try {
      const transporter = await this.createTransporter(emailAccount);
      await transporter.verify();
      return true;
    } catch (error) {
      console.error('Email connection test failed:', error);
      return false;
    }
  }
}

export default EmailService;