import '../css/App.css';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import LandingPage from './LandingPage';
import headerThumbnail from '../images/Standard Image Header With Text .png';
import axios from 'axios';
import PremiumContentEditPage from '../database/PremiumContentEditPage.js';
import premiumFullImagePlaceholder from '../images/premium-full-image-placeholder.png';
import ManageDraftsModal from '../components/ManageDraftsModal';
import BasicManageDraftsPage from '../components/BasicManageDraftsPage';
import GenerateBriefPage from '../components/GenerateBriefPage';
import controlaLogo from '../images/controla-logo.png';
import PremiumManageDraftsPage from '../components/PremiumManageDraftsPage';
import standardImageHeaderWithText from '../images/Standard Image Header With Text .png';
import Dashboard from '../components/Dashboard';
import { saveDraftToSupabase, getDraftsFromSupabase, deleteDraftFromSupabase } from '../database/supabaseDrafts';
import { uploadImageToSupabase, getLocalImage } from '../database/supabaseStorage';
import { cleanupLocalStorage } from '../database/cleanupLocalStorage';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Run cleanup on app start
cleanupLocalStorage().catch(error => {
  console.warn('Failed to clean up local storage:', error);
});

// const LANGUAGES = [
//   'UK English',
//   'US English',
//   'German',
//   'French',
//   'Italian',
//   'Spanish',
//   'Japanese',
//   'Chinese',
//   'Dutch',
//   'Polish',
//   'Portuguese',
//   'Turkish',
//   'Arabic',
//   'Russian',
//   'Korean',
//   'Hindi',
//   'Swedish',
//   'Czech',
//   'Danish',
//   'Finnish',
//   'Greek',
//   'Hungarian',
//   'Norwegian',
//   'Romanian',
//   'Slovak',
//   'Thai',
//   'Ukrainian',
//   'Vietnamese',
// ];

const MODULE_TEMPLATES = [
  {
    id: 'header',
    title: 'Standard Image Header With Text',
    description: 'A large image header with supporting text.',
    img: standardImageHeaderWithText,
  },
];

