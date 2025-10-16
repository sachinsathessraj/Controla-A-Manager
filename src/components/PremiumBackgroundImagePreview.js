import React, { useEffect, useState } from 'react';

const PremiumBackgroundImagePreview = ({ data, previewImageUrls, mode = 'desktop' }) => {
  const { 
    headline = 'Your Headline Here', 
    subheadline = 'Category Tag', // Changed from subHeadline to subheadline to match the data structure
    body = 'Your descriptive text goes here. This is a preview of how your content will look with the selected background image.', 
    fontColor = '#ffffff',
    backgroundImage,
    textAlignment = 'left' 
  } = data;
  
  const isMobile = mode === 'mobile';
  const [bgImageUrl, setBgImageUrl] = useState('');
  
  // Get the background image URL from previewImageUrls if available
  useEffect(() => {
    console.log('=== PremiumBackgroundImagePreview Debug ===');
    console.log('1. Received props:', { 
      data: { 
        ...data, 
        backgroundImage: typeof backgroundImage === 'string' ? 
          (backgroundImage.length > 50 ? `${backgroundImage.substring(0, 50)}...` : backgroundImage) : 
          '[Object]' 
      },
      previewImageUrls: previewImageUrls ? Object.keys(previewImageUrls) : 'No previewImageUrls',
      mode,
      isMobile
    });
    
    // First, check if we have a direct URL in the backgroundImage prop
    if (backgroundImage) {
      // Handle string URLs
      if (typeof backgroundImage === 'string') {
        // Check for various URL formats
        if (backgroundImage.startsWith('http') || 
            backgroundImage.startsWith('blob:') || 
            backgroundImage.startsWith('data:') ||
            backgroundImage.startsWith('/')) {
          console.log('2. Using direct background image URL from backgroundImage prop');
          setBgImageUrl(backgroundImage);
          return;
        }
        
        // Handle Supabase storage path
        if (backgroundImage.startsWith('aplus-premium/') || backgroundImage.includes('supabase')) {
          const publicUrl = `https://gecyohwgayxqdrmzqsfz.supabase.co/storage/v1/object/public/${backgroundImage.replace('aplus-premium/', '')}`;
          console.log('3. Using Supabase URL from backgroundImage prop:', publicUrl);
          setBgImageUrl(publicUrl);
          return;
        }
      }
    }
    
    // If no direct URL, check previewImageUrls
    if (previewImageUrls) {
      console.log('4. Checking previewImageUrls for background image');
      
      // Get all possible keys that might contain our image
      const possibleKeys = [
        // Try with module ID first
        `${data.id}_background`,
        `${data.id}_${isMobile ? 'mobile' : 'desktop'}`,
        // Then try generic keys
        'background',
        'backgroundImage',
        `${isMobile ? 'mobile' : 'desktop'}`,
        `${isMobile ? 'mobile' : 'desktop'}Background`,
        `${isMobile ? 'mobile' : 'desktop'}Image`,
        // Then try any other keys that might contain 'background' or 'image'
        ...Object.keys(previewImageUrls).filter(k => 
          k.toLowerCase().includes('background') || 
          k.toLowerCase().includes('image')
        )
      ];
      
      console.log('5. Possible keys to check:', possibleKeys);
      
      // Try each key until we find a match
      for (const key of possibleKeys) {
        if (previewImageUrls[key]) {
          console.log(`6. Found image in previewImageUrls['${key}']`);
          setBgImageUrl(previewImageUrls[key]);
          return;
        }
      }
      console.log('7. No matching image found in previewImageUrls');
    } else {
      console.log('8. No previewImageUrls provided');
    }
    
    // If we have a backgroundImage object with desktop/mobile properties
    if (backgroundImage && typeof backgroundImage === 'object') {
      const imageKey = isMobile ? 'mobile' : 'desktop';
      if (backgroundImage[imageKey]) {
        console.log(`8. Found ${imageKey} background image in object`);
        setBgImageUrl(backgroundImage[imageKey]);
        return;
      } else if (backgroundImage.desktop) {
        console.log('9. Falling back to desktop image from object');
        setBgImageUrl(backgroundImage.desktop);
        return;
      } else if (backgroundImage.backgroundImage) {
        console.log('10. Using backgroundImage from object');
        setBgImageUrl(backgroundImage.backgroundImage);
        return;
      }
    }
    
    // Handle Supabase storage path
    if (typeof backgroundImage === 'string' && 
        (backgroundImage.startsWith('aplus-premium/') || backgroundImage.includes('supabase'))) {
      const publicUrl = `https://gecyohwgayxqdrmzqsfz.supabase.co/storage/v1/object/public/${backgroundImage.replace('aplus-premium/', '')}`;
      console.log('11. Using Supabase URL:', publicUrl);
      setBgImageUrl(publicUrl);
      return;
    }
    
    console.log('11. No background image available, using fallback gradient');
    setBgImageUrl('');
  }, [backgroundImage, previewImageUrls, data.id]);

  // Main container styles
  const containerStyle = {
    width: isMobile ? '100%' : '1464px', // Fixed width for desktop
    height: isMobile ? '450px' : '600px', // Fixed height for desktop
    position: 'relative',
    overflow: 'hidden',
    margin: '10px auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundImage: bgImageUrl ? `url("${bgImageUrl}")` : 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    borderRadius: '0',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    border: 'none',
    backgroundAttachment: 'scroll',
    padding: 0 // Removed padding to maintain exact dimensions
  };

  // Text overlay container styles
  const overlayStyle = {
    position: 'absolute',
    left: isMobile ? '5%' : '55%', // Positioned on the left for desktop
    top: '50%',
    transform: 'translateY(-50%)',
    width: isMobile ? '90%' : '45%',
    maxWidth: isMobile ? '100%' : '600px',
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Slightly more transparent
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: isMobile ? '1.5rem' : '2.5rem',
    color: fontColor,
    textAlign: 'left',
    boxSizing: 'border-box',
    overflow: 'hidden',
    borderRadius: '0px',
    boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
    margin: 0,
    zIndex: 2
  };

  // Text styles
  const textStyles = {
    subHeadline: {
      fontSize: isMobile ? '0.7rem' : '0.875rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.15em',
      color: '#ffffff', // Changed to white
      margin: '0 0 12px 0',
      lineHeight: 1.2,
      opacity: 0.9,
      fontFamily: '"Helvetica Neue", Arial, sans-serif'
    },
    headline: {
      fontSize: isMobile ? '1.75rem' : '2.75rem',
      fontWeight: 700,
      margin: '0 0 16px 0',
      lineHeight: 1.1,
      color: '#ffffff',
      maxWidth: '100%',
      letterSpacing: '-0.02em',
      textShadow: '0 1px 3px rgba(0,0,0,0.3)',
      fontFamily: '"Helvetica Neue", Arial, sans-serif'
    },
    body: {
      fontSize: isMobile ? '0.95rem' : '1.1rem',
      lineHeight: 1.6,
      margin: '16px 0 0 0',
      color: 'rgba(255, 255, 255, 0.9)',
      maxWidth: '100%',
      fontWeight: 400,
      fontFamily: '"Helvetica Neue", Arial, sans-serif',
      letterSpacing: '0.01em',
      textShadow: '0 1px 2px rgba(0,0,0,0.2)'
    }
  };

  // Mobile-specific styles
  if (isMobile) {
    containerStyle.justifyContent = 'flex-end';
    containerStyle.backgroundPosition = 'center';
    containerStyle.maxWidth = '100%';
    containerStyle.height = '500px';
    containerStyle.padding = '0';
    
    overlayStyle.position = 'relative';
    overlayStyle.left = '0';
    overlayStyle.right = '0';
    overlayStyle.bottom = '0';
    overlayStyle.top = 'auto';
    overlayStyle.transform = 'none';
    overlayStyle.width = '100%';
    overlayStyle.maxWidth = '100%';
    overlayStyle.margin = '0';
    overlayStyle.padding = '1.5rem';
    overlayStyle.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    overlayStyle.borderRadius = '0';
    overlayStyle.borderLeft = 'none';
  }

  // Helper function to render HTML content safely
  const renderHTML = (content) => {
    if (!content) return null;
    return { __html: content };
  };

  return (
    <div style={containerStyle}>
      {/* Background overlay for better text readability */}
      {bgImageUrl && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.3)',
          zIndex: 1
        }} />
      )}
      <div style={overlayStyle}>
        <div style={textStyles.subHeadline}>
          {subheadline || 'Category Tag'}
        </div>
        {headline && (
          <h2 
            style={textStyles.headline}
            dangerouslySetInnerHTML={renderHTML(headline)}
          />
        )}
        {body && (
          <div style={textStyles.body}>
            <div 
              dangerouslySetInnerHTML={{
                __html: body
                  .replace(/color:[^;'"]*[;'"]/gi, '') // Remove any inline color styles
                  .replace(/<([a-z]+)([^>]*)>/gi, (match, tag, attrs) => {
                    // Add style="color: #ffffff !important" to all tags
                    if (tag.toLowerCase() === 'br') return match; // Skip <br> tags
                    return `<${tag} style="color: #ffffff !important; ${attrs}">`;
                  })
                  .replace(/\n/g, '<br />')
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PremiumBackgroundImagePreview;
