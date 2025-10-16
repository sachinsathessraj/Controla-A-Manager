// Test script for Supabase storage functionality
// Run this in the browser console to test storage access

import { checkStorageAccess, uploadImageToSupabase } from './src/database/supabaseStorage.js';

async function testStorage() {
  console.log('Testing Supabase storage access...');
  
  try {
    // Test storage access
    const hasAccess = await checkStorageAccess();
    console.log('Storage access check:', hasAccess ? 'SUCCESS' : 'FAILED');
    
    if (!hasAccess) {
      console.warn('Storage access failed. The app will use local storage fallback.');
      return;
    }
    
    // Create a test file
    const testBlob = new Blob(['test image data'], { type: 'image/png' });
    const testFile = new File([testBlob], 'test-image.png', { type: 'image/png' });
    
    // Test upload
    console.log('Testing image upload...');
    const uploadResult = await uploadImageToSupabase(testFile, 'test-uploads/test-image.png');
    console.log('Upload result:', uploadResult);
    
    if (uploadResult && uploadResult.startsWith('http')) {
      console.log('✅ Supabase storage is working correctly!');
    } else if (uploadResult && (uploadResult.startsWith('data:') || uploadResult.startsWith('local://'))) {
      console.log('✅ Local storage fallback is working correctly!');
    } else {
      console.error('❌ Upload failed');
    }
    
  } catch (error) {
    console.error('❌ Storage test failed:', error);
    console.log('The app will use local storage fallback.');
  }
}

// Export for use in browser console
window.testStorage = testStorage; 