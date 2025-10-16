-- 1. First, create the buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('aplus-basic', 'aplus-basic', true),
  ('aplus-premium', 'aplus-premium', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create or update the drafts table
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

-- 3. Create the update trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for drafts table
DROP TRIGGER IF EXISTS update_drafts_updated_at ON public.drafts;
CREATE TRIGGER update_drafts_updated_at
BEFORE UPDATE ON public.drafts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Set up RLS and policies
ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;

-- 5. Create a simple function to set storage policies
CREATE OR REPLACE FUNCTION setup_storage_policies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Allow public read access to both buckets
  EXECUTE format('
    DROP POLICY IF EXISTS "Public read access" ON storage.objects;
    CREATE POLICY "Public read access"
    ON storage.objects FOR SELECT
    USING (bucket_id IN (''aplus-basic'', ''aplus-premium''));
  ');

  -- Allow insert/update/delete for authenticated users
  EXECUTE format('
    DROP POLICY IF EXISTS "Allow all access" ON storage.objects;
    CREATE POLICY "Allow all access"
    ON storage.objects
    FOR ALL
    USING (bucket_id IN (''aplus-basic'', ''aplus-premium'') AND auth.role() = ''authenticated'')
    WITH CHECK (bucket_id IN (''aplus-basic'', ''aplus-premium'') AND auth.role() = ''authenticated'');
  ');
  
  -- Allow anonymous uploads (adjust permissions as needed)
  EXECUTE format('
    DROP POLICY IF EXISTS "Allow anonymous uploads" ON storage.objects;
    CREATE POLICY "Allow anonymous uploads"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
      bucket_id IN (''aplus-basic'', ''aplus-premium'') 
      AND (auth.role() = ''authenticated'' OR auth.role() = ''anon'')
    );
  ');
  
  -- Allow service role full access (bypasses RLS)
  EXECUTE format('
    DROP POLICY IF EXISTS "Bypass RLS for service role" ON storage.objects;
    CREATE POLICY "Bypass RLS for service role"
    ON storage.objects
    FOR ALL
    USING (auth.role() = ''service_role'')
    WITH CHECK (auth.role() = ''service_role'');
  ');
END;
$$;

-- 6. Execute the storage policy setup
DO $$
BEGIN
    -- First, make sure the function exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'setup_storage_policies') THEN
        -- Call the function to set up the policies
        PERFORM setup_storage_policies();
        
        -- Keep the function for future use instead of dropping it
        RAISE NOTICE 'Storage policies have been set up successfully';
    ELSE
        RAISE EXCEPTION 'setup_storage_policies() function not found. Cannot set up storage policies.';
    END IF;
END $$;

-- 8. Create the bucket selection function
CREATE OR REPLACE FUNCTION public.get_content_bucket(content_type TEXT)
RETURNS TEXT
LANGUAGE SQL
AS $$
  SELECT CASE 
    WHEN content_type = 'premium' THEN 'aplus-premium'
    ELSE 'aplus-basic'
  END;
$$;

-- 9. Create indexes
CREATE INDEX IF NOT EXISTS idx_drafts_metadata_gin ON public.drafts USING GIN (metadata jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_drafts_user_id ON public.drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_drafts_status ON public.drafts(status);
CREATE INDEX IF NOT EXISTS idx_drafts_content_type ON public.drafts(content_type);

-- 10. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 11. Create RLS policies for drafts table
CREATE POLICY "Enable read access for all users" 
ON public.drafts
FOR SELECT
USING (true);

CREATE POLICY "Enable insert for authenticated users only"
ON public.drafts
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update for users based on user_id"
ON public.drafts
FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Enable delete for users based on user_id"
ON public.drafts
FOR DELETE
TO authenticated
USING (auth.uid()::text = user_id);

-- 12. Enable RLS on the storage.objects table if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_tables 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND rowsecurity = true
    ) THEN
        ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Verify the bucket exists and is public
-- If the bucket doesn't exist, create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'images') THEN
        INSERT INTO storage.buckets (id, name, public) 
        VALUES ('images', 'images', true);
    ELSE
        -- Ensure the bucket is public if it exists
        UPDATE storage.buckets 
        SET public = true 
        WHERE name = 'images';
    END IF;
END $$;
