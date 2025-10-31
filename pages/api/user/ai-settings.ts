import { NextApiResponse } from 'next';
import { NextApiRequest } from 'next';
import jwt from 'jsonwebtoken';
import { getSupabaseAdminClient } from '../../../lib/supabase';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
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

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`
    });
  }

  try {
    // Authenticate user
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.id;

    const { provider, model, apiKey, temperature, maxTokens } = req.body;

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
    const supabase = getSupabaseAdminClient();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
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

    const { error: updateError } = await supabase
      .from('users')
      .update({
      api_keys: updatedApiKeys,
      settings: updatedSettings
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to save AI settings'
      });
    }

    console.log(`AI settings updated for user: ${user.email} - Provider: ${provider}, Model: ${model}`);

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
