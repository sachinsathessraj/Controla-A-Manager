// Import required modules
import { readFileSync, existsSync, writeFile } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { Blob } from 'buffer';
import { uploadImageToSupabase } from './supabaseStorage.js';
import https from 'https';

// Get current directory in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test image path
const testImagePath = join(__dirname, 'test-image.jpg');

// Download a sample image if it doesn't exist
async function downloadSampleImage() {
  if (!existsSync(testImagePath)) {
    console.log('Downloading sample image...');
    const url = 'https://picsum.photos/200/300.jpg';
    
    return new Promise((resolve, reject) => {
      https.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download image: ${response.statusCode}`));
          return;
        }
        
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          writeFile(testImagePath, buffer, (err) => {
            if (err) reject(err);
            else {
              console.log('Sample image downloaded to:', testImagePath);
              resolve();
            }
          });
        });
      }).on('error', reject);
    });
  }
  return Promise.resolve();
}

async function testUpload() {
  try {
    // First, ensure we have a sample image
    await downloadSampleImage();
    
    console.log('Starting image upload test...');
    
    // Read the test image
    const fileContent = readFileSync(testImagePath);
    const file = new Blob([fileContent], { type: 'image/jpeg' });
    file.name = 'test-upload-' + Date.now() + '.jpg';
    
    console.log('Uploading test image to basic content bucket...');
    const basicUrl = await uploadImageToSupabase(file, '', 'basic');
    console.log('✅ Basic content upload successful!');
    console.log('Public URL:', basicUrl);
    
    console.log('\nUploading test image to premium content bucket...');
    const premiumUrl = await uploadImageToSupabase(file, '', 'premium');
    console.log('✅ Premium content upload successful!');
    console.log('Public URL:', premiumUrl);
    
    console.log('\n🎉 All upload tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:');
    console.error(error);
    process.exit(1);
  }
}

testUpload();
