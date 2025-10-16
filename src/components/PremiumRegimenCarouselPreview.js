import React, { useState, useEffect } from 'react';
import '../css/PremiumRegimenCarousel.css';

const PremiumRegimenCarouselPreview = ({ data = {}, previewImageUrls, mode = 'desktop', showOverlay = true }) => {
  const [activePanelIndex, setActivePanelIndex] = useState(0);
  
  // Handle panel navigation
  const goToPanel = (index) => {
    setActivePanelIndex(index);
  };

  const goToPrev = () => {
    setActivePanelIndex(prev => (prev > 0 ? prev - 1 : data.panels.length - 1));
  };

  const goToNext = () => {
    setActivePanelIndex(prev => (prev < data.panels.length - 1 ? prev + 1 : 0));
  };
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  if (!data || !data.panels || data.panels.length === 0) {
    return (
      <div className="premium-regimen-carousel">
        <div className="empty-state">
          <p>No carousel content available</p>
        </div>
      </div>
    );
  }
  
  const activePanel = data.panels[activePanelIndex];

  // Calculate image dimensions based on mode
  const isMobile = mode === 'mobile';
  const containerStyle = {
    width: isMobile ? '100%' : '1464px',
    height: isMobile ? '300px' : '600px',
    maxWidth: isMobile ? '375px' : '1464px',
    margin: '0 auto',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    boxShadow: isMobile ? 'none' : '0 2px 8px rgba(0,0,0,0.1)'
  };

  const imageWrapperStyle = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#fff',
    padding: '20px'
  };

  const imageStyle = {
    maxWidth: '100%',
    maxHeight: '100%',
    width: 'auto',
    height: 'auto',
    display: 'block',
    margin: 'auto',
    objectFit: 'contain',
    objectPosition: 'center'
  };

  return (
    <div className="regimen-carousel-preview-container" style={containerStyle}>
      <div className="regimen-carousel-main-image-wrapper">
        {activePanel.image ? (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            backgroundColor: '#fff'
          }}>
            <img 
              src={activePanel.image} 
              alt={activePanel.title} 
              className="regimen-carousel-main-image"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                objectPosition: 'center',
                display: 'block',
                margin: 'auto'
              }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '';
                e.target.style.display = 'none';
                const placeholder = e.target.parentNode.querySelector('.regimen-carousel-image-placeholder');
                if (placeholder) {
                  placeholder.style.display = 'flex';
                }
              }}
            />
          </div>
        ) : (
          <div className="regimen-carousel-image-placeholder" style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999',
            fontSize: '16px',
            backgroundColor: '#f5f5f5'
          }}>
            No Image
          </div>
        )}
        
        {showOverlay && activePanel.title && (
          <div className="regimen-carousel-text-overlay">
            {activePanel.title && <h3>{activePanel.title}</h3>}
            {activePanel.text && <div dangerouslySetInnerHTML={{ __html: activePanel.text }} />}
          </div>
        )}

        <div className="arrow-container prev">
          <button className="regimen-preview-arrow" onClick={goToPrev}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="white" />
                  <stop offset="49%" stopColor="white" />
                  <stop offset="51%" stopColor="black" />
                  <stop offset="100%" stopColor="black" />
                </linearGradient>
              </defs>
              <path d="M 60,20 L 20,50 L 60,80" fill="none" stroke="url(#arrowGradient)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }} />
            </svg>
          </button>
        </div>
        <div className="arrow-container next">
          <button className="regimen-preview-arrow" onClick={goToNext}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="arrowGradientNext" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="white" />
                  <stop offset="49%" stopColor="white" />
                  <stop offset="51%" stopColor="black" />
                  <stop offset="100%" stopColor="black" />
                </linearGradient>
              </defs>
              <path d="M 40,20 L 80,50 L 40,80" fill="none" stroke="url(#arrowGradientNext)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }} />
            </svg>
          </button>
        </div>

        <div className="regimen-carousel-vertical-nav">
          {data.panels.map((panel, index) => (
            <button 
              key={panel.id || index}
              className={`regimen-carousel-nav-item ${index === activePanelIndex ? 'active' : ''}`}
              onClick={() => goToPanel(index)}
            >
              <span className="nav-item-number">{index + 1}</span>
              <span className="nav-item-text">{panel.navigationText}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PremiumRegimenCarouselPreview;
