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
  messageType: 'connection' | 'welcome' | 'follow_up' | 'reply';
  campaignData: CampaignData;
  followUpNumber?: number;
  context?: any;
}

class MessageGenerator {
  private messageTemplates = {
    connection: {
      professional: `Hi {name}, I noticed your experience in {industry} at {company}. I'd love to connect and potentially explore synergies between our work in {field}.`,
      casual: `Hey {name}! Saw your profile and your work at {company} looks really interesting. Would love to connect!`,
      friendly: `Hi {name}, I came across your profile and was impressed by your background in {industry}. I'd enjoy connecting with fellow professionals in this space.`,
      direct: `Hi {name}, I'm reaching out to professionals in {industry} to expand my network. Your experience at {company} caught my attention.`
    },
    welcome: {
      professional: `Thank you for connecting, {name}! I'm excited to be part of your network. I'd love to learn more about your work at {company} and share insights about {industry}.`,
      casual: `Thanks for connecting, {name}! Looking forward to staying in touch and seeing what you're up to at {company}.`,
      friendly: `Hi {name}, thanks for accepting my connection request! I'm always interested in connecting with talented professionals like yourself.`,
      direct: `Thanks for connecting, {name}. I'd be interested in discussing potential collaboration opportunities in {industry}.`
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
          prospectId: (prospect as any)._id,
          message: message,
          messageType: messageType
        });
        
      } catch (error) {
        console.error(`Error generating message for prospect:`, error);
        
        // Add fallback template message
        messages.push({
          prospectId: (prospect as any)._id,
          message: this.generateTemplateMessage(messageType, campaignData.tone || 'professional', prospect),
          messageType: messageType
        });
      }
    }
    
    return messages;
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
    case 'reply':
      // For replies, use welcome message logic for now
      return await messageGenerator.generateWelcomeMessage(prospectData, campaignData);
    default:
      throw new Error(`Unknown message type: ${messageType}`);
  }
}

export { MessageGenerator, messageGenerator };