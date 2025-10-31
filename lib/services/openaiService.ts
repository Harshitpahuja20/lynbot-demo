interface ProspectData {
  name: string;
  title?: string;
  company?: string;
  industry?: string;
  location?: string;
}

interface CampaignData {
  tone?: string;
  description?: string;
  useAI?: boolean;
  customPrompt?: string;
}

interface MessageGenerationOptions {
  prospectData: ProspectData;
  messageType: 'connection' | 'welcome' | 'follow_up' | 'reply' | 'conversation_starter';
  campaignData: CampaignData;
  followUpNumber?: number;
  context?: any;
}

class MessageGenerator {
  private messageTemplates = {
    connection: {
      professional: `Hi {name}, I noticed your impressive experience in {industry} at {company}. Your background caught my attention and I'd love to connect to explore potential synergies in {field}.`,
      casual: `Hey {name}! Saw your profile and your work at {company} looks really interesting. Would love to connect!`,
      friendly: `Hi {name}, I came across your profile and was impressed by your background in {industry}. I'd enjoy connecting with fellow professionals and sharing insights about {field}.`,
      direct: `Hi {name}, I'm reaching out to professionals in {industry} to expand my network. Your experience at {company} caught my attention.`
    },
    welcome: {
      professional: `Thank you for connecting, {name}! I'm excited to be part of your network. I'd love to learn more about your work at {company} and share insights about {industry}.`,
      casual: `Thanks for connecting, {name}! Looking forward to staying in touch and seeing what you're up to at {company}.`,
      friendly: `Hi {name}, thanks for accepting my connection request! I'm always interested in connecting with talented professionals like yourself.`,
      direct: `Thanks for connecting, {name}. I'd be interested in discussing potential collaboration opportunities in {industry}.`
    },
    conversation_starter: {
      professional: `Hi {name}, I was reviewing profiles of {industry} professionals and your experience at {company} really stood out. I'd be interested in discussing {field} trends and potential collaboration opportunities.`,
      casual: `Hey {name}! Your work at {company} caught my eye. Would love to chat about what you're working on in {industry}!`,
      friendly: `Hi {name}, I've been connecting with talented {industry} professionals and your background at {company} is impressive. I'd enjoy exchanging insights about {field}.`,
      direct: `Hi {name}, I'm reaching out to discuss potential business opportunities in {industry}. Your role at {company} suggests you might be interested in {field} solutions.`
    },
    follow_up: {
      professional: `Hi {name}, I hope you're doing well! I wanted to follow up on our connection and see if there might be opportunities for us to collaborate or share insights about {industry}.`,
      casual: `Hey {name}! Hope things are going great at {company}. Just wanted to check in and see how you're doing.`,
      friendly: `Hi {name}, I hope you're having a great week! I've been following some of the developments in {industry} and thought you might find them interesting.`,
      direct: `Hi {name}, I wanted to reach out about potential opportunities for collaboration between our organizations.`
    }
  };

  generateTemplateMessage(messageType: keyof typeof this.messageTemplates, tone: string, prospectData: ProspectData): string {
    const templates = this.messageTemplates[messageType];
    const template = templates[tone as keyof typeof templates] || templates.professional;
    
    return template
      .replace(/{name}/g, prospectData.name || 'there')
      .replace(/{company}/g, prospectData.company || 'your company')
      .replace(/{title}/g, prospectData.title || 'your role')
      .replace(/{industry}/g, prospectData.industry || 'your industry')
      .replace(/{location}/g, prospectData.location || 'your area')
      .replace(/{field}/g, prospectData.industry || 'this field');
  }

  generateEmailSubject(messageType: string, prospectData: ProspectData, tone: string): string {
    const subjectTemplates = {
      cold_email: {
        professional: `Partnership opportunity with ${prospectData.company || 'your company'}`,
        casual: `Quick question about ${prospectData.industry || 'your work'}`,
        friendly: `Connecting with fellow ${prospectData.industry || 'professional'} professionals`,
        direct: `Business opportunity for ${prospectData.name}`
      },
      email_follow_up: {
        professional: `Following up on our previous conversation`,
        casual: `Checking in - ${prospectData.name}`,
        friendly: `Hope you're doing well, ${prospectData.name}`,
        direct: `Next steps for our discussion`
      }
    };

    const templates = subjectTemplates[messageType as keyof typeof subjectTemplates];
    if (!templates) return `Message for ${prospectData.name}`;
    
    const template = templates[tone as keyof typeof templates] || templates.professional;
    return template;
  }

