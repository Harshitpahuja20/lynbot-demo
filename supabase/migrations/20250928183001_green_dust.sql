/*
  # Create prospects table

  1. New Tables
    - `prospects`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `campaign_id` (uuid, foreign key to campaigns)
      - `linkedin_data` (jsonb)
      - `contact_info` (jsonb)
      - `status` (text)
      - `interactions` (jsonb array)
      - `automation` (jsonb)
      - `scoring` (jsonb)
      - `tags` (text array)
      - `notes` (jsonb array)
      - `custom_fields` (jsonb)
      - `source` (text)
      - `search_query` (text)
      - `is_active` (boolean, default true)
      - `last_updated` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `prospects` table
    - Add policy for users to manage their own prospects
*/

CREATE TABLE IF NOT EXISTS prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  linkedin_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  contact_info jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'new' CHECK (status IN (
    'new', 'connection_pending', 'connection_sent', 'connected', 
    'connection_failed', 'connection_declined', 'message_sent', 
    'message_replied', 'message_failed', 'follow_up_sent', 
    'follow_up_replied', 'unresponsive', 'qualified', 
    'not_qualified', 'archived'
  )),
  interactions jsonb DEFAULT '[]'::jsonb,
  automation jsonb DEFAULT '{
    "connectionRequestSent": false,
    "connectionRequestDate": null,
    "welcomeMessageSent": false,
    "welcomeMessageDate": null,
    "followUpsSent": 0,
    "lastFollowUpDate": null,
    "nextScheduledAction": null,
    "nextScheduledDate": null,
    "automationPaused": false,
    "pauseReason": null
  }'::jsonb,
  scoring jsonb DEFAULT '{
    "leadScore": 0,
    "factors": {
      "titleMatch": 0,
      "companyMatch": 0,
      "locationMatch": 0,
      "industryMatch": 0,
      "connectionLevel": 0,
      "profileCompleteness": 0,
      "activityLevel": 0
    },
    "lastCalculated": null
  }'::jsonb,
  tags text[] DEFAULT '{}',
  notes jsonb DEFAULT '[]'::jsonb,
  custom_fields jsonb DEFAULT '{}'::jsonb,
  source text DEFAULT 'search' CHECK (source IN ('search', 'import', 'manual', 'sales_navigator')),
  search_query text,
  is_active boolean DEFAULT true,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;

-- Users can manage their own prospects
CREATE POLICY "Users can manage own prospects"
  ON prospects
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Create updated_at trigger
CREATE TRIGGER update_prospects_updated_at
  BEFORE UPDATE ON prospects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_prospects_user_id ON prospects(user_id);
CREATE INDEX idx_prospects_campaign_id ON prospects(campaign_id);
CREATE INDEX idx_prospects_status ON prospects(status);
CREATE INDEX idx_prospects_linkedin_profile_url ON prospects USING GIN ((linkedin_data->>'profileUrl'));
CREATE INDEX idx_prospects_created_at ON prospects(created_at DESC);
CREATE INDEX idx_prospects_last_updated ON prospects(last_updated DESC);