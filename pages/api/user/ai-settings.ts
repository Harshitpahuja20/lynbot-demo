import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/withAuth';
import { userOperations } from '../../../lib/database';
import crypto from 'crypto';

const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'your-encryption-secret-key-change-this';
const ALGORITHM = 'aes-256-gcm';

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_SECRET);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_SECRET);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`
    });
  }

  try {
    const { provider, model, apiKey, temperature, maxTokens } = req.body;
    const userId = req.user.id;

    if (!provider || !model || !apiKey) {
      return res.status(400).json({
        success: false,
        error: 'AI provider, model, and API key are required'
      });
    }

    // Validate provider
    if (!['openai', 'perplexity', 'claude'].includes(provider)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid AI provider. Must be openai, perplexity, or claude'
      });
    }

    // Validate API key format based on provider
    let isValidKey = false;
    switch (provider) {
      case 'openai':
        isValidKey = apiKey.startsWith('sk-');
        break;
      case 'perplexity':
        isValidKey = apiKey.startsWith('pplx-');
        break;
      case 'claude':
        isValidKey = apiKey.startsWith('sk-ant-');
        break;
    }

    if (!isValidKey) {
      return res.status(400).json({
        success: false,
        error: `Invalid ${provider} API key format`
      });
    }

    // Encrypt the API key
    const encryptedApiKey = encrypt(apiKey);

    // Get current user
    const user = await userOperations.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update user with AI settings
    const updatedApiKeys = { ...user.api_keys };
    const updatedSettings = { ...user.settings };

    // Store encrypted API key
    switch (provider) {
      case 'openai':
        updatedApiKeys.encryptedOpenAI = encryptedApiKey;
        break;
      case 'perplexity':
        updatedApiKeys.encryptedPerplexity = encryptedApiKey;
        break;
      case 'claude':
        updatedApiKeys.encryptedClaude = encryptedApiKey;
        break;
    }

    // Update AI provider settings
    updatedSettings.aiProvider = {
      provider,
      model,
      temperature: temperature || 0.7,
      maxTokens: maxTokens || 1000
    };

    await userOperations.update(userId, {
      api_keys: updatedApiKeys,
      settings: updatedSettings
    });

    console.log(`AI settings updated for user: ${req.user.email} - Provider: ${provider}, Model: ${model}`);

    res.json({
      success: true,
      message: 'AI settings saved successfully'
    });

  } catch (error) {
    console.error('Error saving AI settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save AI settings'
    });
  }
}

export default withAuth(handler);