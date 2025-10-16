import React, { useState, useRef, useEffect } from 'react';
import { uploadImageToSupabase } from '../database/supabaseStorage';

// Constants for image dimensions
const DESKTOP_MIN_WIDTH = 1464;
const DESKTOP_MIN_HEIGHT = 600;
const MOBILE_MIN_WIDTH = 600;
const MOBILE_MIN_HEIGHT = 450;

const PremiumBackgroundImageModule = ({
  data = {},
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  moduleIndex,
  modulesLength,
}) => {
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
  const [isMobileUpload, setIsMobileUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [dragActive, setDragActive] = useState(false);
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

  const handleImageUpload = async (file, isMobile = false) => {
    if (!file) return false;

    // Check file type
    if (!file.type.match('image.*')) {
      setSaveMsg('Please select an image file (JPEG, PNG, etc.)');
      return false;
    }

    setIsUploading(true);
    setSaveMsg('Uploading image...');

    try {
      // Check image dimensions
      const { isValid } = await checkImageDimensions(file, isMobile);
      if (!isValid) return false;

      // Process and upload the image
      const result = await processAndSetImage(file, isMobile);
      
      if (result && result.success) {
        setSaveMsg('Image uploaded successfully!');
        setTimeout(() => setSaveMsg(''), 3000);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error uploading image:', error);
      setSaveMsg(`Error: ${error.message}`);
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  // Process and set the image after validation
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

  // Handle file selection via input
  const handleFileInput = (e, isMobile = false) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0], isMobile);
      // Reset the input to allow selecting the same file again
      e.target.value = '';
    }
  };

  // Rich text formatting
  const toggleBold = () => document.execCommand('bold', false, null);
  const toggleItalic = () => document.execCommand('italic', false, null);
  const toggleUnderline = () => document.execCommand('underline', false, null);
  const toggleQuote = () => document.execCommand('formatBlock', false, 'blockquote');
  const toggleList = (ordered = false) => {
    document.execCommand(ordered ? 'insertOrderedList' : 'insertUnorderedList', false, null);
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle file drop
  const handleDrop = (e, isMobile = false) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0], isMobile);
    }
  };



  // Render the image upload modal
  const renderImageModal = () => {
    const isMobile = isMobileUpload;
    const currentImage = isMobile ? moduleData.mobileBackgroundImage : moduleData.backgroundImage;
    const minWidth = isMobile ? MOBILE_MIN_WIDTH : DESKTOP_MIN_WIDTH;
    const minHeight = isMobile ? MOBILE_MIN_HEIGHT : DESKTOP_MIN_HEIGHT;

    return (
      <div style={styles.modalOverlay} onClick={() => setShowImageModal(false)}>
        <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
          <div style={styles.modalHeader}>
            <h3 style={styles.modalTitle}>
              {isMobile ? 'Mobile Background Image' : 'Desktop Background Image'}
            </h3>
            <button 
              style={styles.modalCloseButton}
              onClick={() => setShowImageModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
          </div>
          
          <div style={styles.modalBody}>
            {/* Device Toggle */}
            <div style={styles.deviceToggle}>
              <button
                onClick={() => setIsMobileUpload(false)}
                style={{
                  ...styles.deviceToggleButton,
                  ...(!isMobile ? styles.deviceToggleActive : {})
                }}
              >
                Desktop
              </button>
              <button
                onClick={() => setIsMobileUpload(true)}
                style={{
                  ...styles.deviceToggleButton,
                  ...(isMobile ? styles.deviceToggleActive : {})
                }}
              >
                Mobile
              </button>
            </div>
            
            {/* Upload Area */}
            <div 
              style={{
                ...styles.uploadArea,
                borderColor: dragActive ? '#3b82f6' : '#d1d5db',
                backgroundColor: dragActive ? '#f0f9ff' : '#f9fafb'
              }}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={(e) => handleDrop(e, isMobile)}
              onClick={() => (isMobile ? mobileFileInputRef : fileInputRef).current?.click()}
            >
              <div style={styles.uploadIcon}>📁</div>
              <div style={styles.uploadText}>
                {dragActive ? 'Drop your image here' : 'Drag & drop your image here, or click to browse'}
              </div>
              <div style={styles.uploadSubtext}>
                Minimum dimensions: {minWidth}×{minHeight}px
              </div>
              <input
                type="file"
                ref={isMobile ? mobileFileInputRef : fileInputRef}
                style={styles.fileInput}
                accept="image/*"
                onChange={(e) => handleFileInput(e, isMobile)}
              />
            </div>
            
            {/* Current Image Preview */}
            {currentImage && (
              <div style={styles.currentImageContainer}>
                <div style={styles.currentImageLabel}>
                  Current {isMobile ? 'Mobile' : 'Desktop'} Image:
                </div>
                <div style={styles.currentImageWrapper}>
                  <img 
                    src={currentImage} 
                    alt={`Current ${isMobile ? 'mobile' : 'desktop'} background`}
                    style={styles.currentImage}
                  />
                </div>
              </div>
            )}
            
            {/* Save Message */}
            {saveMsg && (
              <div style={{
                ...styles.saveMessage,
                color: saveMsg.includes('success') ? '#10b981' : '#ef4444'
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
            <button
              style={styles.primaryButton}
              onClick={() => {
                setShowImageModal(false);
                setSaveMsg('');
              }}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Done'}
            </button>
          </div>
        </div>
      </div>
    );
  };

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

          <button
            onClick={() => {
              setIsMobileUpload(false);
              setShowImageModal(true);
            }}
            style={styles.buttonPrimary}
          >
            + Add Background Image
          </button>
        </div>
      </div>

      {showImageModal && (
        <div style={styles.modalOverlay} onClick={() => setShowImageModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {isMobileUpload ? 'Mobile Background Image' : 'Desktop Background Image'}
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
                  {isMobileUpload 
                    ? 'Minimum dimensions: 600 × 450px (Recommended: 1200 × 900px)'
                    : 'Minimum dimensions: 1464 × 600px (Recommended: 2928 × 1200px)'}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={styles.fileInput}
                  accept="image/*"
                  onChange={(e) => handleFileInput(e, isMobileUpload)}
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
    maxWidth: '600px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
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
    padding: '16px'
  },
  uploadArea: {
    border: '2px dashed #d1d5db',
    borderRadius: '8px',
    padding: '32px',
    textAlign: 'center',
    backgroundColor: '#f9fafb',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginBottom: '16px',
    '&:hover': {
      borderColor: '#3b82f6',
      backgroundColor: '#f0f9ff'
    }
  },
  uploadIcon: {
    fontSize: '48px',
    color: '#9ca3af',
    marginBottom: '16px'
  },
  uploadText: {
    fontSize: '16px',
    color: '#4b5563',
    marginBottom: '8px'
  },
  uploadSubtext: {
    fontSize: '14px',
    color: '#9ca3af',
    marginBottom: '16px'
  },
  fileInput: {
    display: 'none'
  },
  saveMessage: {
    marginTop: '8px',
    fontSize: '14px',
    textAlign: 'center'
  }
};

export default PremiumBackgroundImageModule;
