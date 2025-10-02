/*
  # Create users table

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `password_hash` (text)
      - `first_name` (text)
      - `last_name` (text)
      - `company` (text, optional)
      - `role` (text, default 'user')
      - `subscription` (jsonb)
      - `linkedin_accounts` (jsonb array)
      - `api_keys` (jsonb)
      - `settings` (jsonb)
      - `usage` (jsonb)
      - `is_active` (boolean, default true)
      - `last_login` (timestamptz)
      - `email_verified` (boolean, default false)
      - `onboarding_complete` (boolean, default false)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `users` table
    - Add policy for users to read/update their own data
    - Add policy for admins to manage all users
*/

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

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own data
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

-- Admins can manage all users
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

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();