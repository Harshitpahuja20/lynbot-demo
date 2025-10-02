/*
  # Create campaigns table

  1. New Tables
    - `campaigns`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `name` (text)
      - `description` (text)
      - `status` (text)
      - `search_criteria` (jsonb)
      - `message_templates` (jsonb)
      - `automation` (jsonb)
      - `statistics` (jsonb)
      - `integrations` (jsonb)
      - `tags` (text array)
      - `priority` (integer, default 0)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `campaigns` table
    - Add policy for users to manage their own campaigns
*/

CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  search_criteria jsonb DEFAULT '{}'::jsonb,
  message_templates jsonb DEFAULT '{
    "connectionRequest": {
      "enabled": true,
      "template": "",
      "tone": "professional",
      "useAI": true,
      "customPrompt": ""
    },
    "welcomeMessage": {
      "enabled": true,
      "template": "",
      "tone": "professional",
      "useAI": true,
      "customPrompt": "",
      "delay": 24
    },
    "followUpSequence": []
  }'::jsonb,
  automation jsonb DEFAULT '{
    "enabled": false,
    "dailyLimits": {
      "connections": 50,
      "messages": 25
    },
    "timing": {
      "workingHours": {"start": 9, "end": 18},
      "workingDays": [1, 2, 3, 4, 5],
      "randomDelay": {"min": 30, "max": 300}
    },
    "withdrawInvitations": {
      "enabled": true,
      "afterDays": 7
    }
  }'::jsonb,
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
  integrations jsonb DEFAULT '{
    "webhooks": [],
    "zapier": {"enabled": false},
    "make": {"enabled": false},
    "n8n": {"enabled": false}
  }'::jsonb,
  tags text[] DEFAULT '{}',
  priority integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Users can manage their own campaigns
CREATE POLICY "Users can manage own campaigns"
  ON campaigns
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Create updated_at trigger
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at DESC);