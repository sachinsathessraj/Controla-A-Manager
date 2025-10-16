import React from 'react';

const PremiumFullImagePreview = ({ data = {}, previewImageUrls = {}, mode = 'desktop' }) => {
  const { 
    image = '',
    altText = '',
    link = ''
  } = data;

  // Use the preview image URL if available, otherwise fall back to the direct image URL
  const imageUrl = previewImageUrls[image] || image;

  const imageElement = (
    <img
      src={imageUrl || '/placeholder-full-image.png'}
      alt={altText || 'Full width image'}
      className="img-fluid w-100"
      style={{
        maxWidth: '100%',
        height: 'auto',
        display: 'block'
      }}
    />
  );

  return (
    <div className="acm-modal-card premium-full-image-container" data-module="premium-full-image">
      <div className="premium-full-image-preview" style={{
        width: '100%',
        maxWidth: mode === 'desktop' ? '1464px' : '100%',
        margin: '0 auto',
        position: 'relative',
        padding: '20px 0'
      }}>
        <div className="acm-modal-img-container" style={{
          width: '100%',
          maxWidth: '100%',
          margin: '0 auto',
          display: 'block',
          padding: '0 15px'
        }}>
          {link ? (
            <a href={link} target="_blank" rel="noopener noreferrer" style={{
              display: 'block',
              width: '100%',
              height: '100%'
            }}>
              {imageElement}
            </a>
          ) : (
            imageElement
          )}
        </div>
      </div>
    </div>
  );
};

export default PremiumFullImagePreview;
