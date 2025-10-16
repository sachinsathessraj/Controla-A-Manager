import React, { useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaPlus, FaTimes, FaArrowUp, FaArrowDown, FaBold, FaItalic, FaUnderline, FaListUl, FaListOl } from 'react-icons/fa';
import { uploadImageToSupabase } from '../database/supabaseStorage';
import '../css/PremiumSimpleImageCarousel.css';

const MAX_PANELS = 6;
const MIN_PANELS = 2;

function PremiumSimpleImageCarousel({ data, onChange, onDelete, onMoveUp, onMoveDown, moduleIndex, modulesLength }) {
  const [activePanelIndex, setActivePanelIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // Initialize data structure if empty
  const moduleData = data || {
    title: 'Premium Simple Image Carousel',
    headline: '',
    body: '',
    panels: Array(MIN_PANELS).fill().map(() => ({
      image: '',
      headline: '',
      body: '',
      buttonText: '',
      asin: ''
    }))
  };

  const updateModuleData = (newData) => {
    const updatedData = { ...moduleData, ...newData };
    // Ensure panels always exists and is an array
    if (!Array.isArray(updatedData.panels)) {
      updatedData.panels = [{ image: '', headline: '', body: '', buttonText: '', asin: '' }];
    }
    onChange(updatedData);
  };

  const updatePanel = (index, panelData) => {
    const updatedPanels = [...moduleData.panels];
    updatedPanels[index] = { ...updatedPanels[index], ...panelData };
    updateModuleData({ panels: updatedPanels });
  };

  const addPanel = () => {
    const currentPanels = Array.isArray(moduleData?.panels) ? moduleData.panels : [];
    if (currentPanels.length >= MAX_PANELS) return;
    
    const newPanel = {
      image: '',
      headline: `Panel ${currentPanels.length + 1}`,
      body: '',
      buttonText: '',
      asin: ''
    };
    
    updateModuleData({
      panels: [...currentPanels, newPanel]
    });
    setActivePanelIndex(currentPanels.length);
  };

  const removePanel = (index) => {
    const currentPanels = Array.isArray(moduleData?.panels) ? moduleData.panels : [];
    if (currentPanels.length <= MIN_PANELS) return;
    
    const updatedPanels = currentPanels.filter((_, i) => i !== index);
    updateModuleData({ panels: updatedPanels });
    
    if (activePanelIndex >= updatedPanels.length) {
      setActivePanelIndex(Math.max(0, updatedPanels.length - 1));
    }
  };

  const handleImageUpload = async (e, panelIndex) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    
    // Check file type (only allow images)
    if (!file.type.startsWith('image/')) return;
    
    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) return;
    
    setIsUploading(true);
    
    try {
      const imageUrl = await uploadImageToSupabase(file, 'premium-carousel');
      if (imageUrl) {
        updatePanel(panelIndex, { image: imageUrl });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
      if (e?.target) e.target.value = '';
    }
  };

  const formatText = (format) => {
    document.execCommand(format, false);
  };

  // Safely get panels array with fallback to empty array
  const panels = Array.isArray(moduleData?.panels) ? moduleData.panels : [];
  
  // Initialize with default panel if empty
  const safePanels = panels.length > 0 
    ? panels 
    : [{ image: '', headline: '', body: '', buttonText: '', asin: '' }];
    
  // Ensure activePanelIndex is within bounds
  const safeActiveIndex = Math.min(Math.max(0, activePanelIndex), Math.max(0, safePanels.length - 1));
  const activePanel = safePanels[safeActiveIndex] || {};

  return (
    <div className="premium-simple-image-carousel">
          <div className="module-header">
        <div className="module-title">
          <h3>{moduleData.title || 'Premium Simple Image Carousel'}</h3>
          <div className="module-actions">
            <button 
              onClick={onMoveUp} 
              disabled={!onMoveUp}
              title="Move Up"
            >
              <FaArrowUp />
            </button>
            <button 
              onClick={onMoveDown} 
              disabled={!onMoveDown}
              title="Move Down"
            >
              <FaArrowDown />
            </button>
            <button 
              onClick={onDelete} 
              className="delete"
              title="Delete Module"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      </div>

      {/* Module Headline */}
      <div className="module-section">
        <label>Module Headline</label>
        <input 
          type="text" 
          value={moduleData.headline || ''}
          onChange={(e) => updateModuleData({ headline: e.target.value })}
          placeholder="Enter module headline"
        />
      </div>

      {/* Panels */}
      <div className="module-section">
        <div className="panel-selector">
          {safePanels.map((panel, index) => (
            <button
              key={index}
              className={`panel-tab ${index === activePanelIndex ? 'active' : ''}`}
              onClick={() => setActivePanelIndex(Math.min(Math.max(0, index), panels.length - 1))}
            >
              PANEL {String(index + 1).padStart(2, '0')}/{safePanels.length}
              {safePanels.length > MIN_PANELS && (
                <span 
                  className="remove-panel"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePanel(index);
                  }}
                >
                  <FaTimes />
                </span>
              )}
            </button>
          ))}
          {panels.length < MAX_PANELS && (
            <button className="add-panel" onClick={addPanel}>
              <FaPlus /> ADD PANEL
            </button>
          )}
        </div>

        {/* Panel Editor */}
        <div className="panel-editor">
          {/* Left side - Image Upload */}
          <div className="panel-image-upload">
            <div className="image-upload-area">
              {isUploading ? (
                <div className="upload-loader">
                  <div className="spinner"></div>
                  <div>Uploading image...</div>
                </div>
              ) : activePanel.image ? (
                <div className="image-preview-container">
                  <img 
                    src={activePanel.image} 
                    alt={`Panel ${activePanelIndex + 1}`} 
                    className="panel-image"
                    onError={(e) => {
                      console.error('Error loading image:', activePanel.image);
                      e.target.style.display = 'none';
                      e.target.nextElementSibling?.classList.add('show');
                    }}
                  />
                  <div className="image-error-message">
                    Error loading image. Click to upload a new one.
                  </div>
                  <label className="replace-image">
                    Replace Image
                    <input 
                      type="file" 
                      onChange={(e) => handleImageUpload(e, safeActiveIndex)}
                      style={{ display: 'none' }}
                      accept="image/jpeg, image/png, image/gif, image/webp"
                    />
                  </label>
                </div>
              ) : (
                <label className="empty-image">
                  <FaPlus />
                  <div>Click to add image</div>
                  <div className="image-size">Recommended: 1464 × 600 (Max: 5MB)</div>
                  <div className="supported-formats">Supported: JPG, PNG, GIF, WebP</div>
                  <input 
                    type="file" 
                    onChange={(e) => handleImageUpload(e, safeActiveIndex)}
                    style={{ display: 'none' }}
                    accept="image/jpeg, image/png, image/gif, image/webp"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Right side - Panel Settings */}
          <div className="panel-settings">
            <div className="form-group">
              <label>Panel Headline</label>
              <input 
                type="text" 
                value={activePanel.headline || ''}
                onChange={(e) => updatePanel(safeActiveIndex, { headline: e.target.value })}
                placeholder="Enter panel headline"
              />
            </div>


            <div className="form-group">
              <label>Button Text (CTA)</label>
              <input 
                type="text" 
                value={activePanel.buttonText || ''}
                onChange={(e) => updatePanel(safeActiveIndex, { buttonText: e.target.value })}
                placeholder="Enter button text"
              />
            </div>

            <div className="form-group">
              <label>ASIN (Link)</label>
              <input 
                type="text" 
                value={activePanel.asin || ''}
                onChange={(e) => updatePanel(safeActiveIndex, { asin: e.target.value })}
                placeholder="Enter ASIN"
              />
            </div>
          </div>
        </div>
      </div>

          {/* Module Body */}
          <div className="module-section">
            <label>Module Body Text</label>
            <textarea 
              value={moduleData.body || ''}
              onChange={(e) => updateModuleData({ body: e.target.value })}
              placeholder="Enter module body text"
              rows="3"
            />
          </div>
    </div>
  );
}

export default PremiumSimpleImageCarousel;
