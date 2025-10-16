import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../supabaseClient.js';

// Constants
const BUCKETS = {
  BASIC: 'aplus-basic',
  PREMIUM: 'aplus-premium'
};
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Helper function to get the appropriate bucket based on content type
function getBucketName(contentType = 'basic') {
  return contentType === 'premium' ? BUCKETS.PREMIUM : BUCKETS.BASIC;
}

// Log the Supabase client configuration
console.log('Supabase client initialized with URL:', supabase.supabaseUrl);

// Upload an image file to Supabase Storage and return its public URL
export async function uploadImageToSupabase(file, customPath = '', contentType = 'basic') {
  if (!file) {
    throw new Error('No file provided for upload');
  }

  console.log('Starting upload for file:', {
    name: file.name, 
    size: file.size, 
    type: file.type,
    customPath
  });

  // No authentication required for uploads
  console.log('Proceeding with file upload without authentication');

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    const errorMsg = `File size too large. Maximum allowed: ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    const errorMsg = 'Only JPG, PNG, GIF, and WebP images are allowed';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  
  try {
    // Sanitize filename
    const sanitizedFileName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.\-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_+|_+$/g, '');
    
    // Generate timestamp and unique ID for the file path
    const timestamp = new Date().toISOString().split('T')[0];
    const uniqueId = uuidv4().substring(0, 8);
    
    // Use custom path if provided, otherwise use the default path
    const storagePath = customPath || `uploads/${timestamp}/${uniqueId}_${sanitizedFileName}`;
    const bucketName = getBucketName(contentType);
    
    console.log('Generated storage path:', storagePath);
    console.log('Target bucket:', bucketName);

    console.log(`Attempting to upload to path: ${storagePath}`);
    
    // Upload options with metadata
    const uploadOptions = {
      cacheControl: '3600',
      upsert: false,  // Don't allow overwriting by default
      contentType: file.type || 'image/jpeg',
      metadata: {
        originalName: file.name,
        size: file.size,
        uploadedAt: new Date().toISOString()
      }
    };

    console.log('Upload options:', uploadOptions);
    
    // 1. First try to upload the file
    console.log(`Starting file upload to bucket: ${bucketName}`);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, file, uploadOptions);

    // 2. Handle upload errors
    if (uploadError) {
      console.error('Upload error details:', {
        message: uploadError.message,
        code: uploadError.error,
        status: uploadError.statusCode,
        details: uploadError
      });
      
      // Handle specific error cases
      if (uploadError.statusCode === '409' || uploadError.message.includes('already exists')) {
        console.log('File already exists, generating new filename...');
        // Generate a new filename with a timestamp to avoid conflicts
        const newStoragePath = `${storagePath.split('.').slice(0, -1).join('.')}_${Date.now()}.${file.name.split('.').pop()}`;
        console.log('Trying with new filename:', newStoragePath);
        
        // Retry with new filename
        const { data: retryData, error: retryError } = await supabase.storage
          .from(bucketName)
          .upload(newStoragePath, file, uploadOptions);
          
        if (retryError) {
          console.error('Retry upload failed:', retryError);
          throw new Error(`Upload failed: ${retryError.message}`);
        }
        
        // Get public URL for the uploaded file
        const { data: urlData } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(newStoragePath, 60 * 60 * 24 * 365 * 10); // 10 years
          
        console.log('Upload successful with new filename, URL:', urlData?.signedUrl);
        return urlData?.signedUrl || newStoragePath;
      }
      
      // If we get here, the upload failed
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // 3. If upload was successful, get the public URL
    console.log('Upload successful, generating public URL...');
    
    // First try to create a signed URL (works for private buckets too)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(storagePath, 60 * 60 * 24 * 365 * 10); // 10 years
    
    if (signedUrlData?.signedUrl) {
      console.log('Generated signed URL:', signedUrlData.signedUrl);
      return signedUrlData.signedUrl;
    }
    
    // Fallback to public URL if signed URL fails
    console.log('Signed URL failed, trying public URL...', signedUrlError);
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(storagePath);
      
    if (!publicUrlData?.publicUrl) {
      console.warn('Could not generate public URL, returning storage path');
      return storagePath; // Return the path as fallback
    }
    
    console.log('File uploaded successfully, public URL:', publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadImageToSupabase:', {
      error,
      message: error.message,
      stack: error.stack
    });
    
    // Provide more user-friendly error messages
    let errorMessage = error.message;
    
    if (error.message.includes('row-level security')) {
      errorMessage = 'Upload failed due to permission issues. Please ensure you are logged in and have the necessary permissions.';
    } else if (error.message.includes('already exists')) {
      errorMessage = 'A file with this name already exists. Please try again with a different name.';
    } else if (error.message.includes('not found')) {
      errorMessage = 'Storage bucket not found. Please check your configuration.';
    }
    
    throw new Error(`Failed to upload image: ${errorMessage}`);
  }
}

/**
 * Get an image from Supabase storage or return a placeholder
 * @param {string} imageId - The image path or URL
 * @returns {Promise<string>} The image URL or a placeholder
 */
export async function getLocalImage(imageId) {
  if (!imageId) {
    return getPlaceholderImage();
  }
  
  // If it's already a data URL or external URL, return as is
  if (imageId.startsWith('data:') || imageId.startsWith('http')) {
    return imageId;
  }
  
  // Handle placeholder images
  if (imageId.startsWith('placeholder://')) {
    return getPlaceholderImage();
  }
  
  // If it's a path, try to get the public URL
  try {
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKETS.BASIC) // Using BASIC as default for backward compatibility
      .getPublicUrl(imageId);
      
    if (publicUrl) {
      // Verify the image exists by making a HEAD request
      const response = await fetch(publicUrl, { method: 'HEAD' });
      if (response.ok) {
        return publicUrl;
      }
    }
    
    // Fallback to constructing the URL directly
    const fallbackUrl = `${supabase.supabaseUrl}/storage/v1/object/public/${BUCKETS.BASIC}/${encodeURIComponent(imageId)}`;
    const fallbackResponse = await fetch(fallbackUrl, { method: 'HEAD' });
    if (fallbackResponse.ok) {
      return fallbackUrl;
    }
    
    console.warn('Image not found, returning placeholder:', imageId);
    return getPlaceholderImage();
    
  } catch (error) {
    console.error('Error getting image:', error);
    return getPlaceholderImage();
  }
}

/**
 * Delete an image from Supabase storage
 * @param {string} imagePath - The path of the image to delete
 * @returns {Promise<boolean>} True if deletion was successful
 */
export async function deleteImage(imagePath) {
  if (!imagePath) return false;
  
  try {
    // Extract the path after the bucket name if it's a full URL
    let pathToDelete = imagePath;
    const bucketName = BUCKETS.BASIC; // Using BASIC as default for backward compatibility
    const bucketPrefix = `${bucketName}/`;
    const prefixIndex = imagePath.indexOf(bucketPrefix);
    
    if (prefixIndex !== -1) {
      pathToDelete = imagePath.substring(prefixIndex + bucketPrefix.length);
    }
    
    console.log('Deleting image:', pathToDelete);
    
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([pathToDelete]);
      
    if (error) {
      console.error('Error deleting image:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception while deleting image:', error);
    return false;
  }
}

/**
 * Get a base64 encoded SVG placeholder image
 * @returns {string} Base64 encoded SVG
 */
function getPlaceholderImage() {
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIFVuYXZhaWxhYmxlPC90ZXh0Pjwvc3Zn+==';
}

// Helper function to check if storage bucket exists and is accessible
export async function checkStorageAccess() {
  try {
    console.log('Checking access to storage buckets');
    
    // First, verify the bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    // Check both buckets
    const requiredBuckets = [BUCKETS.BASIC, BUCKETS.PREMIUM];
    const missingBuckets = requiredBuckets.filter(bucket => 
      !buckets.some(b => b.name === bucket)
    );
    
    if (missingBuckets.length > 0) {
      throw new Error(`Missing required buckets: ${missingBuckets.join(', ')}. Please create them in Supabase Dashboard.`);
    }
    if (listError) {
      console.error('Error listing buckets:', listError);
      throw new Error(`Storage access error: ${listError.message}`);
    }
    
    // Test access to both buckets
    for (const bucket of [BUCKETS.BASIC, BUCKETS.PREMIUM]) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list('', { limit: 1 });
        
      if (error) {
        console.warn(`Warning: Could not access bucket '${bucket}':`, error.message);
      } else {
        console.log(`Successfully accessed bucket: ${bucket}`);
      }
    }
      
    return true;
  } catch (error) {
    console.warn('Storage access check error:', error);
    return false;
  }
} 