import React, { useState, useRef, useEffect } from 'react';
import { uploadImageToSupabase } from '../database/supabaseStorage';

// Constants for image dimensions
const DESKTOP_MIN_WIDTH = 1464;
const DESKTOP_MIN_HEIGHT = 600;
const MOBILE_MIN_WIDTH = 600;
const MOBILE_MIN_HEIGHT = 350;

const PremiumBackgroundImageModule = ({
  data = {},
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  moduleIndex,
  modulesLength,
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [moduleData, setModuleData] = useState({
    subheadline: '',
    headline: '',
    body: '',
    fontColor: '#000000',
    textAlignment: 'left',
    backgroundImage: '',
    mobileBackgroundImage: '',
    ...data
  });

  const [showImageModal, setShowImageModal] = useState(false);
  const [dragActive, setDragActive] = useState({
    desktop: false,
    mobile: false
  });
  const [isUploading, setIsUploading] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const fileInputRef = useRef(null);
  const desktopFileInputRef = useRef(null);
  const mobileFileInputRef = useRef(null);

  const handleChange = (field, value) => {
    const updatedData = { ...moduleData, [field]: value };
    setModuleData(updatedData);
    if (onChange) onChange(updatedData);
  };

  const checkImageDimensions = (file, isMobile = false) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const minWidth = isMobile ? MOBILE_MIN_WIDTH : DESKTOP_MIN_WIDTH;
        const minHeight = isMobile ? MOBILE_MIN_HEIGHT : DESKTOP_MIN_HEIGHT;
        const isValid = img.width >= minWidth && img.height >= minHeight;
        
        if (!isValid) {
          setSaveMsg(`Error: Image must be at least ${minWidth}x${minHeight}px`);
        }
        
        resolve({
          width: img.width,
          height: img.height,
          isValid
        });
      };
      img.onerror = () => {
        setSaveMsg('Error: Could not load image');
        resolve({ isValid: false });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleDrag = (e, type, isActive) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({
      ...prev,
      [type]: isActive
    }));
  };

  const handleDrop = async (e, isMobile) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive({ desktop: false, mobile: false });
    
    const file = e.dataTransfer.files[0];
    if (file) {
      await handleImageUpload(file, isMobile);
    }
  };

  const handleImageUpload = async (file, isMobile = false) => {
    if (!file) return;

    // Define the field based on whether it's a mobile or desktop image
    const field = isMobile ? 'mobileBackgroundImage' : 'backgroundImage';
    let previewUrl = null;
    
    try {
      setIsUploading(true);
      setSaveMsg('Validating image...');

      // Check file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file (JPEG, PNG, etc.)');
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size should be less than 5MB');
      }

      // Create a preview URL for immediate display
      previewUrl = URL.createObjectURL(file);
      
      // Check image dimensions
      const img = new Image();
      img.src = previewUrl;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to load image'));
      });

      const minWidth = isMobile ? MOBILE_MIN_WIDTH : DESKTOP_MIN_WIDTH;
      const minHeight = isMobile ? MOBILE_MIN_HEIGHT : DESKTOP_MIN_HEIGHT;
      
      if (img.width < minWidth || img.height < minHeight) {
        throw new Error(`Image dimensions must be at least ${minWidth}x${minHeight}px`);
      }

      // First update with the preview URL for immediate display
      const tempData = { 
        ...moduleData, 
        [field]: previewUrl,
        // Store the original file for upload
        [`${field}File`]: file
      };
      setModuleData(tempData);
      if (onChange) onChange(tempData);

      // Upload to Supabase in the background
      setSaveMsg('Uploading image...');
      const filePath = `backgrounds/${Date.now()}-${file.name}`;
      const imageUrl = await uploadImageToSupabase(file, filePath, 'premium');
      
      if (!imageUrl) {
        throw new Error('Failed to upload image. Please try again.');
      }

      // Update with the permanent URL
      const updatedData = { 
        ...moduleData, 
        [field]: imageUrl,
        // Clear the file reference
        [`${field}File`]: undefined
      };
      setModuleData(updatedData);
      
      // Notify parent component of the change
      if (onChange) {
        onChange(updatedData);
      }

      setSaveMsg('Image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      setSaveMsg(`Error: ${error.message || 'Failed to upload image'}`);
      
      // Revert to previous state on error
      const revertedData = { 
        ...moduleData, 
        [field]: '',
        [`${field}File`]: undefined
      };
      setModuleData(revertedData);
      if (onChange) onChange(revertedData);
    } finally {
      // Clean up the object URL to avoid memory leaks
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      
      setIsUploading(false);
      // Clear the message after 3 seconds
      const timer = setTimeout(() => setSaveMsg(''), 3000);
      return () => clearTimeout(timer);
    }
  };

  const processAndSetImage = async (file, isMobile = false) => {
    try {
      const fileName = `${isMobile ? 'mobile-' : 'desktop-'}${Date.now()}-${file.name}`;
      const { url, error } = await uploadImageToSupabase(file, fileName, 'premium-backgrounds');
      
      if (error) throw new Error(error.message || 'Failed to upload image');
      
      // Update the appropriate image URL
      handleChange(isMobile ? 'mobileBackgroundImage' : 'backgroundImage', url);
      
      return { success: true, url };
    } catch (error) {
      console.error('Error processing image:', error);
      throw error;
    }
  };

  const handleFileInput = (e, isMobile = false) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0], isMobile);
      // Reset the input to allow selecting the same file again
      e.target.value = '';
    }
  };

  const toggleBold = () => document.execCommand('bold', false, null);
  const toggleItalic = () => document.execCommand('italic', false, null);
  const toggleUnderline = () => document.execCommand('underline', false, null);
  const toggleQuote = () => document.execCommand('formatBlock', false, 'blockquote');
  const toggleList = (ordered = false) => {
    document.execCommand(ordered ? 'insertOrderedList' : 'insertUnorderedList', false, null);
  };

  // Update local state when data prop changes
  useEffect(() => {
    setModuleData(prev => ({
      ...prev,
      ...data,
      subheadline: data.subheadline || '',
      headline: data.headline || '',
      body: data.body || '',
      fontColor: data.fontColor || '#000000',
      textAlignment: data.textAlignment || 'left',
      backgroundImage: data.backgroundImage || '',
      mobileBackgroundImage: data.mobileBackgroundImage || ''
    }));
  }, [data]);

  // Render the image preview area
  const renderImagePreview = (isMobile = false) => {
    const imageUrl = isMobile ? moduleData.mobileBackgroundImage : moduleData.backgroundImage;
    const previewHeight = isMobile ? '150px' : '250px';

    return (
      <div 
        style={{
          position: 'relative',
          width: '100%',
          cursor: 'pointer',
          marginBottom: '24px'
        }}
        onMouseEnter={() => setIsHovering(isMobile ? 'mobile' : 'desktop')}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div 
          style={{
            ...styles.previewContainer,
            height: previewHeight,
            backgroundImage: imageUrl ? `url("${imageUrl}")` : 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '4px',
            border: '1px solid #e5e7eb',
            marginBottom: '16px'
          }}
        >
          {!imageUrl ? (
            <div style={styles.placeholderText}>
              No image selected
            </div>
          ) : (isHovering === (isMobile ? 'mobile' : 'desktop')) && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              transition: 'opacity 0.2s ease',
              zIndex: 1,
            }}>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowImageModal(true);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ffffff',
                  color: '#111827',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
              >
                Replace Image
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render the image upload modal
  const renderImageModal = () => {
    if (!showImageModal) return null;
    
    const renderUploadArea = (isMobile) => {
      const minWidth = isMobile ? 600 : 1464;
      const minHeight = isMobile ? 450 : 600;
      const currentImage = isMobile ? moduleData.mobileBackgroundImage : moduleData.backgroundImage;
      const fileInputRef = isMobile ? mobileFileInputRef : fileInputRef;
      const deviceType = isMobile ? 'mobile' : 'desktop';
      
      return (
        <div key={deviceType} style={styles.uploadColumn}>
          <div style={styles.uploadLabel}>
            {isMobile ? '* Add mobile image' : '* Add desktop image'} 
            <span style={styles.dimensionsLabel}>[{minWidth}px × {minHeight}px min]</span>
          </div>
          <div 
            style={{
              ...styles.uploadArea,
              borderColor: dragActive[deviceType] ? '#3b82f6' : '#d1d5db',
              backgroundColor: dragActive[deviceType] ? '#f0f9ff' : '#f9fafb',
              height: isMobile ? '200px' : '250px',
              marginBottom: '16px'
            }}
            onDragEnter={(e) => handleDrag(e, deviceType, true)}
            onDragLeave={(e) => handleDrag(e, deviceType, false)}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => handleDrop(e, isMobile)}
            onClick={() => fileInputRef.current?.click()}
          >
            <div style={styles.uploadIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="#9CA3AF"/>
              </svg>
            </div>
            <div style={styles.uploadText}>
              Drag image here or
            </div>
            <div style={styles.uploadSubtext}>
              Click to select
            </div>
            <input
              type="file"
              ref={fileInputRef}
              style={styles.fileInput}
              accept="image/*"
              onChange={(e) => handleFileInput(e, isMobile)}
            />
          </div>
          
          {currentImage && (
            <button
              onClick={() => {
                handleChange(isMobile ? 'mobileBackgroundImage' : 'backgroundImage', '');
                setSaveMsg('Image removed');
                setTimeout(() => setSaveMsg(''), 3000);
              }}
              style={styles.removeButton}
            >
              Remove
            </button>
          )}
        </div>
      );
    };
    
    return (
      <div style={styles.modalOverlay}>
        <div style={styles.modalContent}>
          <div style={styles.modalHeader}>
            <h2 style={styles.modalTitle}>Add image</h2>
            <button 
              onClick={() => setShowImageModal(false)}
              style={{
                ...styles.actionButton,
                fontSize: '24px',
                lineHeight: '24px'
              }}
            >
              &times;
            </button>
          </div>
          
          <div style={styles.modalBody}>
            <div style={styles.uploadContainer}>
              {renderUploadArea(false)} {/* Desktop */}
              {renderUploadArea(true)}  {/* Mobile */}
            </div>
            
            {saveMsg && (
              <div style={{
                ...styles.saveMessage,
                color: saveMsg.includes('success') ? '#10b981' : '#ef4444',
                textAlign: 'center',
                marginTop: '16px'
              }}>
                {saveMsg}
              </div>
            )}
          </div>
          <div style={styles.modalFooter}>
            <button
              style={styles.secondaryButton}
              onClick={() => {
                setShowImageModal(false);
                setSaveMsg('');
              }}
              disabled={isUploading}
            >
              Cancel
            </button>
            <div style={{ flex: 1 }} />
            <button
              style={{
                ...styles.secondaryButton,
                marginRight: '8px',
                color: '#ef4444',
                border: '1px solid #fca5a5'
              }}
              onClick={() => {
                handleChange('mobileBackgroundImage', '');
                handleChange('backgroundImage', '');
                setSaveMsg('All images removed');
                setTimeout(() => setSaveMsg(''), 3000);
              }}
              disabled={isUploading}
            >
              Remove All
            </button>
            <button
              style={styles.primaryButton}
              onClick={() => {
                setShowImageModal(false);
                setSaveMsg('');
              }}
              disabled={isUploading}
            >
              Add
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Check if we're in preview mode
  const isPreview = window.location.pathname.includes('preview');
  
  // If in preview mode, only render the preview
  if (isPreview) {
    return (
      <div style={styles.previewContainer}>
        <div style={{
          width: '100%',
          height: '600px',
          position: 'relative',
          backgroundImage: moduleData.backgroundImage ? `url(${moduleData.backgroundImage})` : 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 10%'
        }}>
          <div style={{
            width: '35%',
            maxWidth: '400px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: '1.5rem',
            color: moduleData.fontColor || '#ffffff',
            textAlign: 'left'
          }}>
            {moduleData.subheadline && (
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                marginBottom: '0.75rem',
                lineHeight: 1.3,
                opacity: 0.9
              }}>
                {moduleData.subheadline}
              </div>
            )}
            {moduleData.headline && (
              <h2 style={{
                fontSize: '1.875rem',
                fontWeight: 700,
                margin: '0 0 1rem 0',
                lineHeight: 1.2
              }}>
                {moduleData.headline}
              </h2>
            )}
            {moduleData.body && (
              <div 
                style={{
                  fontSize: '1rem',
                  lineHeight: 1.6,
                  opacity: 0.9
                }}
                dangerouslySetInnerHTML={{ __html: moduleData.body }}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Regular editor view
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerTitle}>
          Premium Background Image with Text
          <span style={styles.aiBadge}>AI Ready</span>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.actionButton} onClick={() => onMoveUp?.()}>
            ↑
          </button>
          <button style={styles.actionButton} onClick={() => onMoveDown?.()}>
            ↓
          </button>
          <button style={styles.actionButton} onClick={onDelete}>
            ×
          </button>
        </div>
      </div>

      <div style={styles.content}>
        {/* Image Preview Section */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#111827' }}>Background Image</h3>
          <div style={{ marginBottom: '16px' }}>
            {renderImagePreview(false)} {/* Only Desktop Preview */}
          </div>
          <button
            onClick={() => setShowImageModal(true)}
            style={{
              ...styles.buttonPrimary,
              width: 'auto',
              padding: '8px 16px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="white"/>
            </svg>
            Add/Change Images
          </button>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Sub-headline</label>
          <input
            type="text"
            value={moduleData.subheadline}
            onChange={(e) => handleChange('subheadline', e.target.value)}
            placeholder="Enter subheadline text"
            style={styles.input}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Headline</label>
          <input
            type="text"
            value={moduleData.headline}
            onChange={(e) => handleChange('headline', e.target.value)}
            placeholder="Enter headline text"
            style={styles.input}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Body text</label>
          <div style={styles.toolbar}>
            <button type="button" style={styles.toolbarButton} onClick={toggleBold} title="Bold">
              <strong>B</strong>
            </button>
            <button type="button" style={styles.toolbarButton} onClick={toggleItalic} title="Italic">
              <em>I</em>
            </button>
            <button type="button" style={styles.toolbarButton} onClick={toggleUnderline} title="Underline">
              <u>U</u>
            </button>
            <div style={{ width: '1px', backgroundColor: '#d1d5db', margin: '0 4px' }} />
            <button type="button" style={styles.toolbarButton} onClick={toggleQuote} title="Quote">
              "
            </button>
            <button type="button" style={styles.toolbarButton} onClick={() => toggleList(false)} title="Bulleted list">
              •
            </button>
            <button type="button" style={styles.toolbarButton} onClick={() => toggleList(true)} title="Numbered list">
              1.
            </button>
          </div>
          <div
            contentEditable
            onInput={(e) => handleChange('body', e.currentTarget.innerHTML)}
            dangerouslySetInnerHTML={{ __html: moduleData.body || '' }}
            style={{
              ...styles.textarea,
              minHeight: '100px',
              outline: 'none',
              padding: '12px',
            }}
            placeholder="Enter body text"
          />
        </div>

        <div style={styles.footer}>
          <div style={styles.colorSwatches}>
            <label style={{ ...styles.label, margin: '0 8px 0 0' }}>Font color:</label>
            {['#000000', '#FFFFFF', '#4B5563'].map((color) => (
              <div
                key={color}
                title={color === '#000000' ? 'Black' : color === '#FFFFFF' ? 'White' : 'Gray'}
                style={{
                  ...styles.colorSwatch,
                  backgroundColor: color,
                  border: `2px solid ${moduleData.fontColor === color ? '#3b82f6' : 'transparent'}`,
                }}
                onClick={() => handleChange('fontColor', color)}
              />
            ))}
          </div>
        </div>
      </div>

      {showImageModal && (
        <div style={styles.modalOverlay} onClick={() => setShowImageModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                Add image
              </h3>
              <button style={styles.actionButton} onClick={() => setShowImageModal(false)}>
                ×
              </button>
            </div>
            
            <div style={styles.modalBody}>
              <div 
                style={styles.uploadArea}
                onClick={() => fileInputRef.current?.click()}
              >
                <div style={styles.uploadIcon}>📁</div>
                <div style={styles.uploadText}>
                  Drag & drop your image here, or click to browse
                </div>
                <div style={styles.uploadSubtext}>
                  Minimum dimensions: 1464 × 600px (Recommended: 2928 × 1200px)
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={styles.fileInput}
                  accept="image/*"
                  onChange={(e) => handleFileInput(e, false)}
                />
              </div>

              {saveMsg && (
                <div style={{
                  ...styles.saveMessage,
                  color: saveMsg.includes('success') ? '#10b981' : '#ef4444'
                }}>
                  {saveMsg}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles
const styles = {
  previewContainer: {
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    position: 'relative',
    overflow: 'hidden'
  },
  container: {
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    marginBottom: '16px',
    overflow: 'hidden',
    backgroundColor: 'white'
  },
  header: {
    backgroundColor: '#f8fafc',
    padding: '12px 16px',
    borderBottom: '1px solid #e2e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: 0,
    fontSize: '14px',
    fontWeight: '600',
    color: '#111827'
  },
  aiBadge: {
    backgroundColor: '#f0f9ff',
    color: '#0369a1',
    fontSize: '12px',
    fontWeight: '500',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid #bae6fd'
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  actionButton: {
    background: 'none',
    border: 'none',
    color: '#6b7280',
    cursor: 'pointer',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    '&:hover': {
      backgroundColor: '#f3f4f6'
    }
  },
  content: {
    padding: '16px',
    backgroundColor: 'white'
  },
  inputGroup: {
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '500',
    marginBottom: '4px',
    color: '#4b5563'
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
    '&:focus': {
      outline: 'none',
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 1px #3b82f6'
    }
  },
  textarea: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    minHeight: '100px',
    resize: 'vertical',
    lineHeight: '1.5',
    '&:focus': {
      outline: 'none',
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 1px #3b82f6'
    }
  },
  toolbar: {
    display: 'flex',
    gap: '4px',
    marginBottom: '8px',
    padding: '4px',
    backgroundColor: '#f3f4f6',
    borderRadius: '4px'
  },
  toolbarButton: {
    background: 'none',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 8px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#4b5563',
    '&:hover': {
      backgroundColor: '#e5e7eb'
    },
    '&.active': {
      backgroundColor: '#d1d5db',
      color: '#111827'
    }
  },
  footer: {
    padding: '16px',
    backgroundColor: 'white',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  colorSwatches: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  colorSwatch: {
    width: '24px',
    height: '24px',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      transform: 'scale(1.1)'
    }
  },
  buttonPrimary: {
    backgroundColor: '#0F82E4',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    '&:hover': {
      backgroundColor: '#0c6bc5'
    }
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '800px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column'
  },
  modalHeader: {
    padding: '16px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827'
  },
  modalBody: {
    padding: '24px',
    flex: '1 1 auto',
    overflowY: 'auto'
  },
  uploadContainer: {
    display: 'flex',
    gap: '24px',
    marginBottom: '16px'
  },
  uploadColumn: {
    flex: 1,
    minWidth: 0
  },
  uploadLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '8px',
    color: '#374151'
  },
  dimensionsLabel: {
    color: '#6b7280',
    fontWeight: 'normal',
    marginLeft: '4px'
  },
  previewWrapper: {
    position: 'relative',
    width: '100%',
    marginBottom: '24px',
  },
  previewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  previewTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#111827',
  },
  previewContainer: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#f3f4f6',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  placeholderText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: '#6b7280',
    fontSize: '14px',
    textAlign: 'center',
    width: '100%',
  },
  uploadArea: {
    border: '2px dashed #d1d5db',
    borderRadius: '8px',
    padding: '32px 16px',
    textAlign: 'center',
    backgroundColor: '#f9fafb',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    '&:hover': {
      borderColor: '#3b82f6',
      backgroundColor: '#f0f9ff'
    }
  },
  uploadIcon: {
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#9ca3af'
  },
  uploadText: {
    fontSize: '14px',
    color: '#4b5563',
    marginBottom: '4px',
    fontWeight: '500'
  },
  uploadSubtext: {
    fontSize: '13px',
    color: '#9ca3af',
    marginBottom: '0'
  },
  fileInput: {
    display: 'none'
  },
  saveMessage: {
    marginTop: '16px',
    fontSize: '14px',
    textAlign: 'center',
    padding: '8px 12px',
    borderRadius: '4px',
    backgroundColor: 'rgba(16, 185, 129, 0.1)'
  },
  modalFooter: {
    padding: '16px 24px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderBottomLeftRadius: '8px',
    borderBottomRightRadius: '8px'
  },
  primaryButton: {
    backgroundColor: '#0F82E4',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 20px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#0c6bc5'
    },
    '&:disabled': {
      backgroundColor: '#9ca3af',
      cursor: 'not-allowed'
    }
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    color: '#4b5563',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: '#f3f4f6'
    },
    '&:disabled': {
      opacity: 0.6,
      cursor: 'not-allowed'
    }
  },
  removeButton: {
    backgroundColor: 'transparent',
    color: '#dc2626',
    border: '1px solid #fca5a5',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: '#fef2f2'
    }
  }
};

export default PremiumBackgroundImageModule;
