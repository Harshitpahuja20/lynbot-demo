-- Fixed Database Setup for Lync Bot
-- This handles existing tables with different ID types

-- Drop existing tables if they have wrong types
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS prospects CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS knowledge_documents CASCADE;
DROP TABLE IF EXISTS user_knowledge CASCADE;
DROP TABLE IF EXISTS global_knowledge CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Create users table with UUID
CREATE TABLE users (
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
  settings jsonb DEFAULT '{"timezone": "UTC", "workingHours": {"start": 9, "end": 18}, "workingDays": [1, 2, 3, 4, 5], "automation": {"enabled": false, "connectionRequests": {"enabled": false}, "welcomeMessages": {"enabled": false}, "followUpMessages": {"enabled": false}, "profileViews": {"enabled": false}}, "notifications": {"email": true, "webhook": false}}'::jsonb,
  usage jsonb DEFAULT '{"totalConnections": 0, "totalMessages": 0, "totalCampaigns": 0, "totalProspects": 0}'::jsonb,
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

-- 2. Create campaigns table
CREATE TABLE campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  search_criteria jsonb DEFAULT '{}'::jsonb,
  message_templates jsonb DEFAULT '{}'::jsonb,
  automation jsonb DEFAULT '{}'::jsonb,
  statistics jsonb DEFAULT '{"totalProspects": 0, "connectionsSent": 0, "connectionsAccepted": 0, "messagesSent": 0, "messagesReplied": 0, "profileViews": 0, "acceptanceRate": 0, "responseRate": 0, "lastActivity": null}'::jsonb,
  integrations jsonb DEFAULT '{}'::jsonb,
  tags text[] DEFAULT '{}',
  priority integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Create prospects table
CREATE TABLE prospects (
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

-- 4. Create messages table
CREATE TABLE messages (
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

-- 5. Create knowledge tables
CREATE TABLE global_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'general' CHECK (category IN ('prompts', 'templates', 'guidelines', 'examples', 'general')),
  type text DEFAULT 'text' CHECK (type IN ('text', 'prompt', 'template', 'faq', 'document')),
  tags text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE user_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'general' CHECK (category IN ('website', 'faq', 'value_prop', 'pain_agitate_solution', 'offer', 'general')),
  type text DEFAULT 'text' CHECK (type IN ('text', 'website', 'faq', 'value_prop', 'pain_points', 'solution', 'offer')),
  source_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  tags text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE knowledge_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  filename text NOT NULL,
  original_name text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  file_path text NOT NULL,
  extracted_text text,
  summary text,
  status text DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'processed', 'failed')),
  tags text[] DEFAULT '{}',
  is_global boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;

-- 7. Create trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Create triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prospects_updated_at BEFORE UPDATE ON prospects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_global_knowledge_updated_at BEFORE UPDATE ON global_knowledge FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_knowledge_updated_at BEFORE UPDATE ON user_knowledge FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_knowledge_documents_updated_at BEFORE UPDATE ON knowledge_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Create policies
CREATE POLICY "Users can read own data" ON users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can manage all users" ON users FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users can manage own campaigns" ON campaigns FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can manage own prospects" ON prospects FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can manage own messages" ON messages FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Anyone can read active global knowledge" ON global_knowledge FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins can manage global knowledge" ON global_knowledge FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users can manage own knowledge" ON user_knowledge FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can manage own documents" ON knowledge_documents FOR ALL TO authenticated USING (user_id = auth.uid() OR user_id IS NULL);

-- 10. Create indexes
CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_prospects_user_id ON prospects(user_id);
CREATE INDEX idx_prospects_campaign_id ON prospects(campaign_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_prospect_id ON messages(prospect_id);
CREATE INDEX idx_user_knowledge_user_id ON user_knowledge(user_id);
CREATE INDEX idx_knowledge_documents_user_id ON knowledge_documents(user_id);