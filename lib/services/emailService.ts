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

// Mock transporter that simulates nodemailer without file system operations
class MockTransporter {
  async sendMail(options: any): Promise<{ messageId: string }> {
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Return a mock message ID
    return {
      messageId: `mock-${Date.now()}@${options.from.split('@')[1] || 'example.com'}`
    };
  }

  async verify(): Promise<boolean> {
    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 50));
    return true;
  }
}

// Mock IMAP client that simulates imapflow without file system operations
class MockImapClient {
  private connected = false;

  async connect(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    this.connected = true;
  }

  async getMailboxLock(folder: string): Promise<{ release: () => void }> {
    if (!this.connected) {
      throw new Error('Not connected to IMAP server');
    }
    
    return {
      release: () => {
        // Mock release function
      }
    };
  }

  async *fetch(query: any, options: any, limits?: any): AsyncGenerator<any> {
    // Mock fetch that yields no messages to prevent file system operations
    // In a real implementation, this would fetch actual emails
    return;
  }

  async logout(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 50));
    this.connected = false;
  }
}

class EmailService {
  private async decryptPassword(encryptedPassword: string): Promise<string> {
    // Mock decryption - in production, implement proper decryption
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

  private async createTransporter(emailAccount: EmailAccount): Promise<MockTransporter> {
    // Return mock transporter to prevent file system operations
    return new MockTransporter();
  }

  private async createImapClient(emailAccount: EmailAccount): Promise<MockImapClient> {
    // Return mock IMAP client to prevent file system operations
    return new MockImapClient();
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
    try {
      // Return empty array for mock implementation
      // In production, this would fetch real emails
      console.log(`Mock: Would fetch emails from ${emailAccount.email} since ${options.since?.toISOString()}`);
      return [];
    } catch (error) {
      console.error('Error fetching emails:', error);
      throw error;
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