  generateEmailContent(messageType: string, prospectData: ProspectData, tone: string): string {
    const emailTemplates = {
      cold_email: {
        professional: `Hi ${prospectData.name},\n\nI hope this email finds you well. I came across your profile and was impressed by your work at ${prospectData.company || 'your company'} in the ${prospectData.industry || 'industry'} space.\n\nI'd love to explore potential collaboration opportunities that could benefit both our organizations. Would you be open to a brief conversation this week?\n\nBest regards`,
        casual: `Hey ${prospectData.name}!\n\nSaw your work at ${prospectData.company || 'your company'} and thought it was really cool. Would love to chat about some ideas I have that might interest you.\n\nFree for a quick call this week?\n\nCheers`,
        friendly: `Hi ${prospectData.name},\n\nI've been following the great work happening at ${prospectData.company || 'your company'} and wanted to reach out. Your background in ${prospectData.industry || 'the industry'} caught my attention.\n\nI'd enjoy connecting and sharing some insights that might be valuable for your team. Are you available for a brief chat?\n\nLooking forward to hearing from you`,
        direct: `${prospectData.name},\n\nI have a business proposition that could significantly impact ${prospectData.company || 'your company'}\'s growth in ${prospectData.industry || 'your industry'}.\n\nAre you available for a 15-minute call this week to discuss?\n\nRegards`
      },
      email_follow_up: {
        professional: `Hi ${prospectData.name},\n\nI wanted to follow up on my previous email regarding potential collaboration opportunities between our organizations.\n\nI understand you're busy, but I believe this could be mutually beneficial. Would you have 10 minutes this week for a quick conversation?\n\nBest regards`,
        casual: `Hey ${prospectData.name},\n\nJust wanted to circle back on my last email. Still think there's some cool stuff we could work on together.\n\nAny chance you're free for a quick chat?\n\nThanks`,
        friendly: `Hi ${prospectData.name},\n\nI hope you're having a great week! I wanted to follow up on my previous message about potential synergies between our work.\n\nI'd still love to connect and share some ideas. Are you available for a brief call?\n\nBest wishes`,
        direct: `${prospectData.name},\n\nFollowing up on my business proposition. This opportunity has a time-sensitive component.\n\nCan we schedule 15 minutes this week?\n\nRegards`
      }
    };

    const templates = emailTemplates[messageType as keyof typeof emailTemplates];
    if (!templates) return this.generateTemplateMessage('conversation_starter', tone, prospectData);
    
    const template = templates[tone as keyof typeof templates] || templates.professional;
    return template;
  }

  async generateConnectionMessage(prospectData: ProspectData, campaignData: CampaignData): Promise<string> {
    const tone = campaignData.tone || 'professional';
    
    // For now, use template-based generation since OpenAI requires API key
    return this.generateTemplateMessage('connection', tone, prospectData);
  }

  async generateWelcomeMessage(prospectData: ProspectData, campaignData: CampaignData): Promise<string> {
    const tone = campaignData.tone || 'professional';
    return this.generateTemplateMessage('welcome', tone, prospectData);
  }

  async generateFollowUpMessage(prospectData: ProspectData, campaignData: CampaignData, followUpNumber = 1): Promise<string> {
    const tone = campaignData.tone || 'professional';
    return this.generateTemplateMessage('follow_up', tone, prospectData);
  }

  async generateConversationStarter(prospectData: ProspectData, campaignData: CampaignData): Promise<string> {
    const tone = campaignData.tone || 'professional';
    return this.generateTemplateMessage('conversation_starter', tone, prospectData);
  }

  async generateBulkMessages(prospects: ProspectData[], campaignData: CampaignData, messageType: 'connection' | 'welcome' | 'follow_up' = 'connection') {
    const messages = [];
    
    for (const prospect of prospects) {
      try {
        let message: string;
        
        switch (messageType) {
          case 'connection':
            message = await this.generateConnectionMessage(prospect, campaignData);
            break;
          case 'welcome':
            message = await this.generateWelcomeMessage(prospect, campaignData);
            break;
          case 'follow_up':
            message = await this.generateFollowUpMessage(prospect, campaignData);
            break;
          default:
            message = await this.generateConnectionMessage(prospect, campaignData);
        }
        
        messages.push({
          prospectId: (prospect as any).id || (prospect as any)._id,
          message: message,
          messageType: messageType
        });
        
      } catch (error) {
        console.error(`Error generating message for prospect:`, error);
        
        // Add fallback template message
        messages.push({
          prospectId: (prospect as any).id || (prospect as any)._id,
          message: this.generateTemplateMessage(messageType, campaignData.tone || 'professional', prospect),
          messageType: messageType
        });
      }
    }
    
    return messages;
  }

  async generateColdEmail(prospectData: ProspectData, campaignData: CampaignData): Promise<{ subject: string; content: string }> {
    const tone = campaignData.tone || 'professional';
    return {
      subject: this.generateEmailSubject('cold_email', prospectData, tone),
      content: this.generateEmailContent('cold_email', prospectData, tone)
    };
  }

  async generateEmailFollowUp(prospectData: ProspectData, campaignData: CampaignData): Promise<{ subject: string; content: string }> {
    const tone = campaignData.tone || 'professional';
    return {
      subject: this.generateEmailSubject('email_follow_up', prospectData, tone),
      content: this.generateEmailContent('email_follow_up', prospectData, tone)
    };
  }
}

const messageGenerator = new MessageGenerator();

// Export functions for use in other modules
export async function generateAIMessage(options: MessageGenerationOptions): Promise<string> {
  const { prospectData, messageType, campaignData, followUpNumber } = options;
  
  switch (messageType) {
    case 'connection':
      return await messageGenerator.generateConnectionMessage(prospectData, campaignData);
    case 'welcome':
      return await messageGenerator.generateWelcomeMessage(prospectData, campaignData);
    case 'follow_up':
      return await messageGenerator.generateFollowUpMessage(prospectData, campaignData, followUpNumber);
    case 'conversation_starter':
      return await messageGenerator.generateConversationStarter(prospectData, campaignData);
    case 'reply':
      // For replies, use welcome message logic for now
      return await messageGenerator.generateWelcomeMessage(prospectData, campaignData);
    default:
      throw new Error(`Unknown message type: ${messageType}`);
  }
}

export async function generateAIEmail(options: MessageGenerationOptions): Promise<{ subject: string; content: string }> {
  const { prospectData, messageType, campaignData } = options;
  
  switch (messageType) {
    case 'connection':
      return await messageGenerator.generateColdEmail(prospectData, campaignData);
    case 'follow_up':
      return await messageGenerator.generateEmailFollowUp(prospectData, campaignData);
    default:
      // Fallback to cold email for unknown types
      return await messageGenerator.generateColdEmail(prospectData, campaignData);
  }
}

export { MessageGenerator, messageGenerator };