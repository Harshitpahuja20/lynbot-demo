interface AIProvider {
  name: string;
  models: Array<{
    id: string;
    name: string;
    description: string;
    maxTokens: number;
    costPer1kTokens: number;
  }>;
}

interface AIGenerationOptions {
  provider: 'openai' | 'perplexity' | 'claude';
  model: string;
  temperature: number;
  maxTokens: number;
  prompt: string;
  systemPrompt?: string;
}

interface ProspectData {
  name: string;
  title?: string;
  company?: string;
  industry?: string;
  location?: string;
  headline?: string;
  summary?: string;
}

interface CampaignData {
  tone?: string;
  description?: string;
  useAI?: boolean;
  customPrompt?: string;
}

class AIService {
  private providers: Record<string, AIProvider> = {
    openai: {
      name: 'OpenAI',
      models: [
        {
          id: 'gpt-4o',
          name: 'GPT-4o',
          description: 'Most capable model, best for complex tasks',
          maxTokens: 128000,
          costPer1kTokens: 0.005
        },
        {
          id: 'gpt-4o-mini',
          name: 'GPT-4o Mini',
          description: 'Fast and efficient, good for most tasks',
          maxTokens: 128000,
          costPer1kTokens: 0.00015
        },
        {
          id: 'gpt-4-turbo',
          name: 'GPT-4 Turbo',
          description: 'High performance with large context window',
          maxTokens: 128000,
          costPer1kTokens: 0.01
        },
        {
          id: 'gpt-3.5-turbo',
          name: 'GPT-3.5 Turbo',
          description: 'Fast and cost-effective for simple tasks',
          maxTokens: 16385,
          costPer1kTokens: 0.0005
        }
      ]
    },
    perplexity: {
      name: 'Perplexity',
      models: [
        {
          id: 'llama-3.1-sonar-large-128k-online',
          name: 'Llama 3.1 Sonar Large (Online)',
          description: 'Large model with real-time web access',
          maxTokens: 127072,
          costPer1kTokens: 0.001
        },
        {
          id: 'llama-3.1-sonar-small-128k-online',
          name: 'Llama 3.1 Sonar Small (Online)',
          description: 'Efficient model with real-time web access',
          maxTokens: 127072,
          costPer1kTokens: 0.0002
        },
        {
          id: 'llama-3.1-8b-instruct',
          name: 'Llama 3.1 8B Instruct',
          description: 'Fast and efficient for most tasks',
          maxTokens: 131072,
          costPer1kTokens: 0.0002
        },
        {
          id: 'llama-3.1-70b-instruct',
          name: 'Llama 3.1 70B Instruct',
          description: 'High performance for complex reasoning',
          maxTokens: 131072,
          costPer1kTokens: 0.001
        }
      ]
    },
    claude: {
      name: 'Anthropic Claude',
      models: [
        {
          id: 'claude-3-5-sonnet-20241022',
          name: 'Claude 3.5 Sonnet',
          description: 'Most intelligent model, excellent for complex tasks',
          maxTokens: 200000,
          costPer1kTokens: 0.003
        },
        {
          id: 'claude-3-5-haiku-20241022',
          name: 'Claude 3.5 Haiku',
          description: 'Fastest model, great for simple tasks',
          maxTokens: 200000,
          costPer1kTokens: 0.00025
        },
        {
          id: 'claude-3-opus-20240229',
          name: 'Claude 3 Opus',
          description: 'Most powerful model for complex reasoning',
          maxTokens: 200000,
          costPer1kTokens: 0.015
        }
      ]
    }
  };

  getProviders(): Record<string, AIProvider> {
    return this.providers;
  }

  getModelsForProvider(provider: string): AIProvider['models'] {
    return this.providers[provider]?.models || [];
  }

  async generateText(options: AIGenerationOptions): Promise<string> {
    const { provider, model, temperature, maxTokens, prompt, systemPrompt } = options;

    try {
      switch (provider) {
        case 'openai':
          return await this.generateWithOpenAI(model, prompt, systemPrompt, temperature, maxTokens);
        case 'perplexity':
          return await this.generateWithPerplexity(model, prompt, systemPrompt, temperature, maxTokens);
        case 'claude':
          return await this.generateWithClaude(model, prompt, systemPrompt, temperature, maxTokens);
        default:
          throw new Error(`Unsupported AI provider: ${provider}`);
      }
    } catch (error) {
      console.error(`Error generating text with ${provider}:`, error);
      throw error;
    }
  }

  private async generateWithOpenAI(
    model: string, 
    prompt: string, 
    systemPrompt?: string, 
    temperature = 0.7, 
    maxTokens = 1000
  ): Promise<string> {
    // For now, return template-based generation
    // In production, you would integrate with OpenAI API
    return this.generateTemplateResponse(prompt, 'openai');
  }

