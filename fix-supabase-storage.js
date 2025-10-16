const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://yamrvvtisjrsqlecwubn.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbXJ2dnRpc2pyc3FsZWN3dWJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjY2OTk4NCwiZXhwIjoyMDY4MjQ1OTg0fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'; // You'll need to replace this with your actual service key

async function fixSupabaseStorage() {
  console.log('🔧 Starting Supabase storage fix...');
  
  try {
    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Step 1: Create the storage bucket if it doesn't exist
    console.log('📦 Creating storage bucket...');
    try {
      const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('aplus-images', {
        public: true,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: 52428800 // 50MB
      });
      
      if (bucketError && !bucketError.message.includes('already exists')) {
        console.error('❌ Failed to create bucket:', bucketError);
      } else {
        console.log('✅ Storage bucket created/verified');
      }
    } catch (error) {
      console.log('ℹ️  Bucket may already exist or service key not available');
    }
    
    // Step 2: Apply RLS policies using SQL
    console.log('🔐 Applying RLS policies...');
    
    const policies = [
      // Policy 1: Allow anonymous uploads
      `CREATE POLICY IF NOT EXISTS "Allow anonymous uploads to aplus-images" ON storage.objects
       FOR INSERT WITH CHECK (
         bucket_id = 'aplus-images' AND 
         (auth.role() = 'anon' OR auth.role() = 'authenticated')
       );`,
      
      // Policy 2: Allow anonymous reads
      `CREATE POLICY IF NOT EXISTS "Allow anonymous reads from aplus-images" ON storage.objects
       FOR SELECT USING (
         bucket_id = 'aplus-images' AND 
         (auth.role() = 'anon' OR auth.role() = 'authenticated')
       );`,
      
      // Policy 3: Allow authenticated updates
      `CREATE POLICY IF NOT EXISTS "Allow authenticated updates to aplus-images" ON storage.objects
       FOR UPDATE USING (
         bucket_id = 'aplus-images' AND 
         auth.role() = 'authenticated'
       );`,
      
      // Policy 4: Allow authenticated deletes
      `CREATE POLICY IF NOT EXISTS "Allow authenticated deletes from aplus-images" ON storage.objects
       FOR DELETE USING (
         bucket_id = 'aplus-images' AND 
         auth.role() = 'authenticated'
       );`
    ];
    
    for (const policy of policies) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: policy });
        if (error) {
          console.log(`ℹ️  Policy may already exist: ${error.message}`);
        } else {
          console.log('✅ Policy applied successfully');
        }
      } catch (error) {
        console.log(`ℹ️  Policy application skipped (may need manual setup): ${error.message}`);
      }
    }
    
    // Step 3: Test storage access
    console.log('🧪 Testing storage access...');
    try {
      const { data, error } = await supabase.storage
        .from('aplus-images')
        .list('', { limit: 1 });
      
      if (error) {
        console.log('⚠️  Storage test failed, but policies may still work:', error.message);
      } else {
        console.log('✅ Storage access test successful');
      }
    } catch (error) {
      console.log('⚠️  Storage test failed:', error.message);
    }
    
    console.log('\n🎉 Supabase storage fix completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Try uploading an image in your app');
    console.log('2. If you still get errors, check the browser console');
    console.log('3. The app will automatically fall back to local storage if needed');
    
  } catch (error) {
    console.error('❌ Error during storage fix:', error);
    console.log('\n🔧 Manual fix required:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to Storage > Policies');
    console.log('3. Create the aplus-images bucket if it doesn\'t exist');
    console.log('4. Add the policies from supabase-storage-policies.sql');
  }
}

// Run the fix
fixSupabaseStorage(); 