-- Create search_results table to store LinkedIn search results
CREATE TABLE IF NOT EXISTS search_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  search_filters jsonb NOT NULL,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_results integer DEFAULT 0,
  status text DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE search_results ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can manage own search results" 
  ON search_results 
  FOR ALL 
  TO authenticated 
  USING (user_id = auth.uid());

-- Create trigger
CREATE TRIGGER update_search_results_updated_at 
  BEFORE UPDATE ON search_results 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_search_results_campaign_id ON search_results(campaign_id);
CREATE INDEX idx_search_results_user_id ON search_results(user_id);
CREATE INDEX idx_search_results_created_at ON search_results(created_at DESC);