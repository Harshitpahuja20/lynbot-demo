import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`
    });
  }

  try {
    // Simple auth check
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    try {
      jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    const providers = {
      openai: {
        name: 'OpenAI',
        models: [
          {
            id: 'gpt-4o',
            name: 'GPT-4o',
            description: 'Most capable model, best for complex tasks'
          },
          {
            id: 'gpt-4o-mini',
            name: 'GPT-4o Mini',
            description: 'Fast and efficient, good for most tasks'
          },
          {
            id: 'gpt-4-turbo',
            name: 'GPT-4 Turbo',
            description: 'High performance with large context window'
          },
          {
            id: 'gpt-3.5-turbo',
            name: 'GPT-3.5 Turbo',
            description: 'Fast and cost-effective for simple tasks'
          }
        ]
      },
      perplexity: {
        name: 'Perplexity',
        models: [
          {
            id: 'llama-3.1-sonar-large-128k-online',
            name: 'Llama 3.1 Sonar Large (Online)',
            description: 'Large model with real-time web access'
          },
          {
            id: 'llama-3.1-sonar-small-128k-online',
            name: 'Llama 3.1 Sonar Small (Online)',
            description: 'Efficient model with real-time web access'
          }
        ]
      },
      claude: {
        name: 'Anthropic Claude',
        models: [
          {
            id: 'claude-3-5-sonnet-20241022',
            name: 'Claude 3.5 Sonnet',
            description: 'Most intelligent model, excellent for complex tasks'
          },
          {
            id: 'claude-3-5-haiku-20241022',
            name: 'Claude 3.5 Haiku',
            description: 'Fastest model, great for simple tasks'
          }
        ]
      }
    };

    res.json({
      success: true,
      providers
    });

  } catch (error) {
    console.error('Error in AI providers API:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AI providers'
    });
  }
}