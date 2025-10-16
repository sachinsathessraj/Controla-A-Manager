import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import '../css/PremiumSimpleImageCarousel.css';

// No default images - will show placeholder if no image is provided

function PremiumSimpleImageCarouselPreview({ data = {} }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(null);
  
  // Process the data structure
  const panels = data.panels || [];
  
  // Get all valid images from panels
  const images = panels.length > 0 
    ? panels.map(panel => panel?.image).filter(Boolean)
    : [];
  
  // Navigation functions
  const goToPrev = () => setActiveIndex(prev => (prev === 0 ? Math.max(0, images.length - 1) : prev - 1));
  const goToNext = () => setActiveIndex(prev => (images.length === 0 ? 0 : (prev === images.length - 1 ? 0 : prev + 1)));
  
  // Get the current slide data
  useEffect(() => {
    const panelData = panels[activeIndex] || {};
    setCurrentSlide({
      headline: panelData.headline || data.headline || 'Add a headline here',
      body: panelData.body || data.body || 'Add your content here',
      buttonText: panelData.buttonText || data.buttonText || 'BUTTON TEXT',
      image: images[activeIndex] || ''
    });
  }, [activeIndex, panels, data, images]);
  
  if (!currentSlide) return <div className="carousel-placeholder">No content available</div>;
  
  return (
    <div className="premium-simple-image-carousel-preview">
      <div className="carousel-container">
        <div className="carousel-main">
          {currentSlide.image ? (
            <img 
              src={currentSlide.image} 
              alt={`Slide ${activeIndex + 1}`}
              className="carousel-image"
            />
          ) : (
            <div className="carousel-placeholder">
              <div>No image selected</div>
            </div>
          )}
          
          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button 
                className="carousel-arrow left" 
                onClick={goToPrev}
                aria-label="Previous image"
              >
                <FaChevronLeft />
              </button>
              <button 
                className="carousel-arrow right"
                onClick={goToNext}
                aria-label="Next image"
              >
                <FaChevronRight />
              </button>
              
              {/* Navigation Dots */}
              <div className="carousel-dots">
                {images.map((_, index) => (
                  <button
                    key={index}
                    className={`carousel-dot ${index === activeIndex ? 'active' : ''}`}
                    onClick={() => setActiveIndex(index)}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
          
          {/* Headline (outside overlay) */}
          {currentSlide.headline && (
            <h2 className="carousel-headline">{currentSlide.headline}</h2>
          )}
          
          {/* Overlay Content */}
          <div className="carousel-overlay">
            <div className="overlay-content">
              {currentSlide.body && (
                <div 
                  className="carousel-body-text"
                  dangerouslySetInnerHTML={{ 
                    __html: currentSlide.body.replace(/\n/g, '<br />') 
                  }} 
                />
              )}
              {currentSlide.buttonText && (
                <a href="#" className="cta-button">
                  {currentSlide.buttonText}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PremiumSimpleImageCarouselPreview;
