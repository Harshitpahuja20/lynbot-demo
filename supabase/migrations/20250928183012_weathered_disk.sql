/*
  # Create messages table

  1. New Tables
    - `messages`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `prospect_id` (uuid, foreign key to prospects)
      - `campaign_id` (uuid, foreign key to campaigns, optional)
      - `conversation_id` (text)
      - `type` (text - sent/received)
      - `message_type` (text)
      - `content` (text)
      - `subject` (text, optional)
      - `platform` (text, default 'linkedin')
      - `status` (text)
      - `linkedin_message_id` (text, optional)
      - `thread_id` (text, optional)
      - `automated` (boolean, default false)
      - `ai_generated` (boolean, default false)
      - `ai_prompt` (text, optional)
      - `template_used` (uuid, optional)
      - `scheduled_for` (timestamptz, optional)
      - `sent_at` (timestamptz, optional)
      - `delivered_at` (timestamptz, optional)
      - `read_at` (timestamptz, optional)
      - `replied_at` (timestamptz, optional)
      - `failure_reason` (text, optional)
      - `retry_count` (integer, default 0)
      - `metadata` (jsonb)
      - `attachments` (jsonb array)
      - `analytics` (jsonb)
      - `tags` (text array)
      - `is_archived` (boolean, default false)
      - `is_starred` (boolean, default false)
      - `is_important` (boolean, default false)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `messages` table
    - Add policy for users to manage their own messages
*/

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prospect_id uuid NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  conversation_id text NOT NULL,
  type text NOT NULL CHECK (type IN ('sent', 'received')),
  message_type text DEFAULT 'manual' CHECK (message_type IN ('connection_request', 'welcome', 'follow_up', 'manual', 'auto_reply')),
  content text NOT NULL,
  subject text,
  platform text DEFAULT 'linkedin' CHECK (platform IN ('linkedin', 'email', 'other')),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent', 'delivered', 'read', 'replied', 'failed')),
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
  analytics jsonb DEFAULT '{
    "opened": false,
    "openedAt": null,
    "clickedLinks": [],
    "responseReceived": false,
    "responseTime": null,
    "sentiment": "neutral",
    "leadQuality": "cold"
  }'::jsonb,
  tags text[] DEFAULT '{}',
  is_archived boolean DEFAULT false,
  is_starred boolean DEFAULT false,
  is_important boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can manage their own messages
CREATE POLICY "Users can manage own messages"
  ON messages
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Create updated_at trigger
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_prospect_id ON messages(prospect_id);
CREATE INDEX idx_messages_campaign_id ON messages(campaign_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_type ON messages(type);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_sent_at ON messages(sent_at DESC);