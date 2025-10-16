// Test Supabase storage with service role
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false }}
);

async function testStorage() {
  try {
    // 1. List buckets
    console.log('Listing buckets...');
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) throw error;
    
    console.log('Buckets:', buckets.map(b => b.name));
    
    // 2. Test upload
    console.log('\nTesting upload...');
    const testContent = `Test ${new Date().toISOString()}`;
    const { data: upload, error: uploadError } = await supabase.storage
      .from('aplus-basic')
      .upload('test-upload.txt', testContent);
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      if (uploadError.message.includes('bucket not found')) {
        console.log('\nRun this SQL in Supabase SQL Editor:');
        console.log(`
-- Create bucket
select * from storage.create_bucket('aplus-basic', { public: true });

-- Set policies
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'aplus-basic');
CREATE POLICY "Upload Access" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'aplus-basic');
        `);
      }
    } else {
      console.log('✅ Upload successful!');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testStorage();
