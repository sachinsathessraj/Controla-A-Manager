// This script uses the service role key to bypass RLS for testing purposes
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

// Initialize Supabase with service role key
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://gecyohwgayxqdrmzqsfz.supabase.co';
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test file path
const testImagePath = join(__dirname, '../src/database/test-upload.txt');

async function testUpload() {
  try {
    console.log('Starting upload test with service role...');
    
    // Create a test file if it doesn't exist
    if (!require('fs').existsSync(testImagePath)) {
      require('fs').writeFileSync(testImagePath, 'Test file content ' + new Date().toISOString());
      console.log('Created test file at:', testImagePath);
    }

    // Read the test file
    const fileContent = readFileSync(testImagePath);
    const file = new Blob([fileContent], { type: 'text/plain' });
    file.name = 'test-upload-' + Date.now() + '.txt';
    
    console.log('Uploading test file to basic content bucket...');
    
    // Upload the file
    const filePath = `test-uploads/${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('aplus-basic')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'text/plain'
      });
      
    if (uploadError) {
      console.error('Upload error:', uploadError);
      return;
    }
    
    console.log('✅ Upload successful!', uploadData);
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('aplus-basic')
      .getPublicUrl(filePath);
      
    console.log('Public URL:', publicUrl);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testUpload();