function EditableHeaderModule({ data, onChange, onDelete, onMoveUp, onMoveDown, onAddModuleWithImage }) {
  const [imgError, setImgError] = useState('');
  const [showImgModal, setShowImgModal] = useState(false);
  const [pendingImg, setPendingImg] = useState(null);
  const [pendingImgFile, setPendingImgFile] = useState(null);
  const [pendingImgDims, setPendingImgDims] = useState({ width: 0, height: 0 });
  const [pendingImgTags, setPendingImgTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [currentImageUrl, setCurrentImageUrl] = useState(data.image);
  const [isDragActive, setIsDragActive] = useState(false);
  const [imageQueue, setImageQueue] = useState([]);
  const fileInputRef = React.useRef();
  const [isHovered, setIsHovered] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Load image from URL when image changes
  useEffect(() => {
    async function loadImage() {
    if (data.image && typeof data.image === 'string') {
        if (data.image.startsWith('local://') || data.image.startsWith('placeholder://')) {
          const localImage = await getLocalImage(data.image);
          setCurrentImageUrl(localImage || '');
        } else {
      setCurrentImageUrl(data.image);
        }
    } else {
      setCurrentImageUrl('');
    }
    }
    loadImage();
  }, [data.image]);

  function handleImageChange(e) {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArr = Array.from(files);
      if (fileArr.length > 1) {
        setImageQueue(fileArr);
        processImageFile(fileArr[0], fileArr.slice(1));
      } else {
        processImageFile(files[0], []);
      }
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fileArr = Array.from(e.dataTransfer.files);
      if (fileArr.length > 1) {
        setImageQueue(fileArr);
        processImageFile(fileArr[0], fileArr.slice(1));
      } else {
        processImageFile(e.dataTransfer.files[0], []);
      }
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    setIsDragActive(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragActive(false);
  }

  function processImageFile(file, queue = []) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new window.Image();
      img.onload = () => {
        if (img.width !== 970 || img.height !== 600) {
          setImgError('Image must be exactly 970 x 600 px.');
          if (queue.length > 0) {
            setTimeout(() => processImageFile(queue[0], queue.slice(1)), 0);
          }
          return;
        }
        setImgError('');
        setPendingImg(ev.target.result);
        setPendingImgFile(file);
        setPendingImgDims({ width: img.width, height: img.height });
        setShowImgModal(true);
        setImageQueue(queue);
      };
      img.onerror = () => {
        setImgError('Invalid image file.');
        if (queue.length > 0) {
          setTimeout(() => processImageFile(queue[0], queue.slice(1)), 0);
        }
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  async function handleImgModalAdd() {
    if (isUploading) return; // Prevent multiple clicks
    try {
      if (!pendingImgFile) {
        setImgError('No file selected. Please choose an image file.');
        return;
      }
      setIsUploading(true);
      setImgError('');
      // 1. Show preview instantly
      onChange({ ...data, image: pendingImg });
      setCurrentImageUrl(pendingImg);
      setShowImgModal(false);
      setPendingImg(null);
      setPendingImgFile(null);
      setPendingImgDims({ width: 0, height: 0 });
      setPendingImgTags([]);
      setTagInput('');
      // 2. Start upload in background
      const fileExt = pendingImgFile.name.split('.').pop();
      const filePath = `user-uploads/${uuidv4()}.${fileExt}`;
      uploadImageToSupabase(pendingImgFile, filePath)
        .then(publicUrl => {
          // 3. When upload completes, update to Supabase URL
          onChange({ ...data, image: publicUrl });
          setCurrentImageUrl(publicUrl);
        })
        .catch(error => {
          setImgError('Failed to upload image.');
        })
        .finally(() => {
          setIsUploading(false);
        });
    } catch (error) {
      setImgError('Failed to save image. Please try again.');
      setIsUploading(false);
    }
  }
  async function handleImgModalRemove() {
    try {
      setPendingImg(null);
      setPendingImgFile(null);
      setPendingImgDims({ width: 0, height: 0 });
      setPendingImgTags([]);
      setTagInput('');
      setShowImgModal(false);
      onChange({ ...data, image: '' });
      setCurrentImageUrl('');
      if (imageQueue.length > 0) {
        setTimeout(() => processImageFile(imageQueue[0], imageQueue.slice(1)), 0);
      }
    } catch (error) {
      console.error('Error removing image:', error);
    }
  }
  function handleImgModalCancel() {
    setPendingImg(null);
    setPendingImgFile(null);
    setPendingImgDims({ width: 0, height: 0 });
    setPendingImgTags([]);
    setTagInput('');
    setShowImgModal(false);
    if (imageQueue.length > 0) {
      setTimeout(() => processImageFile(imageQueue[0], imageQueue.slice(1)), 0);
    }
  }
  function handleDownload() {
    if (pendingImg && pendingImgFile) {
      const link = document.createElement('a');
      link.href = pendingImg;
      link.download = pendingImgFile.name;
      link.click();
    }
  }
  function handleReplaceClick() {
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
      fileInputRef.current.click();
    }
  }
  // function handleAddTag() {
  //   if (tagInput.trim() && !pendingImgTags.includes(tagInput.trim())) {
  //     setPendingImgTags([...pendingImgTags, tagInput.trim()]);
  //     setTagInput('');
  //   }
  // }
  // function handleDeleteTag(tag) {
  //   setPendingImgTags(pendingImgTags.filter(t => t !== tag));
  // }

  return (
    <div
      className="acm-editable-module"
      style={{
        maxWidth: 420,
        minHeight: 280,
        margin: '32px auto',
        boxSizing: 'border-box',
        background: '#fff',
        borderRadius: 18,
        boxShadow: '0 4px 24px rgba(30,41,59,0.10)',
        padding: '28px 24px 18px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: 36,
      }}
    >
      {showImgModal && (
        <div className="acm-modal-overlay" onClick={handleImgModalCancel}>
          <div className="acm-modal acm-img-modal" style={{ minWidth: 900, maxWidth: 1200 }} onClick={(e) => e.stopPropagation()}>
            <div className="acm-modal-header">Asset library : Image details
              <button className="acm-modal-close" onClick={handleImgModalCancel}>×</button>
            </div>
            <div style={{ display: 'flex', gap: 32 }}>
              <div style={{ flex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ background: '#eee', padding: 16, borderRadius: 8, marginBottom: 16 }}>
                  {pendingImg && <img src={pendingImg} alt="Preview" style={{ maxWidth: 500, maxHeight: 350, borderRadius: 8 }} />}
                </div>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>{pendingImgFile?.name}</div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div><b>Size</b><br />{pendingImgFile ? (pendingImgFile.size / 1024).toFixed(2) + ' KB' : ''}</div>
                <div><b>Dimensions</b><br />{pendingImgDims.width} x {pendingImgDims.height}</div>
                {imgError && (
                  <div style={{ 
                    color: '#b12704', 
                    fontSize: '0.9rem', 
                    marginTop: 8,
                    padding: '8px 12px',
                    background: '#ffeaea',
                    border: '1px solid #fecaca',
                    borderRadius: '4px'
                  }}>
                    {imgError}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button 
                className="acm-btn-cancel" 
                onClick={handleImgModalCancel}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                Back
              </button>
              <button 
                className="acm-btn-remove" 
                onClick={handleImgModalRemove}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                Delete
              </button>
              <button 
                className="acm-btn-save" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleImgModalAdd();
                }}
                style={{ 
                  cursor: isUploading ? 'not-allowed' : 'pointer', 
                  userSelect: 'none',
                  position: 'relative',
                  zIndex: 10,
                  opacity: isUploading ? 0.7 : 1
                }}
                disabled={!pendingImgFile || isUploading}
              >
                {isUploading ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="acm-module-controls">
        <button className="acm-module-move" title="Move Up" onClick={onMoveUp} disabled={!onMoveUp} style={{fontSize:'1.2rem',padding:'0 8px',color:'#64748b',background:'none',border:'none',cursor:onMoveUp?'pointer':'not-allowed'}}>&uarr;</button>
        <button className="acm-module-move" title="Move Down" onClick={onMoveDown} disabled={!onMoveDown} style={{fontSize:'1.2rem',padding:'0 8px',color:'#64748b',background:'none',border:'none',cursor:onMoveDown?'pointer':'not-allowed'}}>&darr;</button>
        <button className="acm-module-delete" onClick={onDelete} title="Delete">×</button>
      </div>
      <div className="acm-module-image-upload">
        {currentImageUrl ? (
          <div
            style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', width: 360, height: 222 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <img src={currentImageUrl} alt="Header" className="acm-module-image-preview" style={{ width: 360, height: 222, objectFit: 'cover', borderRadius: 8, display: 'block', margin: '0 auto' }} />
            <button
              className="acm-btn-replace"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: isHovered ? 'rgba(37,99,235,0.28)' : 'transparent',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: '1.1rem',
                cursor: 'pointer',
                opacity: isHovered ? 1 : 0,
                transition: 'opacity 0.2s, background 0.2s',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: isHovered ? 'auto' : 'none',
              }}
              onClick={handleReplaceClick}
            >
              Replace
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageChange}
            />
          </div>
        ) : (
          <div
            style={{ display: 'flex', gap: 12, width: '100%', justifyContent: 'center' }}
          >
            <label
              className="acm-module-image-placeholder"
              style={{
                flex: 1,
                cursor: 'pointer',
                width: 360,
                height: 222,
                background: isDragActive ? '#dbeafe' : '#eaf6f9',
                border: isDragActive ? '2px solid #2563eb' : '2px dashed #38bdf8',
                borderRadius: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s, border 0.2s',
              }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDragEnd={handleDragLeave}
            >
              <span>Click or drag to upload image(s)<br/>(970 x 600 px, JPG/PNG)</span>
              <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleImageChange} />
            </label>
          </div>
        )}
        {imgError && <div className="acm-img-error">{imgError}</div>}
      </div>
    </div>
  );
}

function ModuleSelectModal({ onSelect, onClose }) {
  return (
    <div className="acm-modal-overlay">
      <div className="acm-modal">
        <div className="acm-modal-header">
          <h2>Select Module Type</h2>
          <button className="acm-modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="acm-modal-content">
          {MODULE_TEMPLATES.map(template => (
            <div key={template.id} className="acm-module-template" onClick={() => onSelect(template)}>
              <img src={template.img} alt={template.title} />
              <div className="acm-template-info">
                <h3>{template.title}</h3>
                <p>{template.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContentEditPage() {
  const { id } = useParams();
  const [tab, setTab] = useState('editor');
  const [contentName, setContentName] = useState('');
  // const [language, setLanguage] = useState('UK English');
  const [modules, setModules] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [previewMode, setPreviewMode] = useState('desktop');
  const [saveMsg, setSaveMsg] = useState('');
  const [showDrafts, setShowDrafts] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [previewImages, setPreviewImages] = useState({});
  const navigate = useNavigate();
  const isAddModuleDisabled = !contentName;
  const [draft, setDraft] = useState(null);
  const [nameError, setNameError] = useState('');

  // Check for duplicate name on contentName change
  useEffect(() => {
    if (!contentName) return;
    getDraftsFromSupabase('basic').then(result => {
      const exists = result.some(d => d.contentName === contentName && (!id || d.id !== id));
      if (exists) {
        setNameError('Name already taken, please choose a different name.');
      } else {
        setNameError('');
      }
    });
  }, [contentName, id]);

  useEffect(() => {
    if (nameError) {
      const timer = setTimeout(() => setNameError(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [nameError]);

  // Load images for preview
  useEffect(() => {
    async function loadPreviewImages() {
      const imageMap = {};
      for (const module of modules) {
        if (module.image) {
          if (module.image.startsWith('data:')) {
            // Base64 image
            imageMap[module.id] = module.image;
          } else if (module.image.startsWith('local://') || module.image.startsWith('placeholder://')) {
            // Local storage image
            imageMap[module.id] = await getLocalImage(module.image);
          } else if (module.image.startsWith('http')) {
            // Supabase URL
            imageMap[module.id] = module.image;
          } else {
            // Legacy images are no longer supported
            imageMap[module.id] = '';
            }
        } else {
          imageMap[module.id] = '';
          }
      }
        setPreviewImages(imageMap);
      }
    if (modules.length > 0) {
      loadPreviewImages();
    }
  }, [modules]);

  // Load all drafts metadata
  useEffect(() => {
    async function loadDrafts() {
      try {
        const allDrafts = await getDraftsFromSupabase('basic');
        setDrafts(allDrafts);
      } catch (error) {
        console.error('Error loading drafts:', error);
        setDrafts([]);
      }
    }
    loadDrafts();
  }, [showDrafts, saveMsg]);

  // Load last opened draft on mount
  useEffect(() => {
    async function loadLastDraft() {
      try {
        // Fetch all drafts from Supabase
        const allDrafts = await getDraftsFromSupabase('basic');
        if (allDrafts && allDrafts.length > 0) {
          // Sort drafts by date descending
          const sortedDrafts = allDrafts.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
          const lastDraft = sortedDrafts[0];
          if (lastDraft) {
            if (lastDraft.contentName) setContentName(lastDraft.contentName);
            if (Array.isArray(lastDraft.modules)) setModules(lastDraft.modules);
          }
        }
      } catch (error) {
        console.error('Error loading last draft:', error);
      }
    }
    loadLastDraft();
  }, []);

  // Load draft from Supabase
  useEffect(() => {
    async function loadDraft() {
      if (id) {
        try {
            const drafts = await getDraftsFromSupabase('basic');
          const draft = drafts.find(d => d.id === id);
          if (draft) {
            setContentName(draft.contentName || '');
            let loadedModules = draft.modules;
            if (typeof loadedModules === 'string') {
              try {
                loadedModules = JSON.parse(loadedModules);
              } catch (e) {
                loadedModules = [];
              }
            }
            setModules(Array.isArray(loadedModules) ? loadedModules : []);
          }
        } catch (error) {
          console.error('Error loading draft:', error);
        }
      }
    }
    loadDraft();
  }, [id]);

  async function handleSaveDraft() {
    if (nameError) {
      setSaveMsg(nameError);
      setTimeout(() => setSaveMsg(''), 4000);
      return;
    }
    if (!contentName) {
      setSaveMsg('Please enter a content name before saving.');
      setTimeout(() => setSaveMsg(''), 4000);
      return;
    }
    if (modules.length === 0) {
      setSaveMsg('Please add at least one module before saving.');
      setTimeout(() => setSaveMsg(''), 4000);
      return;
    }
    const name = contentName;
    // Check again before saving
    const allDrafts = await getDraftsFromSupabase('basic');
    const exists = allDrafts.some(d => d.contentName === name && (!id || d.id !== id));
    if (exists) {
      setSaveMsg('Name already taken, please choose a different name.');
      setTimeout(() => setSaveMsg(''), 4000);
      return;
    }
    try {
      const draftId = id || uuidv4();
      // Upload images in modules and replace with public URLs
      const modulesWithUrls = await Promise.all(
        modules.map(async (mod) => {
          let updatedMod = { ...mod };
          if (updatedMod.image && updatedMod.image instanceof File) {
            const filePath = `user-uploads/${draftId}_${updatedMod.image.name}`;
            updatedMod.image = await uploadImageToSupabase(updatedMod.image, filePath);
          }
          if (updatedMod.desktopImage && updatedMod.desktopImage instanceof File) {
            const filePath = `user-uploads/${draftId}_${updatedMod.desktopImage.name}`;
            updatedMod.desktopImage = await uploadImageToSupabase(updatedMod.desktopImage, filePath);
          }
          if (updatedMod.mobileImage && updatedMod.mobileImage instanceof File) {
            const filePath = `user-uploads/${draftId}_${updatedMod.mobileImage.name}`;
            updatedMod.mobileImage = await uploadImageToSupabase(updatedMod.mobileImage, filePath);
          }
          if (Array.isArray(updatedMod.images)) {
            updatedMod.images = await Promise.all(updatedMod.images.map(async (img, idx) => {
              if (img && img instanceof File) {
                const filePath = `user-uploads/${draftId}_${idx}_${img.name}`;
                return await uploadImageToSupabase(img, filePath);
              }
              return img;
            }));
          }
          return updatedMod;
        })
      );
      // Prepare draft data with all required fields
      const draftData = {
        id: draftId,
        contentName: name,
        name: name, // For backward compatibility
        modules: modulesWithUrls,
        date: new Date().toISOString(),
        drafttype: 'basic',
        status: 'active',
        // Add any additional fields your schema requires
      };
      
      console.log('[ContentEditPage] Prepared draft data:', JSON.stringify(draftData, null, 2));
      
      // Save the draft
      const result = await saveDraftToSupabase(draftData);
      
      if (result) {
        console.log('[ContentEditPage] Draft saved successfully');
        setSaveMsg('Draft saved successfully!');
        setTimeout(() => setSaveMsg(''), 2000);
        
        // If this was a new draft, update the URL with the new ID
        if (!id) {
          navigate(`/basic/edit/${draftId}`, { replace: true });
        }
      } else {
        throw new Error('Failed to save draft: No result returned');
      }
    } catch (error) {
      console.error('[ContentEditPage] Error saving draft:', {
        error: error.toString(),
        message: error.message,
        stack: error.stack,
        data: error.response?.data
      });
      
      setSaveMsg('Error saving draft. Please try again.');
      toast.error(`Error saving draft: ${error.message}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    }
  }

  async function handleLoadDraft(id) {
    try {
      const allDrafts = await getDraftsFromSupabase('basic');
      const draft = allDrafts.find(d => d.id === id);
      if (draft) {
        setContentName(draft.contentName || '');
        setModules(draft.modules || []);
        setShowDrafts(false);
        setSaveMsg('Draft loaded!');
        setTimeout(() => setSaveMsg(''), 2000);
      }
    } catch (error) {
      console.error('Error loading draft:', error, error?.message, error?.stack, JSON.stringify(error));
      alert('Error loading draft: ' + (error?.message || JSON.stringify(error)));
      setSaveMsg('Error loading draft. Please try again.');
      setTimeout(() => setSaveMsg(''), 2000);
    }
  }

  async function handleDeleteDraft(id) {
    try {
      await deleteDraftFromSupabase(id);
      const allDrafts = await getDraftsFromSupabase('basic');
      setDrafts(allDrafts);
    } catch (error) {
      console.error('Error deleting draft:', error, error?.message, error?.stack, JSON.stringify(error));
      alert('Error deleting draft: ' + (error?.message || JSON.stringify(error)));
      setSaveMsg('Error deleting draft.');
    }
  }

  function handleAddModule() {
    setShowModal(true);
  }
  function handleSelectModule(template) {
    setModules([
      ...modules,
      { ...template, type: template.id, headline: '', subheadline: '', body: '', image: '', id: uuidv4() }
    ]);
    setShowModal(false);
  }
  function handleDeleteModule(id) {
    setModules(modules => modules.filter(m => m.id !== id));
  }
  function handleModuleChange(id, newData) {
    setModules(modules.map(m => m.id === id ? { ...m, ...newData } : m));
  }

  function handleMoveModuleUp(idx) {
    if (idx <= 0) return;
    setModules(mods => {
      const arr = [...mods];
      [arr[idx-1], arr[idx]] = [arr[idx], arr[idx-1]];
      return arr;
    });
  }
  function handleMoveModuleDown(idx) {
    if (idx >= modules.length-1) return;
    setModules(mods => {
      const arr = [...mods];
      [arr[idx], arr[idx+1]] = [arr[idx+1], arr[idx]];
      return arr;
    });
  }

  function handleAddModuleWithImage(imageId, imageDataUrl) {
    setModules(modules => [
      ...modules,
      { ...MODULE_TEMPLATES[0], type: MODULE_TEMPLATES[0].id, headline: '', subheadline: '', body: '', image: imageId, id: uuidv4() }
    ]);
  }

  return (
    <>
      {saveMsg && (
        <div style={{
          position: 'fixed',
          top: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          background: saveMsg.includes('saved') ? '#22c55e' : '#ef4444',
          color: '#fff',
          padding: '14px 36px',
          borderRadius: 12,
          fontWeight: 700,
          fontSize: 18,
          zIndex: 2000,
          boxShadow: '0 4px 24px rgba(30,41,59,0.13)',
          textAlign: 'center',
          minWidth: 240
        }}>
          {saveMsg}
        </div>
      )}
      <div className="acm-edit-root">
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', background: '#fff', zIndex: 100, boxShadow: '0 2px 8px rgba(30,41,59,0.04)' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0 0 32px' }}>
          <img src={controlaLogo} alt="Controla Logo" style={{ height: 32, marginRight: 14 }} />
        </div>
        {/* Top Buttons */}
        <div className="acm-edit-header-actions">
          <button className="acm-btn-cancel-modern" onClick={() => {
            if (window.confirm('Are you sure you want to cancel? Unsaved changes will be lost.')) navigate('/');
          }} style={{ padding: '6px 16px', fontSize: 14, borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
          <button
            className="acm-btn-save rebuilt-save-draft"
            style={{
              background: 'linear-gradient(90deg, #2563eb 0%, #60a5fa 100%)',
              color: '#fff',
              padding: '6px 18px',
              fontSize: 14,
              borderRadius: 6,
              marginLeft: 4,
              cursor: 'pointer',
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(37,99,235,0.10)',
              border: 'none',
              outline: 'none',
              transition: 'background 0.18s, box-shadow 0.18s',
            }}
            aria-label="Save as draft"
            onClick={() => {
              if (window.confirm('Do you want to save this draft?')) handleSaveDraft();
            }}
            onMouseOver={e => e.currentTarget.style.background = 'linear-gradient(90deg, #1d4ed8 0%, #60a5fa 100%)'}
            onMouseOut={e => e.currentTarget.style.background = 'linear-gradient(90deg, #2563eb 0%, #60a5fa 100%)'}
          >
            Save as draft
          </button>
          <button
            className="acm-btn-save"
            style={{ background: '#64748b', marginLeft: 8, padding: '6px 16px', fontSize: 14, borderRadius: 6, cursor: 'pointer' }}
            onClick={() => {
              if (window.confirm('Open Manage Drafts? Unsaved changes will be lost.')) navigate('/basic-manage-drafts');
            }}
          >
            Manage Drafts
          </button>
          <button className="acm-btn acm-btn-home" style={{marginLeft:8, padding: '6px 16px', fontSize: 14, borderRadius: 6, cursor: 'pointer' }} onClick={() => navigate('/')}>Home</button>
          <button className="acm-btn acm-btn-back" style={{marginLeft:8, padding: '6px 16px', fontSize: 14, borderRadius: 6, cursor: 'pointer' }} onClick={() => navigate('/get-started')}>Back</button>
        </div>
        {/* Content Details */}
        <div className="acm-content-details">
          <div className="acm-content-details-title">Content details <span className="acm-best-practices">Best practices</span></div>
          {/* Content Details Form */}
          <div className="acm-content-details-form">
            <div className="acm-form-row">
              <label>Content name<span className="acm-required">*</span></label>
              <input type="text" value={contentName} onChange={e => setContentName(e.target.value)} placeholder="Enter content name" />
            </div>
          </div>
        </div>
        {/* Tabs */}
        <div className="acm-tabs">
          <div className={`acm-tab ${tab === 'editor' ? 'active' : ''}`} onClick={() => setTab('editor')}>Editor</div>
          <div className={`acm-tab ${tab === 'preview' ? 'active' : ''}`} onClick={() => setTab('preview')}>Preview</div>
        </div>
        </div>
        {/* Main content area with top padding to prevent overlap */}
        <div style={{ paddingTop: 320 }}>
          {showModal && <ModuleSelectModal onSelect={handleSelectModule} onClose={() => setShowModal(false)} />}
          {showDrafts && (
            <ManageDraftsModal
              drafts={drafts.filter(d => !d.draftType || d.draftType === 'basic')}
              onLoad={handleLoadDraft}
              onDelete={handleDeleteDraft}
              onClose={() => setShowDrafts(false)}
            />
          )}
        {/* Module Area */}
        <div className="acm-module-area" style={{flexDirection: 'column', alignItems: 'flex-start'}}>
          {tab === 'editor' ? (
            <>
              <div style={{marginTop: '24px', width: '100%'}}>
                {modules.length === 0 ? (
                  <div style={{ textAlign: 'center', marginTop: 64 }}>
                    <div style={{ color: '#64748b', fontSize: '1.05rem', marginBottom: 16 }}>No modules added yet.</div>
                    <button
                      className="acm-btn-add-module"
                      disabled={isAddModuleDisabled}
                      style={{
                        background: isAddModuleDisabled ? '#c7d7fa' : 'linear-gradient(90deg, #2563eb 0%, #60a5fa 100%)',
                        color: isAddModuleDisabled ? '#fff' : '#fff',
                        border: 'none',
                        borderRadius: 8,
                        fontWeight: 600,
                        fontSize: 18,
                        padding: '12px 36px',
                        cursor: isAddModuleDisabled ? 'not-allowed' : 'pointer',
                        boxShadow: isAddModuleDisabled ? 'none' : '0 2px 8px rgba(37,99,235,0.10)',
                        transition: 'background 0.18s, color 0.18s',
                        opacity: isAddModuleDisabled ? 0.6 : 1,
                        marginTop: 8
                      }}
                      onClick={handleAddModule}
                    >
                      Add Module
                    </button>
                  </div>
                ) : (
                  modules.map((mod, idx) => (
                    <React.Fragment key={mod.id}>
                      <EditableHeaderModule
                        data={mod}
                        onChange={newData => handleModuleChange(mod.id, newData)}
                        onDelete={() => handleDeleteModule(mod.id)}
                        onMoveUp={idx > 0 ? () => handleMoveModuleUp(idx) : undefined}
                        onMoveDown={idx < modules.length-1 ? () => handleMoveModuleDown(idx) : undefined}
                        onAddModuleWithImage={handleAddModuleWithImage}
                      />
                      {idx === modules.length - 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
                          <button
                            className="acm-btn-add-module"
                            disabled={isAddModuleDisabled}
                            style={{
                              background: isAddModuleDisabled ? '#c7d7fa' : 'linear-gradient(90deg, #2563eb 0%, #60a5fa 100%)',
                              color: isAddModuleDisabled ? '#fff' : '#fff',
                              border: 'none',
                              borderRadius: 8,
                              fontWeight: 600,
                              fontSize: 18,
                              padding: '12px 36px',
                              cursor: isAddModuleDisabled ? 'not-allowed' : 'pointer',
                              boxShadow: isAddModuleDisabled ? 'none' : '0 2px 8px rgba(37,99,235,0.10)',
                              transition: 'background 0.18s, color 0.18s',
                              opacity: isAddModuleDisabled ? 0.6 : 1,
                              marginTop: 8
                            }}
                            onClick={handleAddModule}
                          >
                            Add Module
                          </button>
                        </div>
                      )}
                    </React.Fragment>
                  ))
                )}
              </div>
            </>
          ) : (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'transparent', minHeight: 400 }}>
              {/* Preview Bar */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 24, marginTop: 8 }}>
                <button
                  style={{
                    background: previewMode === 'mobile' ? '#fff' : '#f3f4f6',
                    color: previewMode === 'mobile' ? '#23272f' : '#64748b',
                    border: 'none',
                    borderRadius: '8px 0 0 8px',
                    padding: '8px 28px',
                    fontWeight: previewMode === 'mobile' ? 700 : 600,
                    fontSize: 16,
                    cursor: 'pointer',
                    outline: 'none',
                    boxShadow: 'none',
                    borderRight: '1.5px solid #e5e7eb',
                  }}
                  onClick={() => setPreviewMode('mobile')}
                >Mobile</button>
                <button
                  style={{
                    background: previewMode === 'desktop' ? '#fff' : '#f3f4f6',
                    color: previewMode === 'desktop' ? '#23272f' : '#64748b',
                    border: 'none',
                    borderRadius: '0 8px 8px 0',
                    padding: '8px 28px',
                    fontWeight: previewMode === 'desktop' ? 700 : 600,
                    fontSize: 16,
                    cursor: 'pointer',
                    outline: 'none',
                    borderLeft: '1.5px solid #e5e7eb',
                    boxShadow: previewMode === 'desktop' ? '0 2px 8px rgba(30,41,59,0.04)' : 'none',
                    textShadow: previewMode === 'desktop' ? '0 1px 0 #fff' : 'none',
                  }}
                  onClick={() => setPreviewMode('desktop')}
                >Desktop</button>
              </div>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center', overflow: 'visible', position: 'relative' }}>
                <div style={{ transform: 'scale(0.8)', transformOrigin: 'top center', width: '142.86%', minWidth: 0, zIndex: 1, pointerEvents: 'none', height: 'auto', maxHeight: 'none' }}>
                  <div style={{ pointerEvents: 'auto', width: '100%' }}>
              {previewMode === 'desktop' && (
                modules.length === 0 ? (
                  <div style={{color: '#64748b', fontSize: '1.05rem'}}>No modules to preview.</div>
                ) : (
                  modules.map((mod, idx) => (
                    <div key={mod.id} style={{ margin: '0 0 14px 0', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {previewImages[mod.id] && (
                        <img
                          src={previewImages[mod.id]}
                          alt={mod.headline || `Module ${idx+1}`}
                          style={{ width: 970, height: 600, objectFit: 'cover', border: 'none', background: 'none', borderRadius: 0 }}
                        />
                      )}
                    </div>
                  ))
                )
              )}
              {previewMode === 'mobile' && (
                modules.length === 0 ? (
                  <div style={{color: '#64748b', fontSize: '1.05rem'}}>No modules to preview.</div>
                ) : (
                  modules.map((mod, idx) => (
                    <div key={mod.id} style={{ margin: '0 0 12px 0', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {previewImages[mod.id] && (
                        <img
                          src={previewImages[mod.id]}
                          alt={mod.headline || `Module ${idx+1}`}
                          style={{ width: 360, height: 222, objectFit: 'cover', border: 'none', background: 'none', borderRadius: 0 }}
                        />
                      )}
                    </div>
                  ))
                )
              )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
}

function HomePage() {
  const navigate = useNavigate();
  return (
    <div className="acm-root">
      {/* Top Navigation Bar */}
      <nav className="acm-navbar">
        <div className="acm-navbar-left">
          <img src={controlaLogo} alt="Controla Logo" className="navbar-logo-img" />
        </div>
        <div style={{ flex: 1 }} />
        <button
          style={{
            background: 'none',
            color: '#23272f',
            border: 'none',
            borderRadius: 0,
            padding: 0,
            fontWeight: 600,
            fontSize: 16,
            cursor: 'pointer',
            marginRight: 16,
            marginTop: 8,
            boxShadow: 'none',
            textDecoration: 'none',
          }}
          onClick={() => navigate('/manage-drafts')}
        >
          History
        </button>
        <button
          style={{
            background: 'none',
            color: '#23272f',
            border: 'none',
            borderRadius: 0,
            padding: 0,
            fontWeight: 600,
            fontSize: 16,
            cursor: 'pointer',
            marginRight: 32,
            marginTop: 8,
            boxShadow: 'none',
            textDecoration: 'none',
          }}
          onClick={() => navigate('/')}
        >
          Home
        </button>
      </nav>
      {/* Page Title */}
      <h1 className="acm-title">A+ Content selection</h1>
      <p className="acm-subtitle">Select the type of A+ content you want to create:</p>
      {/* Content Selection Cards */}
      <div className="acm-cards-container">
        <div className="acm-card-group">
          <div className="acm-card">
            <h2 className="acm-card-title acm-basic">Basic</h2>
            <ul>
              <li>Create up to 5 modules of enhanced content to highlight the features of your products</li>
            </ul>
            <Link to="/basic/edit" className="acm-btn-link"><button className="acm-btn">Create Basic A+</button></Link>
          </div>
          <div className="acm-card">
            <h2 className="acm-card-title acm-premium">Premium</h2>
            <ul>
              <li>Upgrade to 7 modules including video capability, larger images, and interactive experiences.</li>
            </ul>
            <Link to="/premium/edit" className="acm-btn-link"><button className="acm-btn">Create Premium A+</button></Link>
          </div>
        </div>
        <div className="acm-card acm-card-brand-story">
          <h2 className="acm-card-title acm-brand-story">Brand Story</h2>
          <ul>
            <li>Tell your brand story across all of the products in your brand</li>
            <li>Add your logo, brand picture, brand description, and answer questions about your brand.</li>
            <li>Content displays in a new section above the Enhanced product description</li>
          </ul>
          <button className="acm-btn">Create Brand Story A+</button>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
        <button style={{ background: 'linear-gradient(90deg, #2563eb 0%, #60a5fa 100%)', color: '#fff', border: 'none', borderRadius: 6, padding: '12px 28px', fontWeight: 600, fontSize: '1.08rem', fontFamily: 'Inter, sans-serif', cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.08)', transition: 'background 0.2s, box-shadow 0.2s, transform 0.1s' }} onClick={() => navigate(-1)}>Back</button>
      </div>
    </div>
  );
}

function ManageDraftsPage() {
  const [drafts, setDrafts] = useState([]);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    async function loadDrafts() {
      try {
        const allDrafts = await getDraftsFromSupabase();
        setDrafts(allDrafts);
      } catch (error) {
        console.error('Error loading drafts:', error);
        setDrafts([]);
      }
    }
    loadDrafts();
  }, []);

  function handleLoadDraft(draft) {
    // Determine the correct route based on draft type and modules
    let isPremium = false;
    
    // Check if it's explicitly marked as premium
    if (draft.draftType === 'premium') {
      isPremium = true;
    } else {
      // Check if it has premium modules
      const hasPremiumModules = (draft.modules || []).some(m => {
        const type = m.type || m.moduleType || m.id;
        const typeStr = typeof type === 'string' ? type : String(type || '');
        return typeStr.includes('premium') || 
          typeStr === 'premium-full-image' ||
          typeStr === 'premium-four-images-text' ||
          typeStr === 'premium-three-images-text' ||
          typeStr === 'premium-single-left-image' ||
          typeStr === 'standard-single-image-sidebar';
      });
      isPremium = hasPremiumModules;
    }
    
    // Navigate to the correct page
    if (isPremium) {
      navigate(`/premium/edit/${draft.id}`);
    } else if (draft.draftType === 'brand') {
      navigate(`/brand/edit/${draft.id}`);
    } else {
      navigate(`/basic/edit/${draft.id}`);
    }
  }

  async function handleDeleteDraft(id) {
    try {
      await deleteDraftFromSupabase(id);
      const allDrafts = await getDraftsFromSupabase();
      setDrafts(allDrafts);
    } catch (error) {
      console.error('Error deleting draft:', error);
      alert('Error deleting draft: ' + (error?.message || JSON.stringify(error)));
    }
  }

  // Filter logic for type
  const filteredDrafts = drafts.filter(d => {
    if (filter === 'basic') return !d.draftType || d.draftType === 'basic';
    if (filter === 'premium') return d.draftType === 'premium';
    if (filter === 'brand') return d.draftType === 'brand';
    return true;
  });

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      {/* Top Nav */}
      <nav style={{ background: 'transparent', height: 56, display: 'flex', alignItems: 'center', padding: '0 40px', color: '#23272f', fontWeight: 600, fontSize: 18 }}>
        <img src={controlaLogo} alt="Logo" style={{ height: 32, marginRight: 18 }} />
        <div style={{ flex: 1 }} />
        <button style={{ background: 'none', border: 'none', color: '#23272f', fontWeight: 600, fontSize: 16, cursor: 'pointer' }} onClick={() => navigate('/')}>Home</button>
      </nav>
      {/* Page Title and Filter */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 0 0 0' }}>
        {/* Auto-trash and auto-delete messages removed as per edit hint */}
        <div style={{ fontSize: '2.1rem', fontWeight: 700, color: '#23272f', marginBottom: 8 }}>History</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginBottom: 24, justifyContent: 'flex-end' }}>
          <button style={{ background: 'linear-gradient(90deg, #2563eb 0%, #60a5fa 100%)', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 18px', fontWeight: 600, fontSize: 16, cursor: 'pointer', marginRight: 0, boxShadow: '0 2px 8px rgba(37,99,235,0.10)' }} onClick={() => navigate(-1)}>Back</button>
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '8px 16px', borderRadius: 6, border: '1.5px solid #e5e7eb', fontSize: 16, background: '#fff', color: '#23272f' }}>
            <option value="all">All</option>
            <option value="basic">Basic</option>
            <option value="premium">Premium</option>
            <option value="brand">Brand Story</option>
          </select>
        </div>
        {/* Table Header */}
        <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: 8, padding: '14px 32px', fontWeight: 600, color: '#64748b', fontSize: 15, marginBottom: 0 }}>
          <div style={{ flex: 2 }}>Name</div>
          <div style={{ flex: 1.2 }}>A+</div>
          <div style={{ flex: 2 }}>Modules</div>
          <div style={{ flex: 2 }}>Date</div>
          <div style={{ flex: 2, textAlign: 'right' }}>Actions</div>
        </div>
        {/* Drafts List */}
        <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(30,41,59,0.06)', marginTop: 0, minHeight: 120 }}>
          {filteredDrafts.length === 0 ? (
            <div style={{ color: '#64748b', textAlign: 'center', padding: '48px 0', fontSize: 17 }}>No drafts found.</div>
          ) : (
            filteredDrafts.map(draft => {
              // Map module type/id to title
              const moduleTitleMap = {
                'header': 'Standard Image Header With Text',
                'four-images-text': 'Standard Four Images & Text',
                'premium-full-image': 'Premium Full Image',
                'premium-four-images-text': 'Standard Four Images & Text',
                'premium-three-images-text': 'Standard Three Images & Text',
                'premium-single-left-image': 'Standard Single Left Image',
                'standard-single-image-sidebar': 'Standard Single Image & Sidebar',
                'standard-comparison-chart': 'Standard Comparison Chart',
              };
              // Only show each module type once
              const seen = new Set();
              const moduleTitles = (draft.modules || [])
                .map(m => {
                  const type = m.type || m.moduleType || m.id;
                  const title = moduleTitleMap[type] || (typeof type === 'string' && type.length < 40 ? type : 'Unknown Module');
                  if (seen.has(title)) return null;
                  seen.add(title);
                  return title;
                })
                .filter(Boolean)
                .join(', ');
              return (
              <div key={draft.id} style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #e5e7eb', padding: '18px 32px' }}>
                <div style={{ flex: 2, fontWeight: 600, color: '#23272f' }}>{draft.name || draft.contentName || 'Untitled Draft'}</div>
                <div style={{ flex: 1.2, color: '#23272f', fontWeight: 500 }}>
                  {(() => {
                    // Determine A+ type based on draftType and modules
                    if (draft.draftType === 'premium') return 'Premium';
                    if (draft.draftType === 'brand') return 'Brand Story';
                    
                    // Check if it's premium based on module types
                    const hasPremiumModules = (draft.modules || []).some(m => {
                      const type = m.type || m.moduleType || m.id;
                      const typeStr = typeof type === 'string' ? type : String(type || '');
                      return typeStr.includes('premium') || 
                        typeStr === 'premium-full-image' ||
                        typeStr === 'premium-four-images-text' ||
                        typeStr === 'premium-three-images-text' ||
                        typeStr === 'premium-single-left-image' ||
                        typeStr === 'standard-single-image-sidebar';
                    });
                    
                    if (hasPremiumModules) return 'Premium';
                    
                    // Default to Basic
                    return 'Basic';
                  })()}
                </div>
                  <div style={{ flex: 2, color: '#23272f', fontSize: 15 }}>{moduleTitles}</div>
                  <div style={{ flex: 2, color: '#64748b', fontSize: 15 }}>{draft.date ? new Date(draft.date).toLocaleString() : ''}</div>
                <div style={{ flex: 2, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 18px', fontWeight: 600, cursor: 'pointer' }} onClick={() => handleLoadDraft(draft)}>Load</button>
                  <button style={{ background: '#fff', color: '#b12704', border: '1.5px solid #b12704', borderRadius: 6, padding: '7px 18px', fontWeight: 600, cursor: 'pointer' }} onClick={() => handleDeleteDraft(draft.id)}>Delete</button>
                </div>
              </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  // Run cleanup on app start
  useEffect(() => {
    cleanupLocalStorage().catch(error => {
      console.warn('Failed to clean up local storage:', error);
    });
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/get-started" element={<HomePage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/basic/edit" element={<ContentEditPage />} />
        <Route path="/basic/edit/:id" element={<ContentEditPage />} />
        <Route path="/premium/edit" element={<PremiumContentEditPage />} />
        <Route path="/premium/edit/:id" element={<PremiumContentEditPage />} />
        {/* Add the hyphenated version for backward compatibility */}
        <Route path="/premium-edit" element={<PremiumContentEditPage />} />
        <Route path="/premium-edit/:id" element={<PremiumContentEditPage />} />
        <Route path="/manage-drafts" element={<ManageDraftsPage />} />
        <Route path="/premium-manage-drafts" element={<PremiumManageDraftsPage />} />
        <Route path="/basic-manage-drafts" element={<BasicManageDraftsPage />} />
        <Route path="/generate-brief" element={<GenerateBriefPage />} />
      </Routes>
    </Router>
  );
}

export default App;


