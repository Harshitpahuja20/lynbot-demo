-- Fix missing email_accounts column in users table
-- This script adds the email_accounts column if it doesn't exist

DO $$
BEGIN
  -- Check and add email_accounts column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'email_accounts'
  ) THEN
    ALTER TABLE users ADD COLUMN email_accounts jsonb DEFAULT '[]'::jsonb;
    RAISE NOTICE 'Added email_accounts column to users table';
  ELSE
    RAISE NOTICE 'email_accounts column already exists';
  END IF;
END $$;