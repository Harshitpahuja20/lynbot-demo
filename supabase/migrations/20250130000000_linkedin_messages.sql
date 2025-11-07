-- Create linkedin_messages table for storing Unipile messages
CREATE TABLE IF NOT EXISTS linkedin_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chat_id text NOT NULL,
  account_id text NOT NULL,
  message_id text,
  recipient_name text,
  content text NOT NULL,
  type text NOT NULL CHECK (type IN ('sent', 'received')),
  status text DEFAULT 'sent',
  sent_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE linkedin_messages ENABLE ROW LEVEL SECURITY;

-- Users can manage their own messages
CREATE POLICY "Users can manage own linkedin messages"
  ON linkedin_messages
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX idx_linkedin_messages_user_id ON linkedin_messages(user_id);
CREATE INDEX idx_linkedin_messages_chat_id ON linkedin_messages(chat_id);
CREATE INDEX idx_linkedin_messages_account_id ON linkedin_messages(account_id);
CREATE INDEX idx_linkedin_messages_created_at ON linkedin_messages(created_at DESC);
