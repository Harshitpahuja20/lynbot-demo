import { NextApiResponse } from 'next';
import crypto from 'crypto';
import { withAuth, AuthenticatedRequest } from '../../../lib/middleware/withAuth';
import { userOperations } from '../../../lib/database';

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
    const { apiKey } = req.body;
    const userId = req.user.id;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'OpenAI API key is required'
      });
    }

    // Validate API key format
    if (!apiKey.startsWith('sk-')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OpenAI API key format'
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

    // Update user with encrypted API key
    await userOperations.update(userId, {
      api_keys: {
        ...user.api_keys,
        encryptedOpenAI: encryptedApiKey
      }
    });

    console.log(`OpenAI API key saved for user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'OpenAI API key saved successfully'
    });

  } catch (error) {
    console.error('Error saving OpenAI API key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save OpenAI API key'
    });
  }
}

export default withAuth(handler);