import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FaPlus, FaTrash, FaArrowUp, FaArrowDown, FaTimes } from 'react-icons/fa';
import './PremiumNavigationCarousel.css';

// Panel Component
const Panel = ({ panel, index, isActive, onSelect, onMoveUp, onMoveDown, onDelete, totalPanels }) => {
  const hasContent = panel.headline || panel.subheadline || panel.body || panel.image;
  const [imageSrc, setImageSrc] = useState(null);
  
  // Handle image source with cleanup
  useEffect(() => {
    let url = null;
    
    if (panel?.image) {
      if (typeof panel.image === 'string') {
        url = panel.image;
      } else if (panel.image.url) {
        url = panel.image.url;
      } else if (panel.image instanceof Blob) {
        url = URL.createObjectURL(panel.image);
      }
    }
    
    setImageSrc(url);
    
    // Cleanup function
    return () => {
      if (url && (panel?.image instanceof Blob)) {
        URL.revokeObjectURL(url);
      }
    };
  }, [panel?.image]);
  
  return (
    <div 
      className={`panel-item ${isActive ? 'active' : ''} ${!hasContent ? 'empty' : ''}`}
      onClick={() => onSelect(index)}
    >
      <div className="panel-header">
        <span className="panel-number">Panel {index + 1}</span>
        <div className="panel-actions">
          <button 
            className="btn-icon" 
            onClick={(e) => { e.stopPropagation(); onMoveUp(index); }}
            disabled={index === 0}
            title="Move up"
          >
            <FaArrowUp />
          </button>
          <button 
            className="btn-icon" 
            onClick={(e) => { e.stopPropagation(); onMoveDown(index); }}
            disabled={index === totalPanels - 1}
            title="Move down"
          >
            <FaArrowDown />
          </button>
          <button 
            className="btn-icon danger" 
            onClick={(e) => { e.stopPropagation(); onDelete(index); }}
            disabled={totalPanels <= 2}
            title="Delete panel"
          >
            <FaTimes />
          </button>
        </div>
      </div>
      {hasContent ? (
        <div className="panel-preview">
          {imageSrc && (
            <div className="image-preview">
              <img src={imageSrc} alt="Panel preview" />
            </div>
          )}
          <div className="panel-content">
            {panel.headline && <h4>{panel.headline}</h4>}
            {panel.subheadline && <p className="subheadline">{panel.subheadline}</p>}
          </div>
        </div>
      ) : (
        <div className="panel-empty">
          <div className="empty-state">
            <FaPlus />
            <span>Add content to panel {index + 1}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Panel Editor Component
const PanelEditor = ({ panel, index, onChange, onImageUpload }) => {
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        onImageUpload(index, file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTextChange = (field, value) => {
    onChange(index, { ...panel, [field]: value });
  };

  return (
    <div className="panel-editor">
      <h3>Panel {index + 1} Setup</h3>
      
      <div className="form-group">
        <label>Navigation Text *</label>
        <input
          type="text"
          className="form-control"
          value={panel.navigationText || ''}
          onChange={(e) => handleTextChange('navigationText', e.target.value)}
          placeholder="Enter navigation text"
          required
        />
      </div>

      <div className="form-group">
        <label>Sub-headline</label>
        <input
          type="text"
          className="form-control"
          value={panel.subheadline || ''}
          onChange={(e) => handleTextChange('subheadline', e.target.value)}
          placeholder="Enter sub-headline (optional)"
        />
      </div>

      <div className="form-group">
        <label>Headline</label>
        <input
          type="text"
          className="form-control"
          value={panel.headline || ''}
          onChange={(e) => handleTextChange('headline', e.target.value)}
          placeholder="Enter headline"
        />
      </div>

      <div className="form-group">
        <label>Body Text</label>
        <textarea
          className="form-control"
          value={panel.body || ''}
          onChange={(e) => handleTextChange('body', e.target.value)}
          placeholder="Enter your content here..."
          rows={5}
        />
      </div>

      <div className="form-group">
        <label>Image</label>
        <div 
          className="image-upload"
          onClick={() => fileInputRef.current.click()}
        >
          {panel.image || imagePreview ? (
            <div className="image-preview">
              <img 
                src={imagePreview || panel.image.url || panel.image} 
                alt="Panel preview" 
              />
              <div className="image-actions">
                <button 
                  type="button" 
                  className="btn btn-sm btn-outline-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTextChange('image', null);
                    setImagePreview('');
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="upload-placeholder">
              <FaPlus />
              <span>Upload Image (1464 × 600px recommended)</span>
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
        </div>
      </div>
    </div>
  );
};

// Main Component
const PremiumNavigationCarouselModule = ({
  data = {},
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  moduleIndex,
  modulesLength,
  showHeader = true,
  onCancel
}) => {
  const [activePanelIndex, setActivePanelIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [previewImageUrls, setPreviewImageUrls] = useState({});
  const fileInputRef = useRef(null);

  // Initialize with default panels if none exist
  useEffect(() => {
    const currentPanels = Array.isArray(data?.panels) ? data.panels : [];
    if (currentPanels.length === 0) {
      handlePanelChange([
        {
          id: uuidv4(),
          navigationText: 'Panel 1',
          headline: '',
          subheadline: '',
          body: '',
          image: null
        },
        {
          id: uuidv4(),
          navigationText: 'Panel 2',
          headline: '',
          subheadline: '',
          body: '',
          image: null
        }
      ]);
    }
  }, [data?.panels]);

  const handlePanelChange = (newPanels) => {
    console.group('handlePanelChange');
    
    const panelsWithPreservedImages = newPanels.map((panel, index) => {
      const existingPanel = data.panels?.find(p => p.id === panel.id);
      
      // If we have an existing panel with image data and the new panel doesn't have image data,
      // preserve the existing image data
      if (existingPanel?.image && !panel.image) {
        console.log(`Preserving image for panel ${panel.id} (index ${index})`);
        return { 
          ...panel, 
          image: existingPanel.image,
          // Preserve any file references
          ...(existingPanel._fileRef && { _fileRef: existingPanel._fileRef })
        };
      }
      
      return panel;
    });

    console.log('Updated panels with preserved images:', panelsWithPreservedImages);
    
    if (onChange) {
      onChange({ 
        ...data, 
        panels: panelsWithPreservedImages 
      });
    }
    
    console.groupEnd();
  };

  const handlePanelUpdate = (index, updatedPanel) => {
    console.group('handlePanelUpdate');
    console.log(`Updating panel at index ${index}:`, updatedPanel);
    
    const newPanels = [...(data.panels || [])];
    const currentPanel = newPanels[index] || {};
    
    // Determine if we're updating the image
    const isUpdatingImage = 'image' in updatedPanel;
    
    // Preserve existing image data if not being updated
    const updatedImage = isUpdatingImage 
      ? updatedPanel.image 
      : currentPanel.image;
    
    // Preserve file reference if it exists
    const fileRef = currentPanel._fileRef || (currentPanel.image?._fileRef);
    
    // Build the updated panel data
    const updatedPanelData = {
      ...currentPanel,
      ...updatedPanel,
      // Only include image if we're updating it
      ...(isUpdatingImage && {
        image: updatedImage,
        // Preserve file reference if it exists
        ...(fileRef && { _fileRef: fileRef })
      })
    };
    
    console.log('Updated panel data:', updatedPanelData);
    
    // Update the panels array
    newPanels[index] = updatedPanelData;
    
    // If we have a new image, update the preview URL
    if (isUpdatingImage && updatedPanel.image) {
      const panelId = updatedPanelData.id || `panel-${index}`;
      setPreviewImageUrls(prev => ({
        ...prev,
        [panelId]: updatedPanel.image.url
      }));
    }
    
    handlePanelChange(newPanels);
  };

  const handleAddPanel = () => {
    const currentPanels = Array.isArray(data?.panels) ? data.panels : [];
    if (currentPanels.length >= 5) {
      setToast({
        show: true,
        message: 'Maximum of 5 panels allowed',
        type: 'warning'
      });
      return;
    }
    
    const newPanel = {
      id: uuidv4(),
      navigationText: `Panel ${currentPanels.length + 1}`,
      headline: '',
      subheadline: '',
      body: '',
      image: null
    };
    
    const updatedPanels = [...currentPanels, newPanel];
    handlePanelChange(updatedPanels);
    setActivePanelIndex(updatedPanels.length - 1);
    
    setToast({
      show: true,
      message: 'Panel added successfully',
      type: 'success'
    });
  };

  const handleDeletePanel = (index) => {
    if (data.panels.length <= 2) {
      setToast({
        show: true,
        message: 'At least 2 panels are required',
        type: 'warning'
      });
      return;
    }
    
    console.group('handleDeletePanel');
    
    try {
      const panelToDelete = data.panels[index];
      const panelId = panelToDelete?.id || `panel-${index}`;
      
      console.log(`Deleting panel ${index} (ID: ${panelId})`);
      
      // Clean up any object URLs for this panel
      if (panelToDelete?.image?.url && panelToDelete.image.url.startsWith('blob:')) {
        console.log('Revoking object URL:', panelToDelete.image.url);
        URL.revokeObjectURL(panelToDelete.image.url);
      }
      
      // Create a new panels array without the deleted panel
      const newPanels = [...data.panels];
      newPanels.splice(index, 1);
      
      // Update the preview image URLs by removing the deleted panel
      setPreviewImageUrls(prev => {
        const newUrls = { ...prev };
        delete newUrls[panelId];
        console.log('Updated previewImageUrls after deletion:', newUrls);
        return newUrls;
      });
      
      // Adjust active panel index if needed
      let newActiveIndex = activePanelIndex;
      if (index === activePanelIndex) {
        newActiveIndex = Math.max(0, activePanelIndex - 1);
      } else if (index < activePanelIndex) {
        newActiveIndex = activePanelIndex - 1;
      }
      
      console.log('New active index:', newActiveIndex);
      
      // Update the panels
      handlePanelChange(newPanels);
      setActivePanelIndex(newActiveIndex);
      
      setToast({
        show: true,
        message: 'Panel deleted successfully',
        type: 'success'
      });
      
      console.log('Panel deletion completed');
    } catch (error) {
      console.error('Error deleting panel:', error);
      setToast({
        show: true,
        message: 'Failed to delete panel',
        type: 'error'
      });
    } finally {
      console.groupEnd();
    }
  };

  const handleMovePanel = (fromIndex, direction) => {
    const newPanels = [...(data.panels || [])];
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    
    if (toIndex >= 0 && toIndex < newPanels.length) {
      [newPanels[fromIndex], newPanels[toIndex]] = [newPanels[toIndex], newPanels[fromIndex]];
      handlePanelChange(newPanels);
      
      // Update active panel index if needed
      if (activePanelIndex === fromIndex) {
        setActivePanelIndex(toIndex);
      } else if (activePanelIndex === toIndex) {
        setActivePanelIndex(fromIndex);
      }
    }
  };

  const handleImageUpload = async (file, panelIndex) => {
    if (!file) return;
    
    console.group('handleImageUpload');
    console.log('Uploading file:', file.name, 'for panel index:', panelIndex);
    
    setIsUploading(true);
    setErrors(prev => ({ ...prev, image: null }));

    try {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('Image size must be less than 5MB');
      }

      // Create a local URL for preview
      const imageUrl = URL.createObjectURL(file);
      console.log('Created object URL for preview:', imageUrl);
      
      const newPanels = [...(data.panels || [])];
      const panelId = newPanels[panelIndex]?.id || `panel-${panelIndex}`;
      
      console.log('Current panel ID:', panelId);
      
      // Create a consistent image object that works with both editor and preview
      const imageData = {
        // For preview component
        url: imageUrl,
        // For form data submission
        file: file,
        // For display
        name: file.name,
        size: file.size,
        type: file.type,
        // For backward compatibility
        data: {
          url: imageUrl,
          name: file.name
        },
        // Store the file reference for persistence
        _fileRef: file,
        // Add timestamp to force re-render
        _timestamp: Date.now()
      };
      
      // Create a new panel with the image data
      const updatedPanel = {
        ...(newPanels[panelIndex] || {}),
        id: panelId,
        image: imageData,
        // Store the file reference at the panel level as well for easier access
        _fileRef: file
      };
      
      console.log('Updated panel with image:', updatedPanel);
      
      // Update the panels array
      const updatedPanels = [...newPanels];
      updatedPanels[panelIndex] = updatedPanel;
      
      // Update the state
      handlePanelChange(updatedPanels);
      
      // Update the preview image URLs
      setPreviewImageUrls(prev => {
        const newUrls = {
          ...prev,
          [panelId]: imageUrl
        };
        console.log('Updated previewImageUrls:', newUrls);
        return newUrls;
      });
      
      setToast({
        show: true,
        message: 'Image uploaded successfully',
        type: 'success'
      });
      
      console.log('Image upload completed successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      setErrors(prev => ({ ...prev, image: error.message }));
      setToast({
        show: true,
        message: error.message || 'Failed to upload image',
        type: 'error'
      });
    } finally {
      setIsUploading(false);
      console.groupEnd();
    }
  };

  const handleFieldChange = (panelIndex, field, value) => {
    const updatedPanels = [...(data.panels || [])];
    updatedPanels[panelIndex] = {
      ...updatedPanels[panelIndex],
      [field]: value
    };
    handlePanelChange(updatedPanels);
  };

  const handlePanelClick = (index) => {
    setActivePanelIndex(index);
  };

  if (!data.panels || data.panels.length === 0) {
    return <div>Loading...</div>;
  }

  const panels = data.panels || [];
  const activePanel = panels[activePanelIndex] || {};

  return (
    <div className="premium-navigation-carousel-editor">
      {showHeader && (
        <div className="module-header">
          <h2>Premium Navigation Carousel</h2>
          <div className="module-actions">
            {onMoveUp && (
              <button 
                className="btn btn-outline-secondary"
                onClick={onMoveUp}
                disabled={moduleIndex === 0}
                title="Move up"
              >
                <FaArrowUp />
              </button>
            )}
            {onMoveDown && (
              <button 
                className="btn btn-outline-secondary"
                onClick={onMoveDown}
                disabled={moduleIndex === modulesLength - 1}
                title="Move down"
              >
                <FaArrowDown />
              </button>
            )}
            {onDelete && (
              <button 
                className="btn btn-outline-danger"
                onClick={onDelete}
                title="Delete module"
              >
                <FaTrash />
              </button>
            )}
            {onCancel && (
              <button 
                className="btn btn-primary"
                onClick={onCancel}
              >
                Done
              </button>
            )}
          </div>
        </div>
      )}

      <div className="carousel-editor-container">
        <div className="panel-list">
          <div className="panel-list-header">
            <h4>Carousel Panels</h4>
            <button 
              className="btn btn-sm btn-primary"
              onClick={handleAddPanel}
              disabled={panels.length >= 5}
              title={panels.length >= 5 ? 'Maximum 5 panels allowed' : 'Add panel'}
            >
              <FaPlus /> Add Panel
            </button>
          </div>
          
          <div className="panels-container">
            {panels.map((panel, index) => (
              <Panel
                key={panel.id}
                panel={panel}
                index={index}
                isActive={index === activePanelIndex}
                onSelect={setActivePanelIndex}
                onMoveUp={(i) => handleMovePanel(i, 'up')}
                onMoveDown={(i) => handleMovePanel(i, 'down')}
                onDelete={handleDeletePanel}
                totalPanels={panels.length}
              />
            ))}
          </div>
        </div>

        <div className="panel-editor">
          <PanelEditor
            panel={activePanel}
            index={activePanelIndex}
            onChange={handlePanelUpdate}
            onImageUpload={handleImageUpload}
          />
        </div>
      </div>
      
      {toast.show && (
        <div 
          className={`toast show position-fixed top-0 end-0 m-3 ${
            toast.type === 'success' ? 'bg-success' : 
            toast.type === 'warning' ? 'bg-warning' : 'bg-danger'
          }`} 
          role="alert"
          style={{ zIndex: 1100 }}
        >
          <div className="d-flex">
            <div className="toast-body">
              {toast.message}
            </div>
            <button 
              type="button" 
              className="btn-close btn-close-white me-2 m-auto" 
              onClick={() => setToast(prev => ({ ...prev, show: false }))}
              aria-label="Close"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumNavigationCarouselModule;
