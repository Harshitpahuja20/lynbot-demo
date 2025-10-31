/*
  # Create knowledge base tables

  1. New Tables
    - `global_knowledge`
      - `id` (uuid, primary key)
      - `title` (text)
      - `content` (text)
      - `category` (text)
      - `type` (text)
      - `tags` (text array)
      - `is_active` (boolean, default true)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `user_knowledge`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `title` (text)
      - `content` (text)
      - `category` (text)
      - `type` (text)
      - `source_url` (text, optional)
      - `metadata` (jsonb)
      - `tags` (text array)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `knowledge_documents`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users, nullable for global docs)
      - `filename` (text)
      - `original_name` (text)
      - `file_size` (bigint)
      - `mime_type` (text)
      - `file_path` (text)
      - `extracted_text` (text)
      - `summary` (text)
      - `status` (text)
      - `tags` (text array)
      - `is_global` (boolean, default false)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all knowledge tables
    - Add policies for users to manage their own knowledge
    - Add policies for admins to manage global knowledge
*/

-- Global Knowledge Table (Admin-controlled, applies to all users)
CREATE TABLE IF NOT EXISTS global_knowledge (
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

-- User-specific Knowledge Table
CREATE TABLE IF NOT EXISTS user_knowledge (
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

-- Knowledge Documents Table (for PDF uploads)
CREATE TABLE IF NOT EXISTS knowledge_documents (
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

-- Enable RLS
ALTER TABLE global_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;

-- Global Knowledge Policies
CREATE POLICY "Anyone can read active global knowledge"
  ON global_knowledge
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage global knowledge"
  ON global_knowledge
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- User Knowledge Policies
CREATE POLICY "Users can manage own knowledge"
  ON user_knowledge
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all user knowledge"
  ON user_knowledge
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Knowledge Documents Policies
CREATE POLICY "Users can manage own documents"
  ON knowledge_documents
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Anyone can read global documents"
  ON knowledge_documents
  FOR SELECT
  TO authenticated
  USING (is_global = true AND status = 'processed');

CREATE POLICY "Admins can manage all documents"
  ON knowledge_documents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create updated_at triggers
CREATE TRIGGER update_global_knowledge_updated_at
  BEFORE UPDATE ON global_knowledge
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_knowledge_updated_at
  BEFORE UPDATE ON user_knowledge
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_documents_updated_at
  BEFORE UPDATE ON knowledge_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_global_knowledge_category ON global_knowledge(category);
CREATE INDEX idx_global_knowledge_active ON global_knowledge(is_active);
CREATE INDEX idx_global_knowledge_created_at ON global_knowledge(created_at DESC);

CREATE INDEX idx_user_knowledge_user_id ON user_knowledge(user_id);
CREATE INDEX idx_user_knowledge_category ON user_knowledge(category);
CREATE INDEX idx_user_knowledge_active ON user_knowledge(is_active);

CREATE INDEX idx_knowledge_documents_user_id ON knowledge_documents(user_id);
CREATE INDEX idx_knowledge_documents_global ON knowledge_documents(is_global);
CREATE INDEX idx_knowledge_documents_status ON knowledge_documents(status);