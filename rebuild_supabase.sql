-- Supabase Project Rebuild Script
-- This script will create the necessary tables, storage buckets, and policies.

-- 1. Create storage buckets
-- Creates 'aplus-basic', 'aplus-premium', and 'images' buckets and makes them public.
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('aplus-basic', 'aplus-basic', true),
  ('aplus-premium', 'aplus-premium', true),
  ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create the 'drafts' table
-- This table stores the A+ content drafts.
CREATE TABLE IF NOT EXISTS public.drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  content_name TEXT NOT NULL,
  draft_type TEXT NOT NULL CHECK (draft_type IN ('basic', 'premium')),
  modules JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  version INTEGER NOT NULL DEFAULT 1,
  content_type TEXT NOT NULL DEFAULT 'basic' CHECK (content_type IN ('basic', 'premium')),
  user_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 3. Create a trigger to automatically update the 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_drafts_updated_at ON public.drafts;
CREATE TRIGGER update_drafts_updated_at
BEFORE UPDATE ON public.drafts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Enable Row Level Security (RLS) on the 'drafts' table
ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for the 'drafts' table
-- Allow public read access to all drafts.
CREATE POLICY "Enable read access for all users" 
ON public.drafts
FOR SELECT
USING (true);

-- Allow authenticated users to insert new drafts.
CREATE POLICY "Enable insert for authenticated users only"
ON public.drafts
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to update their own drafts.
CREATE POLICY "Enable update for users based on user_id"
ON public.drafts
FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- Allow users to delete their own drafts.
CREATE POLICY "Enable delete for users based on user_id"
ON public.drafts
FOR DELETE
TO authenticated
USING (auth.uid()::text = user_id);

-- 6. Enable RLS on the storage.objects table and define policies
-- This function will enable RLS and create the necessary policies with elevated privileges.
CREATE OR REPLACE FUNCTION setup_storage_policies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Enable RLS on storage.objects if not already enabled
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

  -- Drop existing policies to avoid conflicts
  DROP POLICY IF EXISTS "Public read access" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated access" ON storage.objects;

  -- Create new policies
  -- Allow public read access to all buckets.
  CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('aplus-basic', 'aplus-premium', 'images'));

  -- Allow authenticated users to upload, update, and delete files.
  CREATE POLICY "Allow authenticated access"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id IN ('aplus-basic', 'aplus-premium', 'images'))
  WITH CHECK (bucket_id IN ('aplus-basic', 'aplus-premium', 'images'));
END;
$$;

-- 7. Execute the function to apply the storage policies
SELECT setup_storage_policies();

-- 8. Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_drafts_metadata_gin ON public.drafts USING GIN (metadata jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_drafts_user_id ON public.drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_drafts_status ON public.drafts(status);
CREATE INDEX IF NOT EXISTS idx_drafts_content_type ON public.drafts(content_type);

-- 9. Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 10. Create a helper function to get the correct bucket name (optional but good practice)
CREATE OR REPLACE FUNCTION public.get_content_bucket(content_type TEXT)
RETURNS TEXT
LANGUAGE SQL
AS $$
  SELECT CASE 
    WHEN content_type = 'premium' THEN 'aplus-premium'
    ELSE 'aplus-basic'
  END;
$$;

-- End of script
