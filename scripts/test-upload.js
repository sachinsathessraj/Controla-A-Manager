import { supabase } from '../src/supabaseClient.js';

async function testUpload() {
  console.log('Testing Supabase Storage Upload...');
  
  // Test file data (small text file)
  const file = new File(['Hello, Supabase!'], 'test.txt', { type: 'text/plain' });
  
  try {
    console.log('Attempting to upload test file...');
    const { data, error } = await supabase.storage
      .from('test-bucket')
      .upload('test-upload.txt', file);
    
    if (error) {
      console.error('Upload error:', error);
      return;
    }
    
    console.log('Upload successful!', data);
    
    // Try to get public URL
    const { data: urlData } = supabase.storage
      .from('test-bucket')
      .getPublicUrl('test-upload.txt');
      
    console.log('Public URL:', urlData?.publicUrl);
    
  } catch (err) {
    console.error('Error in test upload:', err);
  }
}

testUpload();
