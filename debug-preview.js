// Debug script to check preview loading
// Run this in the browser console when on the preview page

function debugPreview() {
  console.log('🔍 Debugging Preview Loading...');
  
  // Check if we're on the preview page
  const previewTab = document.querySelector('[data-tab="preview"]');
  if (!previewTab) {
    console.log('❌ Not on preview page');
    return;
  }
  
  // Check modules
  const modules = window.modules || [];
  console.log('📦 Modules found:', modules.length);
  
  modules.forEach((mod, idx) => {
    console.log(`Module ${idx + 1}:`, {
      id: mod.id,
      type: mod.type,
      image: mod.image,
      headline: mod.headline
    });
  });
  
  // Check preview image URLs
  const previewImageUrls = window.previewImageUrls || {};
  console.log('🖼️ Preview Image URLs:', previewImageUrls);
  
  // Check if images are loading
  const images = document.querySelectorAll('img');
  console.log('🖼️ Images on page:', images.length);
  
  images.forEach((img, idx) => {
    console.log(`Image ${idx + 1}:`, {
      src: img.src,
      alt: img.alt,
      width: img.width,
      height: img.height,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight
    });
  });
  
  // Check for errors
  const errors = [];
  images.forEach(img => {
    img.addEventListener('error', (e) => {
      errors.push({
        src: img.src,
        error: e
      });
    });
  });
  
  if (errors.length > 0) {
    console.log('❌ Image loading errors:', errors);
  } else {
    console.log('✅ No image loading errors detected');
  }
}

// Make it globally available
window.debugPreview = debugPreview;

console.log('🔧 Debug script loaded. Run debugPreview() to check preview loading.'); 