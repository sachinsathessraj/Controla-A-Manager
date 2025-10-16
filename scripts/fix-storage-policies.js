import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://gecyohwgayxqdrmzqsfz.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlY3lvaHdnYXl4cWRybXpxc2Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0Mzg2ODksImV4cCI6MjA2OTAxNDY4OX0.aPWJDprRC7SWGEj_CA2Oj0CGTcHLY2WMRkgBU6l33SA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndCreateBuckets() {
  const buckets = ['aplus-basic', 'aplus-premium'];
  
  for (const bucketName of buckets) {
    try {
      // Try to get bucket info
      const { data, error } = await supabase.storage.getBucket(bucketName);
      
      if (error) {
        if (error.message.includes('not found')) {
          console.log(`Bucket ${bucketName} not found, creating...`);
          const { data: newBucket, error: createError } = await supabase.storage.createBucket(bucketName, {
            public: true,
            allowedMimeTypes: ['image/*'],
            fileSizeLimit: 5 * 1024 * 1024, // 5MB
          });
          
          if (createError) {
            console.error(`Error creating bucket ${bucketName}:`, createError);
          } else {
            console.log(`Created bucket: ${bucketName}`);
          }
        } else {
          console.error(`Error checking bucket ${bucketName}:`, error);
        }
      } else {
        console.log(`Bucket exists: ${bucketName}`);
      }
    } catch (err) {
      console.error(`Unexpected error with bucket ${bucketName}:`, err);
    }
  }
}

async function updateStoragePolicies() {
  try {
    // First, create the buckets if they don't exist
    await checkAndCreateBuckets();
    
    // Now update the policies
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
      -- Remove existing policies to avoid conflicts
      DO $$
      DECLARE
          policy_record RECORD;
      BEGIN
          FOR policy_record IN 
              SELECT policyname, tablename 
              FROM pg_policies 
              WHERE schemaname = 'storage' 
              AND tablename = 'objects'
          LOOP
              EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
          END LOOP;
      END $$;

      -- Create storage policies for both buckets
      -- 1. Allow public read access to all files in both buckets
      CREATE POLICY "Public read access to A+ content" 
      ON storage.objects FOR SELECT 
      USING (bucket_id = 'aplus-basic' OR bucket_id = 'aplus-premium');

      -- 2. Allow anyone to upload files to both buckets (including anonymous users)
      CREATE POLICY "Allow all uploads to A+ content" 
      ON storage.objects FOR INSERT 
      WITH CHECK (bucket_id = 'aplus-basic' OR bucket_id = 'aplus-premium');

      -- 3. Allow anyone to update files in both buckets
      CREATE POLICY "Allow all updates" 
      ON storage.objects FOR UPDATE 
      USING (bucket_id = 'aplus-basic' OR bucket_id = 'aplus-premium')
      WITH CHECK (bucket_id = 'aplus-basic' OR bucket_id = 'aplus-premium');

      -- 4. Allow anyone to delete files from both buckets
      CREATE POLICY "Allow all deletes" 
      ON storage.objects FOR DELETE 
      USING (bucket_id = 'aplus-basic' OR bucket_id = 'aplus-premium');

      -- 5. Allow all operations for service role (bypasses RLS)
      CREATE POLICY "Bypass RLS for service role"
      ON storage.objects
      USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'service_role'
      ));
      `
    });

    if (error) {
      console.error('Error updating storage policies:', error);
    } else {
      console.log('Successfully updated storage policies');
    }
  } catch (err) {
    console.error('Error in updateStoragePolicies:', err);
  }
}

// Run the function
updateStoragePolicies();
