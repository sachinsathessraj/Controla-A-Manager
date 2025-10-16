import React, { useState } from 'react';

function DragDropImageUpload({ onImagesSelected }) {
  const [selectedImages, setSelectedImages] = useState([]);
  const [error, setError] = useState('');

  const handleDrop = (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    processFiles(files);
  };

  const processFiles = (files) => {
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    if (validFiles.length !== files.length) {
      setError('Some files were not images and were ignored.');
    }
    const updatedImages = [...selectedImages, ...validFiles];
    setSelectedImages(updatedImages);
    onImagesSelected(updatedImages);
  };

  const handleRemoveImage = (index) => {
    const updatedImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(updatedImages);
    onImagesSelected(updatedImages);
  };

  return (
    <div 
      onDrop={handleDrop} 
      onDragOver={(e) => e.preventDefault()} 
      style={{ border: '2px dashed #ccc', padding: '20px', textAlign: 'center' }}
    >
      <p>Drag and drop images here, or click to select files</p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: '10px' }}>
        {selectedImages.map((file, index) => (
          <div key={index} style={{ margin: '10px', position: 'relative' }}>
            <img 
              src={URL.createObjectURL(file)} 
              alt="preview"
              style={{ width: '100px', height: '100px', objectFit: 'cover' }}
            />
            <button 
              onClick={() => handleRemoveImage(index)}
              style={{ position: 'absolute', top: 0, right: 0 }}
            >
              X
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DragDropImageUpload;
