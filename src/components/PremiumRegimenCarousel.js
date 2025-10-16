import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FaPlus, FaTrash, FaImage, FaChevronLeft, FaChevronRight, FaTimes, FaChevronUp, FaChevronDown, FaGripVertical } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';
import QuillEditor from './QuillEditor';
import '../css/PremiumRegimenCarousel.css';

const PremiumRegimenCarousel = ({ 
  data = {}, 
  onChange, 
  onDelete, 
  onMoveUp, 
  onMoveDown, 
  moduleIndex, 
  modulesLength, 
  showHeader = false, 
  onCancel,
  isLocked = false // New prop to control lock state
}) => {
  // Initialize with default data if none provided
  const [carouselData, setCarouselData] = useState({
    headline: '',
    showOverlay: true,
    panels: Array(3).fill().map((_, index) => ({
      id: uuidv4(),
      title: `Step ${index + 1}`,
      text: `<p>Detailed explanation for step ${index + 1}.</p>`,
      image: '',
      navigationText: `Step ${index + 1}`
    }))
  });

  const [activePanelIndex, setActivePanelIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const fileInputRef = useRef(null);
  const [fileInputKey, setFileInputKey] = useState(0); // Add key to force re-render
  
  // Initialize preview mode based on URL
  const [isPreviewMode, setIsPreviewMode] = useState(() => 
    typeof window !== 'undefined' ? window.location.pathname.includes('preview') : false
  );

  // Update carousel data when props change
  useEffect(() => {
    if (!data || Object.keys(data).length === 0) return;
    
    setCarouselData(prev => {
      // Create a clean version of current data for comparison
      const cleanPrev = {
        ...prev,
        panels: prev.panels?.map(({ _file, ...panel }) => panel) || []
      };
      
      // Ensure we don't lose any existing image data when updating
      const newData = {
        ...prev,
        ...data,
        panels: data.panels?.map((panel, index) => ({
          ...(prev.panels?.[index] || {}), // Preserve existing data including _file
          ...panel, // Apply new data
          // Preserve image data if it exists in either source
          image: panel.image || prev.panels?.[index]?.image || ''
        })) || []
      };
      
      // Only update if there are actual changes
      const cleanNewData = {
        ...newData,
        panels: newData.panels.map(({ _file, ...panel }) => panel)
      };
      
      const isSameData = JSON.stringify(cleanPrev) === JSON.stringify(cleanNewData);
      if (isSameData) {
        return prev;
      }
      
      console.log('Carousel data updated:', { 
        prev: cleanPrev, 
        new: cleanNewData,
        changed: !isSameData
      });
      
      return newData;
    });
  }, [data]);

  // Notify parent of changes only when necessary
  const prevCarouselDataRef = useRef();
  const changeTimeoutRef = useRef();
  
  // Memoize the clean data to prevent unnecessary re-renders
  const cleanData = useMemo(() => {
    if (!carouselData || Object.keys(carouselData).length === 0) return null;
    
    // Create a clean version without file references
    return {
      ...carouselData,
      panels: carouselData.panels?.map(panel => {
        const { _file, ...cleanPanel } = panel;
        return cleanPanel;
      }) || []
    };
  }, [
    carouselData?.headline,
    carouselData?.showOverlay,
    // Only recreate when panels array changes or panel data changes
    carouselData.panels?.map(p => ({
      title: p.title,
      text: p.text,
      image: p.image,
      navigationText: p.navigationText
    })).join('|')
  ]);
  
  // Notify parent of changes with debounce
  useEffect(() => {
    if (!onChange || !cleanData) return;
    
    // Skip if data hasn't changed
    if (JSON.stringify(prevCarouselDataRef.current) === JSON.stringify(cleanData)) {
      return;
    }
    
    // Clear any pending updates
    if (changeTimeoutRef.current) {
      clearTimeout(changeTimeoutRef.current);
    }
    
    // Debounce the update to prevent rapid-fire updates
    changeTimeoutRef.current = setTimeout(() => {
      console.log('Notifying parent of carousel changes');
      prevCarouselDataRef.current = cleanData;
      onChange(cleanData);
    }, 100);
    
    // Cleanup timeout on unmount
    return () => {
      if (changeTimeoutRef.current) {
        clearTimeout(changeTimeoutRef.current);
      }
    };
  }, [cleanData, onChange]);

  // Handle panel navigation
  const goToPanel = useCallback((index) => {
    if (isLocked) return;
    setActivePanelIndex(index);
  }, [isLocked]);

  const goToPrev = useCallback(() => {
    if (isLocked) return;
    setActivePanelIndex(prev => (prev > 0 ? prev - 1 : carouselData.panels.length - 1));
  }, [carouselData.panels.length, isLocked]);

  const goToNext = useCallback(() => {
    if (isLocked) return;
    setActivePanelIndex(prev => (prev < carouselData.panels.length - 1 ? prev + 1 : 0));
  }, [carouselData.panels.length, isLocked]);

  // Handle panel updates with proper image preservation
  const handlePanelChange = useCallback((index, field, value) => {
    if (isLocked) return;
    
    setCarouselData(prevData => {
      // Prevent removing existing image if one exists
      if (field === 'image' && !value && prevData.panels[index]?.image) {
        return prevData; // Skip update if trying to remove an existing image
      }
      
      const updatedPanels = [...prevData.panels];
      
      // If updating image field, make sure to preserve other image data
      if (field === 'image') {
        updatedPanels[index] = { 
          ...updatedPanels[index],
          [field]: value,
          _file: value ? updatedPanels[index]?._file : null
        };
      } else {
        updatedPanels[index] = { 
          ...updatedPanels[index],
          [field]: value
        };
      }
      
      return { ...prevData, panels: updatedPanels };
    });
  }, []);

  // Add a new panel
  const addPanel = useCallback(() => {
    if (isLocked) return;
    
    setCarouselData(prevData => ({
      ...prevData,
      panels: [
        ...prevData.panels,
        {
          id: uuidv4(),
          title: `Step ${prevData.panels.length + 1}`,
          text: `<p>Detailed explanation for step ${prevData.panels.length + 1}.</p>`,
          image: '',
          navigationText: `Step ${prevData.panels.length + 1}`
        }
      ]
    }));
  }, []);

  // Remove a panel only if it doesn't have an image
  const removePanel = useCallback((index) => {
    if (isLocked) return;
    
    if (carouselData.panels.length <= 1) return;
    
    // Prevent removing panels with images
    if (carouselData.panels[index]?.image) {
      console.log('Cannot remove panel with an image');
      return;
    }
    
    setCarouselData(prevData => ({
      ...prevData,
      panels: prevData.panels.filter((_, i) => i !== index)
    }));
    
    if (activePanelIndex >= index && activePanelIndex > 0) {
      setActivePanelIndex(prev => prev - 1);
    }
  }, [activePanelIndex, carouselData.panels]);

  // Handle drag and drop
  const handleDragStart = useCallback((e, index) => {
    if (isLocked) {
      e.preventDefault();
      return;
    }
    if (carouselData.panels[index]?.image) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget);
    setDraggedItem(index);
    setIsDragging(true);
  }, [carouselData.panels]);

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverIndex(null);
    }
  }, []);

  const handleDrop = useCallback((e, dropIndex) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLocked) return;
    if (typeof draggedItem !== 'number' || draggedItem === dropIndex) {
      setDragOverIndex(null);
      return;
    }
    
    // Prevent dropping if either source or target panel has an image
    if (carouselData.panels[draggedItem]?.image || carouselData.panels[dropIndex]?.image) {
      setDragOverIndex(null);
      setIsDragging(false);
      return;
    }
    
    setCarouselData(prevData => {
      const newPanels = [...prevData.panels];
      const [movedItem] = newPanels.splice(draggedItem, 1);
      newPanels.splice(dropIndex, 0, movedItem);
      
      return { ...prevData, panels: newPanels };
    });
    
    setDragOverIndex(null);
    setIsDragging(false);
    
    if (activePanelIndex === draggedItem) {
      setActivePanelIndex(dropIndex);
    } else if (activePanelIndex > draggedItem && activePanelIndex <= dropIndex) {
      setActivePanelIndex(prev => prev - 1);
    } else if (activePanelIndex < draggedItem && activePanelIndex >= dropIndex) {
      setActivePanelIndex(prev => prev + 1);
    }
  }, [draggedItem, activePanelIndex, carouselData.panels]);

  // Handle image upload with validation and error handling
  const handleImageUpload = useCallback((e, index) => {
    if (isLocked) return;
    
    const file = e?.target?.files?.[0];
    if (!file) {
      console.error('No file selected');
      return;
    }
    
    console.log('Selected file:', file.name, 'Type:', file.type, 'Size:', file.size);
    
    // Check file type (more flexible check)
    const validTypes = ['jpeg', 'jpg', 'png', 'gif', 'webp'];
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const fileType = file.type.split('/').pop()?.toLowerCase();
    
    if (!validTypes.includes(fileExt) && !validTypes.includes(fileType)) {
      alert('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }
    
    // Check file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('Image size must be less than 5MB');
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const imageData = event.target.result;
      console.log('File read successfully, updating panel:', index, 'Image data length:', imageData.length);
      
      // Update the panel with the new image data
      setCarouselData(prevData => {
        const updatedPanels = [...prevData.panels];
        updatedPanels[index] = { 
          ...updatedPanels[index],
          image: imageData, // Store as data URL
          _file: file // Store the file reference for potential future use
        };
        
        console.log('Updated panel with image:', updatedPanels[index]);
        
        // Create a clean version to pass to parent
        const cleanData = {
          ...prevData,
          panels: updatedPanels.map(({ _file, ...panel }) => panel)
        };
        
        // Notify parent of the change
        if (onChange) {
          onChange(cleanData);
        }
        
        return { ...prevData, panels: updatedPanels };
      });
      
      // Reset file input
      if (e.target) {
        e.target.value = '';
      }
      
      // Force re-render of file input
      setFileInputKey(prev => prev + 1);
    };
    
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      alert('Error reading image file. Please try again.');
      // Reset file input on error
      if (e.target) {
        e.target.value = '';
      }
    };
    
    reader.readAsDataURL(file);
  }, []);

  // Get the currently active panel
  const activePanel = useMemo(() => 
    carouselData.panels[activePanelIndex] || {},
    [carouselData.panels, activePanelIndex]
  );

  // Render overlay for preview mode
  const renderOverlay = useCallback(() => {
    if (!carouselData.showOverlay) return null;
    
    return (
      <div className="regimen-overlay">
        <h2 className="regimen-title">{activePanel?.title || 'Step Title'}</h2>
        <div 
          className="regimen-description" 
          dangerouslySetInnerHTML={{ __html: activePanel?.text || '<p>Step description goes here</p>' }}
        />
      </div>
    );
  }, [carouselData.showOverlay, activePanel]);

  // Get the image source, handling both data URLs and file paths
  const getImageSource = useCallback((image) => {
    if (!image) return null;
    // If it's already a data URL, return as is
    if (typeof image === 'string' && image.startsWith('data:')) {
      return { src: image, cleanup: null };
    }
    // If it's a file object, create a data URL
    if (image instanceof File || image instanceof Blob) {
      const url = URL.createObjectURL(image);
      return { src: url, cleanup: () => URL.revokeObjectURL(url) };
    }
    // If it's a path, make sure it's an absolute URL
    if (typeof image === 'string') {
      if (image.startsWith('http') || image.startsWith('https') || image.startsWith('/')) {
        return { src: image, cleanup: null };
      }
      return { src: `${window.location.origin}${image.startsWith('/') ? '' : '/'}${image}`, cleanup: null };
    }
    return null;
  }, []);

  // Store image sources to prevent flickering during navigation
  const imageSources = useMemo(() => {
    return carouselData.panels.reduce((acc, panel, index) => {
      if (panel.image) {
        acc[index] = getImageSource(panel.image);
      }
      return acc;
    }, {});
  }, [carouselData.panels, getImageSource]);

  // Cleanup all object URLs when component unmounts
  useEffect(() => {
    return () => {
      Object.values(imageSources).forEach(src => {
        if (src?.cleanup) {
          src.cleanup();
        }
      });
    };
  }, [imageSources]);
  
  // Render preview mode
  if (isPreviewMode) {
    console.log('Rendering preview with active panel:', activePanelIndex, 'Panel data:', activePanel);
    
    const currentImageSrc = activePanel?.image ? imageSources[activePanelIndex] : null;
    
    return (
      <div className="premium-regimen-carousel preview-mode">
        <div className="regimen-carousel-container">
          <div className="regimen-header">
            <h2>{carouselData.headline || 'YOUR REGIMEN HEADLINE'}</h2>
          </div>
          
          <div className="regimen-carousel-content">
            <div className="regimen-carousel-slide active">
              <div className="regimen-carousel-main-image-wrapper">
                {currentImageSrc ? (
                  <img 
                    key={`panel-image-${activePanelIndex}`}
                    src={currentImageSrc?.src || ''} 
                    alt={activePanel.title || 'Step Image'} 
                    className="regimen-carousel-main-image"
                    onError={(e) => {
                      console.error('Error loading image for panel', activePanelIndex, ':', currentImageSrc?.src);
                      e.target.style.display = 'none';
                    }}
                    onLoad={(e) => {
                      console.log('Image loaded successfully:', currentImageSrc?.src);
                    }}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'contain',
                      display: 'block',
                      maxWidth: '100%',
                      maxHeight: '100%',
                      opacity: 1,
                      transition: 'opacity 0.3s ease'
                    }}
                  />
                ) : (
                  <div className="regimen-carousel-image-placeholder">
                    <FaImage size={48} />
                    <span>No image selected</span>
                  </div>
                )}
                {renderOverlay()}
              </div>
            </div>
            
            <div className="regimen-carousel-navigation">
              <button 
                className="regimen-nav-button prev" 
                onClick={goToPrev}
                aria-label="Previous step"
              >
                <FaChevronLeft />
              </button>
              
              <div className="regimen-steps-indicator">
                {carouselData.panels.map((panel, index) => (
                  <button
                    key={panel.id}
                    className={`step-indicator ${index === activePanelIndex ? 'active' : ''}`}
                    onClick={() => goToPanel(index)}
                    aria-label={`Go to step ${index + 1}`}
                  />
                ))}
              </div>
              
              <button 
                className="regimen-nav-button next" 
                onClick={goToNext}
                aria-label="Next step"
              >
                <FaChevronRight />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Add lock overlay when module is locked
  const renderLockOverlay = () => (
    <div className="module-lock-overlay">
      <div className="lock-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 1C8.67619 1 6 3.67619 6 7V9H5C3.89543 9 3 9.89543 3 11V21C3 22.1046 3.89543 23 5 23H19C20.1046 23 21 22.1046 21 21V11C21 9.89543 20.1046 9 19 9H18V7C18 3.67619 15.3238 1 12 1ZM16 9V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V9H16Z" fill="currentColor"/>
        </svg>
      </div>
      <div className="lock-message">Module is locked for editing</div>
    </div>
  );

  // Render edit mode
  return (
    <div className={`premium-regimen-carousel ${isLocked ? 'is-locked' : ''}`}>
      {showHeader && (
        <div className="module-header">
          <div className="module-title">
            <span>Premium Regimen Carousel</span>
            <div className="module-actions">
              <button 
                className="btn-icon" 
                onClick={onMoveUp} 
                disabled={moduleIndex === 0}
                title="Move up"
              >
                <FaChevronUp />
              </button>
              <button 
                className="btn-icon" 
                onClick={onMoveDown} 
                disabled={moduleIndex === modulesLength - 1}
                title="Move down"
              >
                <FaChevronDown />
              </button>
              <button 
                className="btn-icon btn-delete" 
                onClick={onDelete}
                title="Delete module"
              >
                <FaTrash />
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="main-content">
        {/* Panel Selector */}
        <div className="panel-selector">
          <div className="panel-selector-list">
            {carouselData.panels.map((panel, index) => (
              <div 
                key={panel.id}
                className={`panel-selector-item ${index === activePanelIndex ? 'active' : ''}`}
                onClick={() => goToPanel(index)}
              >
                <div className="panel-selector-handle" draggable onDragStart={(e) => handleDragStart(e, index)}>
                  <FaGripVertical />
                </div>
                <div className="panel-selector-content">
                  <div className="panel-selector-title">
                    {panel.navigationText || `Step ${index + 1}`}
                  </div>
                  <div className="panel-selector-actions">
                    <button 
                      className="btn-icon btn-delete" 
                      onClick={(e) => {
                        e.stopPropagation();
                        removePanel(index);
                      }}
                      title="Delete panel"
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            <button 
              className="btn-add-panel"
              onClick={addPanel}
              title="Add new panel"
            >
              <FaPlus /> Add Step
            </button>
          </div>
        </div>
        
        {/* Panel Editor */}
        <div className="panel-editor">
          {carouselData.panels.length > 0 && (
            <>
              <div className="form-group">
                <label>Panel Title</label>
                <input
                  type="text"
                  value={activePanel?.title || ''}
                  onChange={(e) => handlePanelChange(activePanelIndex, 'title', e.target.value)}
                  placeholder="Enter panel title"
                />
              </div>
              
              <div className="form-group">
                <label>Panel Image</label>
                <div className="image-upload-container">
                  {activePanel?.image ? (
                    <div className="image-preview">
                      <img 
                        src={activePanel.image} 
                        alt="Preview" 
                        className="img-preview"
                        onError={(e) => {
                          console.error('Error loading image:', activePanel.image);
                          e.target.style.display = 'none';
                        }}
                        style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                      />
                      <div className="image-actions">
                        <button 
                          className="btn-remove-image"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Clear the image and file reference
                            handlePanelChange(activePanelIndex, 'image', '');
                            // Force re-render of file input
                            setFileInputKey(prev => prev + 1);
                          }}
                        >
                          Remove Image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="image-upload-placeholder"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <FaImage size={48} />
                      <span>Click to upload an image</span>
                      <input
                        key={`file-input-${fileInputKey}`}
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept="image/jpeg, image/png, image/gif, image/webp"
                        onChange={(e) => {
                          handleImageUpload(e, activePanelIndex);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                </div>
                <div className="image-upload-hint">
                  Recommended size: 1200x600px (2:1 aspect ratio)
                </div>
              </div>
              
              <div className="form-group">
                <label>Panel Description</label>
                <QuillEditor
                  value={activePanel?.text || ''}
                  onChange={(value) => handlePanelChange(activePanelIndex, 'text', value)}
                  placeholder="Enter panel description"
                />
              </div>
              
              <div className="form-group">
                <label>Navigation Text</label>
                <input
                  type="text"
                  value={activePanel?.navigationText || ''}
                  onChange={(e) => handlePanelChange(activePanelIndex, 'navigationText', e.target.value)}
                  placeholder="Enter navigation text"
                />
              </div>
              
              <div className="form-group form-checkbox">
                <input
                  type="checkbox"
                  id="showOverlay"
                  checked={carouselData.showOverlay}
                  onChange={(e) => setCarouselData(prev => ({
                    ...prev,
                    showOverlay: e.target.checked
                  }))}
                />
                <label htmlFor="showOverlay">Show text overlay on image</label>
              </div>
            </>
          )}
          
          {carouselData.panels.length === 0 && (
            <div className="no-panels-message">
              <p>No panels added yet. Click the "Add Step" button to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PremiumRegimenCarousel;
