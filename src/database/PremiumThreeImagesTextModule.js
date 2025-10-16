import React, { useState, useEffect } from 'react';
import { uploadImageToSupabase } from './supabaseStorage';

function PremiumThreeImagesTextModule({ data, onChange, onDelete, onMoveUp, onMoveDown, moduleIndex, modulesLength }) {
  const [imgErrors, setImgErrors] = useState(['', '', '']);
  const [imgUrls, setImgUrls] = useState(['', '', '']);
  const [dragActive, setDragActive] = useState([false, false, false]);
  const [showImgModal, setShowImgModal] = useState(false);
  const [pendingImg, setPendingImg] = useState(null);
  const [pendingImgFile, setPendingImgFile] = useState(null);
  const [pendingImgDims, setPendingImgDims] = useState({ width: 0, height: 0 });
  const [pendingIdx, setPendingIdx] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Initialize image URLs from data
  useEffect(() => {
    if (data.images && data.images.length > 0) {
      setImgUrls([...data.images, '', '', ''].slice(0, 3));
    }
  }, [data.images]);
  
  function handleItemHeadlineChange(idx, e) {
    const newHeadlines = [...(data.itemHeadlines || ['', '', ''])];
    newHeadlines[idx] = e.target.value;
    onChange({ ...data, itemHeadlines: newHeadlines });
  }

  async function handleImageChange(idx, file) {
    if (!file) return;
    
    // Check if the file is an image
    if (!file.type.startsWith('image/')) {
      const newErrors = [...imgErrors];
      newErrors[idx] = 'Please upload a valid image file';
      setImgErrors(newErrors);
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      const newErrors = [...imgErrors];
      newErrors[idx] = 'Image size should be less than 5MB';
      setImgErrors(newErrors);
      return;
    }
    
    // Clear any previous error
    const newErrors = [...imgErrors];
    newErrors[idx] = '';
    setImgErrors(newErrors);
    
    try {
      setIsUploading(true);
      
      // Upload the image to Supabase
      const imageUrl = await uploadImageToSupabase(
        file, 
        `three-images/${data.id || 'temp'}/${idx}/${Date.now()}_${file.name}`, 
        'premium'
      );
      
      // Update the images array with the new URL (ensure it has exactly 3 items)
      const newImages = [...(data.images || [])];
      // Ensure we have exactly 3 items in the array
      while (newImages.length < 3) newImages.push('');
      newImages[idx] = imageUrl;
      
      // Update the component state
      const newUrls = [...imgUrls];
      newUrls[idx] = imageUrl;
      setImgUrls(newUrls);
      
      // Update the parent component
      onChange({ ...data, images: newImages });
    } catch (error) {
      console.error('Error uploading image:', error);
      const uploadErrors = [...imgErrors];
      uploadErrors[idx] = 'Failed to upload image. Please try again.';
      setImgErrors(uploadErrors);
    } finally {
      setIsUploading(false);
    }
  }
  
  function handleImgModalCancel() {
    setShowImgModal(false);
    setPendingImg(null);
    setPendingImgFile(null);
    setPendingImgDims({ width: 0, height: 0 });
    setPendingIdx(null);
  }
  
  function handleImgModalRemove() {
    if (pendingIdx === null || pendingIdx < 0 || pendingIdx > 2) return;
    
    const newImages = [...(data.images || [])];
    newImages[pendingIdx] = '';
    
    const newUrls = [...imgUrls];
    newUrls[pendingIdx] = '';
    
    onChange({ ...data, images: newImages });
    setImgUrls(newUrls);
    
    // Reset the file input
    const fileInput = document.getElementById(`three-img-upload-${data.id}-${pendingIdx}`);
    if (fileInput) {
      fileInput.value = '';
    }
    
    handleImgModalCancel();
  }
  
  async function handleImgModalAdd() {
    if (!pendingImgFile || pendingIdx === null) return;
    
    try {
      setIsUploading(true);
      
      // Upload the image to Supabase
      const imageUrl = await uploadImageToSupabase(
        pendingImgFile, 
        `three-images/${data.id || 'temp'}/${pendingIdx}/${Date.now()}_${pendingImgFile.name}`, 
        'premium'
      );
      
      if (imageUrl) {
        // Update the images array with the new URL (ensure it has exactly 3 items)
        const newImages = [...(data.images || [])];
        // Ensure we have exactly 3 items in the array
        while (newImages.length < 3) newImages.push('');
        newImages[pendingIdx] = imageUrl;
        
        // Update the component state
        const newUrls = [...imgUrls];
        newUrls[pendingIdx] = imageUrl;
        setImgUrls(newUrls);
        
        // Update the parent component
        onChange({ ...data, images: newImages });
        
        // Close the modal
        handleImgModalCancel();
      }
    } catch (error) {
      console.error('Error in handleImgModalAdd:', error);
      const newErrors = [...imgErrors];
      newErrors[pendingIdx] = 'Failed to save image. Please try again.';
      setImgErrors(newErrors);
    } finally {
      setIsUploading(false);
    }
  }
  
  function handleItemBodyChange(idx, e) {
    const bodies = [...(data.itemBodies || ['', '', ''])];
    bodies[idx] = e.target.value;
    onChange({ ...data, itemBodies: bodies });
  }

  function handleDragOver(idx, e) {
    e.preventDefault();
    setDragActive(arr => arr.map((v, i) => i === idx ? true : v));
  }
  
  function handleDragLeave(idx, e) {
    e.preventDefault();
    setDragActive(arr => arr.map((v, i) => i === idx ? false : v));
  }
  
  function handleDrop(idx, e) {
    e.preventDefault();
    setDragActive(arr => arr.map((v, i) => i === idx ? false : v));
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageChange(idx, e.dataTransfer.files[0]);
    }
  }

  return (
    <div style={{ background: '#fff', borderRadius: 18, padding: '32px 32px 24px 32px', marginBottom: 36, maxWidth: 1200, width: '100%', position: 'relative', border: '1.5px solid #e0e7ef' }}>
      {/* Move/Delete buttons in top right */}
      <div style={{ position: 'absolute', top: 14, right: 18, display: 'flex', gap: 4, zIndex: 10 }}>
        <button
          className="acm-module-move"
          title="Move Up"
          onClick={onMoveUp}
          disabled={!onMoveUp}
          style={{ fontSize: '1.2rem', padding: '0 8px', color: '#64748b', background: 'none', border: 'none', cursor: onMoveUp ? 'pointer' : 'not-allowed' }}
        >
          &uarr;
        </button>
        <button
          className="acm-module-move"
          title="Move Down"
          onClick={onMoveDown}
          disabled={!onMoveDown}
          style={{ fontSize: '1.2rem', padding: '0 8px', color: '#64748b', background: 'none', border: 'none', cursor: onMoveDown ? 'pointer' : 'not-allowed' }}
        >
          &darr;
        </button>
        <button
          className="acm-module-delete"
          onClick={onDelete}
          title="Delete"
          style={{ fontSize: '1.5rem', color: '#b12704', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          ×
        </button>
      </div>
      
      {/* Image Upload Modal */}
      {showImgModal && (
        <div className="acm-modal-overlay">
          <div className="acm-modal acm-img-modal" style={{ minWidth: 900, maxWidth: 1200 }}>
            <div className="acm-modal-header">
              Asset library : Image details
              <button className="acm-modal-close" onClick={handleImgModalCancel}>×</button>
            </div>
            <div style={{ display: 'flex', gap: 32 }}>
              <div style={{ flex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ background: '#eee', padding: 16, borderRadius: 8, marginBottom: 16 }}>
                  {pendingImg && <img src={pendingImg} alt="Preview" style={{ maxWidth: 300, maxHeight: 300, borderRadius: 8 }} />}
                </div>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>{pendingImgFile?.name}</div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div><b>Size</b><br />{pendingImgFile ? (pendingImgFile.size / 1024).toFixed(2) + ' KB' : ''}</div>
                <div><b>Dimensions</b><br />{pendingImgDims.width} x {pendingImgDims.height}</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button className="acm-btn-cancel" onClick={handleImgModalCancel}>Back</button>
              <button className="acm-btn-remove" onClick={handleImgModalRemove}>Delete</button>
              <button className="acm-btn-save" onClick={handleImgModalAdd}>Add</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Module Title */}
      <div style={{ fontWeight: 700, fontSize: 20, color: '#23272f', marginBottom: 18 }}>Standard Three Images & Text</div>
      
      {/* Image Upload Areas */}
      <div style={{ display: 'flex', gap: 32, overflowX: 'auto', width: '100%' }}>
        {[0,1,2].map(idx => (
          <div key={idx} style={{ flex: '1 1 220px', minWidth: 220, maxWidth: 300, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <label style={{ fontWeight: 600, marginBottom: 4, display: 'block' }}>{idx === 0 ? '* Image' : 'Image'}</label>
            <div
              style={{
                border: dragActive[idx] ? '2px solid #38bdf8' : '2px dashed #38bdf8',
                borderRadius: 10,
                background: dragActive[idx] ? '#e0f2fe' : '#f0faff',
                width: '100%',
                maxWidth: 300,
                minWidth: 220,
                aspectRatio: '1/1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
                position: 'relative',
                cursor: 'pointer',
                transition: 'background 0.2s, border 0.2s',
                overflow: 'hidden',
                boxSizing: 'border-box',
              }}
              onClick={() => document.getElementById(`three-img-upload-${data.id}-${idx}`).click()}
              onDragOver={e => handleDragOver(idx, e)}
              onDragLeave={e => handleDragLeave(idx, e)}
              onDrop={e => handleDrop(idx, e)}
            >
              {imgUrls[idx] ? (
                <img 
                  src={imgUrls[idx]} 
                  alt={`Item ${idx+1}`} 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'contain', 
                    display: 'block', 
                    maxWidth: '100%', 
                    maxHeight: '100%' 
                  }} 
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#38bdf8', fontWeight: 600 }}>
                  <div style={{ fontSize: 36, marginBottom: 4 }}>📷</div>
                  <div style={{ fontSize: 15 }}>220:220</div>
                  <div style={{ fontSize: 14 }}>Click or drag image</div>
                </div>
              )}
              <input 
                id={`three-img-upload-${data.id}-${idx}`} 
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={e => handleImageChange(idx, e.target.files[0])} 
              />
            </div>
            {imgErrors[idx] && <div style={{ color: '#b12704', fontSize: 13, marginBottom: 4 }}>{imgErrors[idx]}</div>}
          </div>
        ))}
      </div>
      
      {/* Headlines */}
      <div style={{ display: 'flex', gap: 64, marginTop: 24 }}>
        {[0,1,2].map(idx => (
          <div key={idx} style={{ flex: 1 }}>
            <label style={{ fontWeight: 600, marginBottom: 4, display: 'block' }}>Headline</label>
            <input 
              type="text" 
              value={(data.itemHeadlines || ['', '', ''])[idx] || ''} 
              onChange={e => handleItemHeadlineChange(idx, e)} 
              placeholder="Enter headline text" 
              style={{ 
                width: '100%', 
                fontSize: 15, 
                padding: 7, 
                borderRadius: 0, 
                border: '1.5px solid #e0e7ef', 
                marginBottom: 14 
              }} 
            />
          </div>
        ))}
      </div>
      
      {/* Body Text */}
      <div style={{ display: 'flex', gap: 24 }}>
        {[0,1,2].map(idx => (
          <div key={idx} style={{ flex: 1 }}>
            <label style={{ fontWeight: 600, marginBottom: 4, display: 'block', marginTop: 8 }}>Body text</label>
            <textarea 
              value={(data.itemBodies || ['', '', ''])[idx] || ''} 
              onChange={e => handleItemBodyChange(idx, e)} 
              placeholder="Enter body text" 
              style={{ 
                width: '100%', 
                minHeight: 100, 
                fontSize: 15, 
                padding: 7, 
                borderRadius: 0, 
                border: '1.5px solid #e0e7ef', 
                resize: 'vertical' 
              }} 
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default PremiumThreeImagesTextModule;