  private async generateWithPerplexity(
    model: string, 
    prompt: string, 
    systemPrompt?: string, 
    temperature = 0.7, 
    maxTokens = 1000
  ): Promise<string> {
    // For now, return template-based generation
    // In production, you would integrate with Perplexity API
    return this.generateTemplateResponse(prompt, 'perplexity');
  }

  private async generateWithClaude(
    model: string, 
    prompt: string, 
    systemPrompt?: string, 
    temperature = 0.7, 
    maxTokens = 1000
  ): Promise<string> {
    // For now, return template-based generation
    // In production, you would integrate with Claude API
    return this.generateTemplateResponse(prompt, 'claude');
  }

  private generateTemplateResponse(prompt: string, provider: string): string {
    // Template-based fallback for demo purposes
    const templates = {
      connection: `Hi {name}, I noticed your impressive work at {company}. I'd love to connect and explore potential synergies in {industry}.`,
      welcome: `Thank you for connecting, {name}! I'm excited to be part of your network and learn more about your work at {company}.`,
      follow_up: `Hi {name}, I hope you're doing well! I wanted to follow up and see if there might be opportunities for collaboration.`,
      email: `Hi {name},\n\nI hope this email finds you well. I came across your profile and was impressed by your work at {company}.\n\nI'd love to explore potential collaboration opportunities.\n\nBest regards`
    };

    // Simple template matching based on prompt content
    if (prompt.toLowerCase().includes('connection')) {
      return templates.connection;
    } else if (prompt.toLowerCase().includes('welcome')) {
      return templates.welcome;
    } else if (prompt.toLowerCase().includes('follow')) {
      return templates.follow_up;
    } else {
      return templates.email;
    }
  }

  buildPrompt(
    messageType: string, 
    prospectData: ProspectData, 
    campaignData: CampaignData
  ): { prompt: string; systemPrompt: string } {
    const systemPrompt = `You are an expert LinkedIn and email outreach specialist. Generate professional, personalized messages that:
1. Are authentic and human-like
2. Reference specific details about the prospect
3. Have a clear but subtle call-to-action
4. Match the specified tone: ${campaignData.tone || 'professional'}
5. Are concise and engaging

Avoid:
- Generic templates
- Overly salesy language
- Lengthy messages
- Obvious automation patterns`;

    const prospectInfo = `
Prospect Information:
- Name: ${prospectData.name}
- Title: ${prospectData.title || 'Not specified'}
- Company: ${prospectData.company || 'Not specified'}
- Industry: ${prospectData.industry || 'Not specified'}
- Location: ${prospectData.location || 'Not specified'}
- Headline: ${prospectData.headline || 'Not specified'}
`;

    let prompt = '';
    
    switch (messageType) {
      case 'connection':
        prompt = `${prospectInfo}

Generate a LinkedIn connection request message (max 300 characters) that:
- References their role or company
- Explains why you want to connect
- Is professional but personable
- Tone: ${campaignData.tone || 'professional'}

${campaignData.customPrompt ? `Additional instructions: ${campaignData.customPrompt}` : ''}`;
        break;

      case 'welcome':
        prompt = `${prospectInfo}

Generate a LinkedIn welcome message for a new connection that:
- Thanks them for connecting
- Shows interest in their work
- Suggests potential collaboration or knowledge sharing
- Tone: ${campaignData.tone || 'professional'}

${campaignData.customPrompt ? `Additional instructions: ${campaignData.customPrompt}` : ''}`;
        break;

      case 'follow_up':
        prompt = `${prospectInfo}

Generate a LinkedIn follow-up message that:
- References previous connection/interaction
- Provides value or insight
- Has a soft call-to-action
- Tone: ${campaignData.tone || 'professional'}

${campaignData.customPrompt ? `Additional instructions: ${campaignData.customPrompt}` : ''}`;
        break;

      case 'cold_email':
        prompt = `${prospectInfo}

Generate a cold email that includes:
- Subject line (separate from body)
- Professional email body
- Clear value proposition
- Specific call-to-action
- Tone: ${campaignData.tone || 'professional'}

Format as:
Subject: [subject line]
Body: [email body]

${campaignData.customPrompt ? `Additional instructions: ${campaignData.customPrompt}` : ''}`;
        break;

      case 'email_follow_up':
        prompt = `${prospectInfo}

Generate a follow-up email that includes:
- Subject line (separate from body)
- References previous outreach
- Provides additional value
- Clear next steps
- Tone: ${campaignData.tone || 'professional'}

Format as:
Subject: [subject line]
Body: [email body]

${campaignData.customPrompt ? `Additional instructions: ${campaignData.customPrompt}` : ''}`;
        break;

      default:
        prompt = `${prospectInfo}

Generate a personalized message for ${messageType} that is professional and engaging.
Tone: ${campaignData.tone || 'professional'}

${campaignData.customPrompt ? `Additional instructions: ${campaignData.customPrompt}` : ''}`;
    }

    return { prompt, systemPrompt };
  }
}

export const aiService = new AIService();
export default AIService;