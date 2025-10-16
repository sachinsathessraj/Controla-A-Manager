// Test Supabase storage access
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function testStorage() {
  try {
    console.log('1. Listing all buckets...');
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) throw error;
    
    console.log('Available buckets:', buckets.map(b => b.name));
    
    // Check required buckets
    const required = ['aplus-basic', 'aplus-premium'];
    const missing = required.filter(b => !buckets.some(x => x.name === b));
    
    if (missing.length > 0) {
      console.log('\nMissing buckets:', missing);
      console.log('\nRun this SQL in Supabase SQL Editor to create them:');
      console.log(`
-- Create missing buckets
select * from storage.create_bucket('aplus-basic', { public: true });
select * from storage.create_bucket('aplus-premium', { public: true });

-- Set bucket policies
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'aplus-basic' OR bucket_id = 'aplus-premium');
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'aplus-basic' OR bucket_id = 'aplus-premium');
      `);
    } else {
      console.log('\nAll required buckets exist!');
      
      // Test upload
      console.log('\nTesting upload...');
      const testContent = `Test ${new Date().toISOString()}`;
      const { data: upload, error: uploadError } = await supabase.storage
        .from('aplus-basic')
        .upload('test-upload.txt', testContent);
      
      if (uploadError) throw uploadError;
      console.log('Upload successful!');
    }
  } catch (err) {
    console.error('Error:', err.message);
    
    if (err.message.includes('permission denied')) {
      console.log('\nAuthentication failed. Please check your Supabase service role key.');
    } else if (err.message.includes('bucket not found')) {
      console.log('\nBuckets not found. You need to create them first.');
    }
  }
}

testStorage();
