-- Add salesNavigatorCriteria column to campaigns table
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS salesNavigatorCriteria jsonb DEFAULT '{}'::jsonb;

-- Update existing campaigns to have the new column
UPDATE campaigns 
SET salesNavigatorCriteria = search_criteria 
WHERE salesNavigatorCriteria IS NULL;