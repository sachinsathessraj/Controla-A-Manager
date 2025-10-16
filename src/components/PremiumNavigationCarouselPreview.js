import React, { useState, useRef, useEffect } from 'react';
import '../css/PremiumNavigationCarousel.css';

// Device view types
const DEVICE_VIEWS = {
  DESKTOP: 'desktop',
  TABLET: 'tablet',
  MOBILE: 'mobile'
};

const PremiumNavigationCarouselPreview = ({ 
  data = {}, 
  previewImageUrls, 
  mode = 'desktop', 
  onImageChange, 
  onPanelRemove, 
  onPanelMove, 
  activePanelIndex = 0, 
  onPanelClick,
  previewMode = false,
  showDeviceTabs = true
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  const [deviceView, setDeviceView] = useState(DEVICE_VIEWS.DESKTOP);
  const [previewDimensions, setPreviewDimensions] = useState({ 
    width: '100%', 
    maxWidth: '1464px',
    aspectRatio: '16/6',
    minHeight: '400px'
  });
  
  const fileInputRef = useRef(null);
  
  // Ensure data has panels array
  const safeData = {
    ...data,
    panels: Array.isArray(data?.panels) ? data.panels : []
  };
  
  const goToSlide = (index) => {
    setActiveIndex(index);
    if (onPanelClick) onPanelClick(index);
  };
  
  const goToPrev = () => {
    const newIndex = activeIndex === 0 ? safeData.panels.length - 1 : activeIndex - 1;
    setActiveIndex(newIndex);
    if (onPanelClick) onPanelClick(newIndex);
  };
  
  const goToNext = () => {
    const newIndex = activeIndex === safeData.panels.length - 1 ? 0 : activeIndex + 1;
    setActiveIndex(newIndex);
    if (onPanelClick) onPanelClick(newIndex);
  };
  
  const handleFileInputChange = (e, index) => {
    const file = e.target.files?.[0];
    if (file && onImageChange) {
      handleImageUpload(file, index);
    }
    // Reset file input
    e.target.value = null;
  };
  
  const handleRemovePanel = (e, index) => {
    e.stopPropagation();
    if (onPanelRemove) onPanelRemove(index);
    // Adjust active index if needed
    if (index === activeIndex && index > 0) {
      setActiveIndex(index - 1);
      if (onPanelClick) onPanelClick(index - 1);
    }
  };
  
  const handleMovePanel = (e, fromIndex, direction) => {
    e.stopPropagation();
    if (onPanelMove) onPanelMove(fromIndex, direction);
  };
  
  const triggerFileInput = (e, index) => {
    e.stopPropagation();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => handleFileInputChange(e, index);
    input.click();
  };
  
  const panel = safeData.panels[activeIndex] || {};
  const minDimensions = { width: 1464, height: 600 }; // Minimum dimensions for desktop
  
  // Handle touch events for mobile swipe
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEndX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    
    const difference = touchStartX - touchEndX;
    const swipeThreshold = 50; // Minimum distance to trigger swipe
    
    if (Math.abs(difference) > swipeThreshold) {
      if (difference > 0) {
        // Swipe left - go to next
        goToNext();
      } else {
        // Swipe right - go to previous
        goToPrev();
      }
    }
    
    // Reset touch positions
    setTouchStartX(0);
    setTouchEndX(0);
  };

  // Handle image upload
  const handleImageUpload = async (file, index) => {
    if (!file || !onImageChange) return;
    
    try {
      // Create a preview URL
      const imageUrl = URL.createObjectURL(file);
      
      // Call the parent's onImageChange with the file and preview URL
      onImageChange(file, index, imageUrl);
    } catch (error) {
      console.error('Error creating image preview:', error);
    }
  };

  // Handle panel click
  const handlePanelClick = (index) => {
    if (onPanelClick) {
      onPanelClick(index);
    }
  };

  // Handle panel remove
  const handlePanelRemove = (e, index) => {
    e.stopPropagation();
    if (onPanelRemove) {
      onPanelRemove(index);
    }
  };

  // Handle panel move
  const handlePanelMove = (e, fromIndex, direction) => {
    e.stopPropagation();
    if (onPanelMove) {
      onPanelMove(fromIndex, direction);
    }
  };

  const renderPanelPreviews = () => {
    if (!safeData.panels || !Array.isArray(safeData.panels)) return null;
    
    return safeData.panels.map((panel, index) => (
      <div 
        key={panel.id || index}
        className={`panel-preview ${activePanelIndex === index ? 'active' : ''}`}
        onClick={() => onPanelClick && onPanelClick(index)}
      >
        <div className="panel-actions">
          <button 
            className="btn-remove-panel" 
            onClick={(e) => handlePanelRemove(e, index)}
            disabled={safeData.panels.length <= 2}
            title={safeData.panels.length <= 2 ? 'At least 2 panels required' : 'Remove panel'}
          >
            <i className="fas fa-times"></i>
          </button>
          <button 
            className="btn-move-up" 
            onClick={(e) => handlePanelMove(e, index, 'up')}
            disabled={index === 0}
            title="Move up"
          >
            <i className="fas fa-arrow-up"></i>
          </button>
          <button 
            className="btn-move-down" 
            onClick={(e) => handlePanelMove(e, index, 'down')}
            disabled={index === safeData.panels.length - 1}
            title="Move down"
          >
            <i className="fas fa-arrow-down"></i>
          </button>
        </div>
        
        <div className="panel-preview-content">
          {panel.image ? (
            <div className="image-container">
              <img 
                src={panel.image} 
                alt={`Panel ${index + 1}`} 
                className="panel-preview-image"
              />
              <div className="image-overlay">
                <button 
                  className="btn-replace"
                  onClick={(e) => triggerFileInput(e, index)}
                >
                  <i className="fas fa-sync-alt"></i> Replace Image
                </button>
              </div>
              <div className="dimension-info">
                Min: {minDimensions.width}×{minDimensions.height}px
              </div>
            </div>
          ) : (
            <div 
              className="panel-preview-placeholder"
              onClick={(e) => triggerFileInput(e, index)}
            >
              <i className="fas fa-image"></i>
              <div>Click to add image</div>
              <div className="dimension-hint">
                Min: {minDimensions.width}×{minDimensions.height}px
              </div>
            </div>
          )}
        </div>
      </div>
    ));
  };

  const renderSlide = (panel, index) => {
    if (!panel) return null;
    
    const imageUrl = getImageUrl(panel, index);
    const isActive = index === activeIndex;
    const hasImage = !!imageUrl;
    const panelId = panel.id || `panel-${index}`;
    
    // Skip rendering if no image in preview mode
    if (previewMode && !hasImage) {
      return null;
    }
    
    // Debug log
    console.log(`Rendering slide ${index} (${panelId}):`, {
      hasImage,
      imageUrl: imageUrl ? 'URL available' : 'No URL',
      panelImage: panel.image ? 'Has image data' : 'No image data'
    });
    
    return (
      <div 
        key={`slide-${panelId}`}
        className={`carousel-slide ${isActive ? 'active' : ''}`}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          backgroundColor: !hasImage ? '#f5f5f5' : 'transparent',
          display: hasImage || !previewMode ? 'block' : 'none',
          overflow: 'hidden'
        }}
        aria-label={`Slide ${index + 1}`}
      >
        {hasImage ? (
          <>
            <div 
              className="slide-background"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                zIndex: 1
              }}
            />
            <img 
              src={imageUrl} 
              alt={panel.headline || `Slide ${index + 1}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                position: 'relative',
                zIndex: 2,
                opacity: 0, // Hide but keep in DOM for error handling
                visibility: 'hidden'
              }}
              onLoad={(e) => {
                // Once image loads successfully, show it and hide the background
                e.target.style.opacity = 1;
                e.target.style.visibility = 'visible';
              }}
              onError={(e) => {
                console.error(`Failed to load image for panel ${panelId}:`, imageUrl);
                e.target.style.display = 'none';
                // Show error state
                const container = e.target.parentElement;
                if (container) {
                  container.style.backgroundColor = '#ffebee';
                  const errorMsg = document.createElement('div');
                  errorMsg.style.position = 'absolute';
                  errorMsg.style.top = '50%';
                  errorMsg.style.left = '50%';
                  errorMsg.style.transform = 'translate(-50%, -50%)';
                  errorMsg.style.color = '#d32f2f';
                  errorMsg.style.textAlign = 'center';
                  errorMsg.textContent = 'Image failed to load';
                  container.appendChild(errorMsg);
                }
              }}
            />
          </>
        ) : (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999',
            fontSize: '14px',
            backgroundColor: '#f5f5f5'
          }}>
            No image available
          </div>
        )}
      </div>
    );
  };

  // Track object URLs for cleanup
  const objectUrls = useRef(new Map());
  
  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrls.current.clear();
    };
  }, []);

  // Get image URL for the current panel with better handling of different data structures
  const getImageUrl = (panel, index) => {
    if (!panel) {
      console.log('No panel provided');
      return '';
    }
    
    const panelId = panel.id || `panel-${index}`;
    
    // Debug log to help track the panel data
    console.group(`Panel ${panelId} - Image Resolution`);
    console.log('Panel data:', panel);
    
    try {
      // 1. Check previewImageUrls first if available (for server-side images)
      if (previewImageUrls?.[panelId]) {
        console.log('Using previewImageUrls');
        return previewImageUrls[panelId];
      }
      
      // 2. Handle case where panel has no image
      if (!panel.image) {
        console.log('No image data found in panel');
        return '';
      }
      
      // 3. Handle direct string URL or base64
      if (typeof panel.image === 'string') {
        console.log('Using direct string URL/base64');
        return panel.image;
      }
      
      // 4. Handle File/Blob objects in image.file
      if (panel.image.file && (panel.image.file instanceof Blob || panel.image.file instanceof File)) {
        console.log('Using File/Blob from image.file');
        // Revoke previous URL if exists
        if (objectUrls.current.has(panelId)) {
          URL.revokeObjectURL(objectUrls.current.get(panelId));
        }
        const url = URL.createObjectURL(panel.image.file);
        objectUrls.current.set(panelId, url);
        return url;
      }
      
      // 5. Handle direct Blob/File in image (fallback)
      if (panel.image instanceof Blob || panel.image instanceof File) {
        console.log('Using direct File/Blob from image');
        if (objectUrls.current.has(panelId)) {
          URL.revokeObjectURL(objectUrls.current.get(panelId));
        }
        const url = URL.createObjectURL(panel.image);
        objectUrls.current.set(panelId, url);
        return url;
      }
      
      // 6. Handle image object with url property
      if (panel.image.url) {
        console.log('Using image.url:', panel.image.url);
        return panel.image.url;
      }
      
      // 7. Handle nested data structure
      if (panel.image.data) {
        if (typeof panel.image.data === 'string') {
          console.log('Using image.data string');
          return panel.image.data;
        }
        if (panel.image.data.url) {
          console.log('Using image.data.url:', panel.image.data.url);
          return panel.image.data.url;
        }
      }
      
      // 8. Check for previewImage property
      if (panel.previewImage) {
        console.log('Using panel.previewImage');
        return panel.previewImage;
      }
      
      console.log('No valid image source found');
      return '';
      
    } catch (error) {
      console.error('Error resolving image URL:', error);
      return '';
    } finally {
      console.groupEnd();
    }
  };

  // Update preview dimensions based on device view
  useEffect(() => {
    switch(deviceView) {
      case DEVICE_VIEWS.TABLET:
        setPreviewDimensions({
          width: '768px',
          maxWidth: '768px',
          aspectRatio: '4/5',
          minHeight: '600px'
        });
        break;
      case DEVICE_VIEWS.MOBILE:
        setPreviewDimensions({
          width: '375px',
          maxWidth: '375px',
          aspectRatio: '9/16',
          minHeight: '600px'
        });
        break;
      default: // DESKTOP
        setPreviewDimensions({
          width: '100%',
          maxWidth: '1464px',
          aspectRatio: '16/6',
          minHeight: '400px'
        });
    }
  }, [deviceView]);

  // Render the component
  // Ensure we only render if we have valid carousel data
  if (!data || !data.panels || data.panels.length === 0) {
    return (
      <div className="empty-carousel">
        <i className="fas fa-images"></i>
        <p>No panels added to carousel</p>
      </div>
    );
  }

  const currentPanel = safeData.panels[activeIndex] || {};
  const imageUrl = getImageUrl(currentPanel, activeIndex);

  // Render device view tabs with navigation text
  const renderDeviceTabs = () => {
    // Get navigation text from panels, filter out empty/undefined texts
    const navItems = safeData.panels
      .map(panel => panel.navigationText?.trim())
      .filter(Boolean);
    
    // If no navigation text is set, show default device tabs
    if (navItems.length === 0) {
      return (
        <div className="device-view-tabs">
          <button 
            className={`device-tab ${deviceView === DEVICE_VIEWS.DESKTOP ? 'active' : ''}`}
            onClick={() => setDeviceView(DEVICE_VIEWS.DESKTOP)}
            aria-label="Desktop view"
          >
            <i className="fas fa-desktop"></i>
            <span>Desktop</span>
          </button>
          <button 
            className={`device-tab ${deviceView === DEVICE_VIEWS.TABLET ? 'active' : ''}`}
            onClick={() => setDeviceView(DEVICE_VIEWS.TABLET)}
            aria-label="Tablet view"
          >
            <i className="fas fa-tablet-alt"></i>
            <span>Tablet</span>
          </button>
          <button 
            className={`device-tab ${deviceView === DEVICE_VIEWS.MOBILE ? 'active' : ''}`}
            onClick={() => setDeviceView(DEVICE_VIEWS.MOBILE)}
            aria-label="Mobile view"
          >
            <i className="fas fa-mobile-alt"></i>
            <span>Mobile</span>
          </button>
        </div>
      );
    }
    
    // Show navigation text as tabs when available
    return (
      <div className="navigation-tabs">
        {safeData.panels.map((panel, index) => (
          panel.navigationText && (
            <button
              key={`nav-${index}`}
              className={`nav-tab ${activeIndex === index ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`View ${panel.navigationText}`}
            >
              {panel.navigationText}
            </button>
          )
        ))}
      </div>
    );
  };

  return (
    <div className="preview-container">
      {showDeviceTabs && renderDeviceTabs()}
      <div 
        className={`premium-navigation-carousel ${mode} ${previewMode ? 'preview-mode' : ''}`}
        style={{
          width: previewDimensions.width,
          maxWidth: previewDimensions.maxWidth,
          aspectRatio: previewDimensions.aspectRatio,
          minHeight: previewDimensions.minHeight,
          margin: '0 auto'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
      <div className="carousel-container">
        <div className="carousel-slide">
          {imageUrl ? (
            <img 
              src={imageUrl}
              alt={currentPanel.headline || `Panel ${activeIndex + 1}`}
              className="carousel-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                const originalUrl = typeof currentPanel.image === 'string' 
                  ? currentPanel.image 
                  : currentPanel.image?.url;
                
                if (originalUrl && originalUrl !== e.target.src) {
                  e.target.src = originalUrl;
                  e.target.style.display = 'block';
                }
              }}
            />
          ) : (
            <div className="no-image">
              <i className="fas fa-image"></i>
              <span>No image</span>
              <div className="dimension-hint">
                Min: {minDimensions.width}×{minDimensions.height}px
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          {safeData.panels.length > 1 && (
            <div className="carousel-controls">
              <button 
                className="carousel-control prev"
                onClick={goToPrev}
                aria-label="Previous slide"
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <button 
                className="carousel-control next"
                onClick={goToNext}
                aria-label="Next slide"
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}

          {/* Caption */}
          {currentPanel.showCaption !== false && (
            <div className="carousel-caption">
              {currentPanel.subHeadline && (
                <div className="sub-headline">{currentPanel.subHeadline}</div>
              )}
              {currentPanel.headline && (
                <h2 className="headline">{currentPanel.headline}</h2>
              )}
              {currentPanel.body && (
                <div 
                  className="body-text"
                  dangerouslySetInnerHTML={{ __html: currentPanel.body }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    
    {/* Panel Previews */}
    {!previewMode && (
      <div className="panel-previews">
        {renderPanelPreviews()}
      </div>
    )}
  </div>
  );
};

export default PremiumNavigationCarouselPreview;
