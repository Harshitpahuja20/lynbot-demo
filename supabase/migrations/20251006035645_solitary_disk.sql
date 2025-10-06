/*
  # Fix database setup for user registration

  1. New Tables
    - Ensure `users` table exists with all required columns
    - Add missing columns if they don't exist
    - Set up proper constraints and defaults

  2. Security
    - Enable RLS on all tables
    - Add proper policies for user access
*/

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  company text,
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin', 'premium')),
  subscription jsonb DEFAULT '{"plan": "free", "status": "inactive"}'::jsonb,
  linkedin_accounts jsonb DEFAULT '[]'::jsonb,
  email_accounts jsonb DEFAULT '[]'::jsonb,
  api_keys jsonb DEFAULT '{}'::jsonb,
  settings jsonb DEFAULT '{
    "timezone": "UTC",
    "workingHours": {"start": 9, "end": 18},
    "workingDays": [1, 2, 3, 4, 5],
    "automation": {
      "enabled": false,
      "connectionRequests": {"enabled": false},
      "welcomeMessages": {"enabled": false},
      "followUpMessages": {"enabled": false},
      "profileViews": {"enabled": false}
    },
    "notifications": {
      "email": true,
      "webhook": false
    }
  }'::jsonb,
  usage jsonb DEFAULT '{
    "totalConnections": 0,
    "totalMessages": 0,
    "totalCampaigns": 0,
    "totalProspects": 0
  }'::jsonb,
  is_active boolean DEFAULT true,
  last_login timestamptz,
  email_verified boolean DEFAULT false,
  onboarding_complete boolean DEFAULT false,
  email_verification_token text,
  email_verification_expires timestamptz,
  password_reset_token text,
  password_reset_expires timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add missing columns if they don't exist
DO $$
BEGIN
  -- Check and add email_accounts column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'email_accounts'
  ) THEN
    ALTER TABLE users ADD COLUMN email_accounts jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Check and add other missing columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'usage'
  ) THEN
    ALTER TABLE users ADD COLUMN usage jsonb DEFAULT '{
      "totalConnections": 0,
      "totalMessages": 0,
      "totalCampaigns": 0,
      "totalProspects": 0
    }'::jsonb;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create or replace policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create campaigns table if it doesn't exist
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  search_criteria jsonb DEFAULT '{}'::jsonb,
  message_templates jsonb DEFAULT '{}'::jsonb,
  automation jsonb DEFAULT '{}'::jsonb,
  statistics jsonb DEFAULT '{
    "totalProspects": 0,
    "connectionsSent": 0,
    "connectionsAccepted": 0,
    "messagesSent": 0,
    "messagesReplied": 0,
    "profileViews": 0,
    "acceptanceRate": 0,
    "responseRate": 0,
    "lastActivity": null
  }'::jsonb,
  integrations jsonb DEFAULT '{}'::jsonb,
  tags text[] DEFAULT '{}',
  priority integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on campaigns
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Create campaigns policies
DROP POLICY IF EXISTS "Users can manage own campaigns" ON campaigns;
CREATE POLICY "Users can manage own campaigns"
  ON campaigns
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Create prospects table if it doesn't exist
CREATE TABLE IF NOT EXISTS prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  linkedin_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  contact_info jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'new',
  interactions jsonb DEFAULT '[]'::jsonb,
  automation jsonb DEFAULT '{}'::jsonb,
  scoring jsonb DEFAULT '{}'::jsonb,
  tags text[] DEFAULT '{}',
  notes jsonb DEFAULT '[]'::jsonb,
  custom_fields jsonb DEFAULT '{}'::jsonb,
  source text DEFAULT 'search',
  search_query text,
  is_active boolean DEFAULT true,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on prospects
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;

-- Create prospects policies
DROP POLICY IF EXISTS "Users can manage own prospects" ON prospects;
CREATE POLICY "Users can manage own prospects"
  ON prospects
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prospect_id uuid NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  conversation_id text NOT NULL,
  type text NOT NULL CHECK (type IN ('sent', 'received')),
  message_type text DEFAULT 'manual',
  content text NOT NULL,
  subject text,
  platform text DEFAULT 'linkedin',
  status text DEFAULT 'draft',
  linkedin_message_id text,
  thread_id text,
  automated boolean DEFAULT false,
  ai_generated boolean DEFAULT false,
  ai_prompt text,
  template_used uuid,
  scheduled_for timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  replied_at timestamptz,
  failure_reason text,
  retry_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  attachments jsonb DEFAULT '[]'::jsonb,
  analytics jsonb DEFAULT '{}'::jsonb,
  tags text[] DEFAULT '{}',
  is_archived boolean DEFAULT false,
  is_starred boolean DEFAULT false,
  is_important boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create messages policies
DROP POLICY IF EXISTS "Users can manage own messages" ON messages;
CREATE POLICY "Users can manage own messages"
  ON messages
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());