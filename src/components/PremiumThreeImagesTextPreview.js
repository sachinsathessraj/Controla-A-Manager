import React from 'react';

const PremiumThreeImagesTextPreview = ({ data = {}, previewImageUrls = {}, mode = 'desktop' }) => {
  const { 
    headline = 'Headline',
    subheadline = 'Subheadline',
    body = '<p>Your content goes here</p>',
    ctaText = 'Learn More',
    ctaLink = '#',
    images = []
  } = data;

  // Ensure we have exactly 3 images
  const displayImages = Array(3).fill(null).map((_, index) => {
    const imgData = images[index] || {};
    const imageUrl = previewImageUrls[imgData.image] || imgData.image;
    return {
      ...imgData,
      url: imageUrl || '/placeholder-image.png',
      alt: imgData.altText || `Image ${index + 1}`
    };
  });

  return (
    <div className="premium-three-images-text-preview" style={{
      maxWidth: mode === 'desktop' ? '1464px' : '100%',
      margin: '0 auto',
      padding: mode === 'desktop' ? '40px 20px' : '20px 10px'
    }}>
      <div className="container">
        <div className="text-center mb-4">
          {subheadline && (
            <div className="subheadline" style={{
              fontSize: '1.1rem',
              color: '#666',
              marginBottom: '8px'
            }}>
              {subheadline}
            </div>
          )}
          <h2 className="mb-3" style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#333'
          }}>
            {headline}
          </h2>
          {body && (
            <div 
              className="mb-4" 
              style={{
                fontSize: '1.1rem',
                lineHeight: '1.6',
                color: '#555',
                maxWidth: '800px',
                margin: '0 auto'
              }}
              dangerouslySetInnerHTML={{ __html: body }}
            />
          )}
        </div>

        <div className="row g-4" style={{
          marginTop: '30px'
        }}>
          {displayImages.map((img, index) => (
            <div key={index} className="col-md-4">
              <div className="image-container" style={{
                position: 'relative',
                paddingBottom: '75%',
                overflow: 'hidden',
                borderRadius: '8px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }}>
                <img
                  src={img.url}
                  alt={img.alt}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                />
              </div>
              {img.caption && (
                <div className="mt-2 text-center" style={{
                  fontSize: '0.9rem',
                  color: '#666',
                  fontStyle: 'italic'
                }}>
                  {img.caption}
                </div>
              )}
            </div>
          ))}
        </div>

        {ctaText && (
          <div className="text-center mt-5">
            <a 
              href={ctaLink} 
              className="btn btn-primary"
              style={{
                padding: '10px 30px',
                fontSize: '1.1rem',
                fontWeight: '500',
                borderRadius: '30px',
                textDecoration: 'none',
                display: 'inline-block',
                transition: 'all 0.3s ease'
              }}
            >
              {ctaText}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default PremiumThreeImagesTextPreview;
