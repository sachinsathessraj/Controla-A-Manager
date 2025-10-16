import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  FaChevronLeft, 
  FaChevronRight, 
  FaGripVertical, 
  FaPlus, 
  FaTrash, 
  FaImage,
  FaBold,
  FaItalic,
  FaListUl,
  FaListOl
} from 'react-icons/fa';
import '../css/PremiumRegimenCarousel.css';

const PremiumRegimenCarousel = ({ data = {}, onChange, onDelete, onMoveUp, onMoveDown, moduleIndex, modulesLength }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [activePanelIndex, setActivePanelIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Initialize with default data or props
  const [carouselData, setCarouselData] = useState({
    headline: data.headline || 'YOUR REGIMEN HEADLINE',
    showCaption: true,
    panels: data.panels?.length ? [...data.panels] : [
      {
        id: uuidv4(),
        title: 'Step 1',
        description: 'Step description goes here',
        navigationText: 'Step 1',
        image: ''
      }
    ]
  });
  
  // Notify parent component of changes
  useEffect(() => {
    if (onChange) {
      onChange(carouselData);
    }
  }, [carouselData, onChange]);
  
  const activePanel = carouselData.panels[activePanelIndex] || {};

  // Handle panel changes
  const handlePanelChange = (index, field, value) => {
    const updatedPanels = [...carouselData.panels];
    updatedPanels[index] = { ...updatedPanels[index], [field]: value };
    setCarouselData(prev => ({ ...prev, panels: updatedPanels }));
  };
  
  // Toggle caption visibility
  const toggleCaption = () => {
    setCarouselData(prev => ({ ...prev, showCaption: !prev.showCaption }));
  };
  
  // Handle panel navigation
  const goToPanel = (index) => {
    if (isTransitioning || index === activePanelIndex) return;
    
    setIsTransitioning(true);
    setActivePanelIndex(index);
    
    // Reset transition state after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };
  
  // Navigate to next/previous panel
  const navigatePanel = (direction) => {
    const newIndex = direction === 'next'
      ? (activePanelIndex + 1) % carouselData.panels.length
      : (activePanelIndex - 1 + carouselData.panels.length) % carouselData.panels.length;
    goToPanel(newIndex);
  };

  // Add a new panel
  const addPanel = () => {
    if (carouselData.panels.length >= 5) return;
    
    const newPanel = {
      id: uuidv4(),
      title: `Step ${carouselData.panels.length + 1}`,
      description: '',
      navigationText: `Step ${carouselData.panels.length + 1}`,
      image: ''
    };
    
    setCarouselData({
      ...carouselData,
      panels: [...carouselData.panels, newPanel]
    });
    setActivePanelIndex(carouselData.panels.length);
  };

  // Remove a panel
  const removePanel = (index) => {
    if (carouselData.panels.length <= 1) return;
    
    const updatedPanels = carouselData.panels.filter((_, i) => i !== index);
    setCarouselData({ ...carouselData, panels: updatedPanels });
    
    if (activePanelIndex >= index && activePanelIndex > 0) {
      setActivePanelIndex(activePanelIndex - 1);
    }
  };

  // Handle drag and drop
  const handleDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget);
    setDraggedItem(index);
    setIsDragging(true);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    const newPanels = [...carouselData.panels];
    const [movedItem] = newPanels.splice(draggedItem, 1);
    newPanels.splice(index, 0, movedItem);
    
    setCarouselData({ ...carouselData, panels: newPanels });
    setDragOverIndex(null);
    setIsDragging(false);
    
    if (activePanelIndex === draggedItem) {
      setActivePanelIndex(index);
    } else if (activePanelIndex > draggedItem && activePanelIndex <= index) {
      setActivePanelIndex(activePanelIndex - 1);
    } else if (activePanelIndex < draggedItem && activePanelIndex >= index) {
      setActivePanelIndex(activePanelIndex + 1);
    }
  };

  // Handle image upload
  const handleImageUpload = (e, index) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const updatedPanels = [...carouselData.panels];
      updatedPanels[index] = { ...updatedPanels[index], image: reader.result };
      setCarouselData({ ...carouselData, panels: updatedPanels });
    };
    reader.readAsDataURL(file);
  };

  // Render the carousel preview
  const renderPreview = () => {
    if (!showPreview) return null;
    
    return (
      <div className="preview-container">
        <div className="preview-content">
          <div className="regimen-carousel-container">
            {/* Header bar */}
            <div className="regimen-header-bar">
              <span>{carouselData.headline || 'YOUR REGIMEN HEADLINE'}</span>
              <div className="carousel-indicators">
                {carouselData.panels.map((_, idx) => (
                  <button 
                    key={idx}
                    className={`indicator ${activePanelIndex === idx ? 'active' : ''}`}
                    onClick={() => goToPanel(idx)}
                    aria-label={`Go to step ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
            
            {/* Active slide */}
            <div className="regimen-slides-container">
              {carouselData.panels.length > 0 && (
                <div 
                  className={`regimen-carousel-slide ${isTransitioning ? 'transitioning' : ''} active`}
                  style={{
                    backgroundImage: activePanel.image ? `url(${activePanel.image})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative'
                  }}
                >
                  {!activePanel.image && (
                    <div className="regimen-step-image-placeholder">
                      <FaImage size={48} />
                      <span>Upload an image for this step</span>
                    </div>
                  )}
                  
                  <div className="regimen-slide-content">
                    {activePanel.title && carouselData.showCaption && (
                      <h3 className="regimen-step-title">{activePanel.title}</h3>
                    )}
                    
                    {activePanel.description && carouselData.showCaption && (
                      <div className="regimen-step-description">
                        <div dangerouslySetInnerHTML={{ __html: activePanel.description }} />
                      </div>
                    )}
                    
                    {/* Navigation arrows */}
                    <button 
                      className="regimen-arrow prev"
                      onClick={() => navigatePanel('prev')}
                      aria-label="Previous step"
                    >
                      <FaChevronLeft />
                    </button>
                    <button 
                      className="regimen-arrow next"
                      onClick={() => navigatePanel('next')}
                      aria-label="Next step"
                    >
                      <FaChevronRight />
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Navigation panel */}
            <div className="regimen-navigation">
              <h4>STEPS</h4>
              <ul className="regimen-steps-list">
                {carouselData.panels.map((panel, index) => (
                  <li 
                    key={panel.id}
                    className={`regimen-step-item ${index === activePanelIndex ? 'active' : ''}`}
                    onClick={() => goToPanel(index)}
                    aria-current={index === activePanelIndex ? 'step' : undefined}
                  >
                    <div className="step-number">{index + 1}</div>
                    <div className="step-info">
                      <div className="step-title">{panel.title || `Step ${index + 1}`}</div>
                      {panel.navigationText && (
                        <div className="step-desc">{panel.navigationText}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              
              {carouselData.panels.length < 5 && (
                <button 
                  className="btn btn-outline"
                  onClick={addPanel}
                  style={{ marginTop: '10px', width: '100%' }}
                >
                  <FaPlus style={{ marginRight: '5px' }} /> Add Step
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="premium-regimen-carousel">
      {/* Editor Header */}
      <div className="module-header">
        <div className="module-tabs">
          <button 
            className={`nav-tab ${!showPreview ? 'active' : ''}`}
            onClick={() => setShowPreview(false)}
            aria-pressed={!showPreview}
          >
            Editor
          </button>
          <button 
            className={`nav-tab ${showPreview ? 'active' : ''}`}
            onClick={() => setShowPreview(true)}
            aria-pressed={showPreview}
          >
            Preview
          </button>
        </div>
        <div className="module-actions">
          {onMoveUp && (
            <button 
              className="btn-action" 
              onClick={onMoveUp} 
              disabled={moduleIndex === 0}
              aria-label="Move module up"
            >
              <FaChevronLeft /> Move Up
            </button>
          )}
          {onMoveDown && (
            <button 
              className="btn-action" 
              onClick={onMoveDown} 
              disabled={moduleIndex === modulesLength - 1}
              aria-label="Move module down"
            >
              <FaChevronRight /> Move Down
            </button>
          )}
          <div className="divider"></div>
          <button 
            className="btn-action btn-delete" 
            onClick={onDelete}
            aria-label="Delete module"
          >
            <FaTrash /> Delete
          </button>
        </div>
      </div>

      {showPreview ? (
        renderPreview()
      ) : (
        <div className="regimen-content">
          {/* Left side - Editor */}
          <div className="regimen-editor">
            <div className="editor-header">
              <h3>Edit Carousel</h3>
              <div className="editor-actions">
                {onMoveUp && moduleIndex > 0 && (
                  <button 
                    className="btn btn-outline" 
                    onClick={onMoveUp}
                    aria-label="Move module up"
                  >
                    Move Up
                  </button>
                )}
                {onMoveDown && moduleIndex < modulesLength - 1 && (
                  <button 
                    className="btn btn-outline" 
                    onClick={onMoveDown}
                    aria-label="Move module down"
                  >
                    Move Down
                  </button>
                )}
                <button 
                  className="btn btn-outline" 
                  onClick={onDelete}
                  aria-label="Delete module"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="carousel-headline">Headline</label>
              <input
                id="carousel-headline"
                type="text"
                className="form-control"
                value={carouselData.headline}
                onChange={(e) => setCarouselData(prev => ({ ...prev, headline: e.target.value }))}
                placeholder="Enter carousel headline"
                aria-label="Carousel headline"
              />
            </div>
            
            <div className="form-group">
              <div className="form-check">
                <input
                  type="checkbox"
                  id="show-caption"
                  className="form-check-input"
                  checked={carouselData.showCaption}
                  onChange={toggleCaption}
                />
                <label className="form-check-label" htmlFor="show-caption">
                  Show caption on preview
                </label>
              </div>
            </div>
            
            <div className="form-group">
              <label>Active Panel: {activePanel.title || `Step ${activePanelIndex + 1}`}</label>
              
              <div className="form-group">
                <label>Panel Title</label>
                <input
                  type="text"
                  className="form-control"
                  value={activePanel.title || ''}
                  onChange={(e) => handlePanelChange(activePanelIndex, 'title', e.target.value)}
                  placeholder="Enter panel title"
                />
              </div>
            
              {/* Panel Description */}
              <div className="form-group">
                <label>Panel Description</label>
                <textarea
                  className="form-control"
                  value={activePanel.description || ''}
                  onChange={(e) => handlePanelChange(activePanelIndex, 'description', e.target.value)}
                  placeholder="Enter panel description"
                  rows="4"
                />
              </div>
              
              {/* Navigation Text */}
              <div className="form-group">
                <label>Navigation Text</label>
                <input
                  type="text"
                  className="form-control"
                  value={activePanel.navigationText || ''}
                  onChange={(e) => handlePanelChange(activePanelIndex, 'navigationText', e.target.value)}
                  placeholder="Enter navigation text"
                />
              </div>
              
              {/* Image Upload */}
              <div className="form-group">
                <label>Panel Image</label>
                <div className="image-upload-container">
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, activePanelIndex)}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="image-upload" className="image-upload-button">
                    <FaImage style={{ marginRight: '8px' }} />
                    {activePanel.image ? 'Change Image' : 'Upload Image'}
                  </label>
                  {activePanel.image && (
                    <div className="image-preview">
                      <img src={activePanel.image} alt="Preview" className="preview-image" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Right side - Panel List */}
          <div className="panel-list">
            <h4>Panels ({carouselData.panels.length}/5)</h4>
            {carouselData.panels.length === 0 ? (
              <div className="empty-state">
                <p>No panels added yet</p>
                <button className="btn btn-primary" onClick={addPanel}>
                  <FaPlus style={{ marginRight: '5px' }} /> Add First Panel
                </button>
              </div>
            ) : (
              <ul style={{ padding: 0, listStyle: 'none' }}>
                {carouselData.panels.map((panel, index) => {
                  const isActive = activePanelIndex === index;
                  const isDraggedOver = dragOverIndex === index;
                  const isBeingDragged = draggedItem === index && isDragging;
                  
                  return (
                    <li 
                      key={panel.id}
                      className={`panel-item 
                        ${isDraggedOver ? 'drag-over' : ''} 
                        ${isActive ? 'active' : ''}
                        ${isBeingDragged ? 'dragging' : ''}
                      `}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={() => {
                        setIsDragging(false);
                        setDragOverIndex(null);
                      }}
                      onClick={() => setActivePanelIndex(index)}
                      aria-selected={isActive}
                      role="option"
                    >
                      <div className="panel-item-content">
                        <div className="panel-drag-handle" aria-label="Drag to reorder">
                          <FaGripVertical />
                        </div>
                        <div className="panel-info">
                          <h4 className="panel-title">{panel.title || `Step ${index + 1}`}</h4>
                          <p className="panel-subtitle">
                            {panel.navigationText || `Step ${index + 1}`}
                          </p>
                        </div>
                        {carouselData.panels.length > 1 && (
                          <button 
                            className="btn btn-icon btn-remove" 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Are you sure you want to remove this panel?')) {
                                removePanel(index);
                              }
                            }}
                            aria-label={`Remove ${panel.title || `Step ${index + 1}`}`}
                          >
                            <FaTrash size={12} />
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            
            {carouselData.panels.length > 0 && carouselData.panels.length < 5 && (
              <button 
                className="btn btn-outline btn-add-panel"
                onClick={addPanel}
                disabled={carouselData.panels.length >= 5}
                aria-label="Add new panel"
              >
                <FaPlus style={{ marginRight: '5px' }} /> 
                {carouselData.panels.length === 0 ? 'Add First Panel' : 'Add Another Panel'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumRegimenCarousel;
