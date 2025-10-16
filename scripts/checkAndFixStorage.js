import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false
    }
  }
);

const BUCKETS = ['aplus-basic', 'aplus-premium', 'images'];

async function checkAndFixBuckets() {
  try {
    console.log('Checking storage buckets...');
    
    // List all buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }

    const existingBuckets = buckets.map(b => b.name);
    console.log('Existing buckets:', existingBuckets);

    // Check and create missing buckets
    for (const bucketName of BUCKETS) {
      if (!existingBuckets.includes(bucketName)) {
        console.log(`Bucket '${bucketName}' not found, creating...`);
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true,
          allowedMimeTypes: ['image/*'],
          fileSizeLimit: 5 * 1024 * 1024, // 5MB
        });

        if (createError) {
          console.error(`Error creating bucket '${bucketName}':`, createError);
        } else {
          console.log(`Bucket '${bucketName}' created successfully`);
        }
      } else {
        console.log(`Bucket '${bucketName}' exists`);
      }
    }

    // Verify bucket policies
    await verifyBucketPolicies();
    
  } catch (error) {
    console.error('Error in checkAndFixBuckets:', error);
  }
}

async function verifyBucketPolicies() {
  console.log('\nVerifying bucket policies...');
  
  // These are the policies we want to ensure exist
  const requiredPolicies = [
    {
      name: 'Public read access',
      command: `
        CREATE POLICY IF NOT EXISTS "Public read access"
        ON storage.objects FOR SELECT
        USING (bucket_id = ANY(ARRAY['aplus-basic', 'aplus-premium', 'images']));
      `
    },
    {
      name: 'Authenticated uploads',
      command: `
        CREATE POLICY IF NOT EXISTS "Authenticated uploads"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (
          bucket_id = ANY(ARRAY['aplus-basic', 'aplus-premium', 'images'])
        );
      `
    },
    {
      name: 'Anonymous uploads',
      command: `
        CREATE POLICY IF NOT EXISTS "Anonymous uploads"
        ON storage.objects FOR INSERT
        TO anon
        WITH CHECK (
          bucket_id = ANY(ARRAY['aplus-basic', 'aplus-premium', 'images'])
        );
      `
    }
  ];

  try {
    // Execute each policy creation
    for (const policy of requiredPolicies) {
      console.log(`Ensuring policy '${policy.name}' exists...`);
      const { error } = await supabase.rpc('exec_sql', { sql: policy.command });
      
      if (error) {
        console.error(`Error creating policy '${policy.name}':`, error);
      } else {
        console.log(`Policy '${policy.name}' verified`);
      }
    }
    
    console.log('\nBucket policies verified successfully!');
  } catch (error) {
    console.error('Error verifying policies:', error);
  }
}

// Run the check and fix
checkAndFixBuckets().catch(console.error);
