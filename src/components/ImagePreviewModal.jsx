import React, { useState } from 'react';
import PropTypes from 'prop-types';

function ImagePreviewModal({ 
  isOpen, 
  onClose, 
  imagePreviewUrl, 
  onConfirm 
}) {
  const [cropType, setCropType] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleConfirm = async () => {
    setIsUploading(true);
    await onConfirm(cropType);
    setIsUploading(false);
    setCropType('');
  };

  const handleCancel = () => {
    setCropType('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <span className="close-modal" onClick={handleCancel}>&times;</span>
        <h3>Confirm Image Upload</h3>
        <div className="image-preview-container">
          <img 
            src={imagePreviewUrl} 
            alt="Preview" 
            className="image-preview" 
          />
        </div>
        <div className="crop-type-container">
          <label htmlFor="crop-type">Crop Type (optional):</label>
          <input 
            type="text" 
            id="crop-type" 
            value={cropType}
            onChange={(e) => setCropType(e.target.value)}
            placeholder="e.g., Tomato, Rice, Wheat" 
          />
        </div>
        <div className="modal-buttons">
          <button 
            id="confirm-upload" 
            onClick={handleConfirm}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Analyze Disease'}
          </button>
          <button 
            id="cancel-upload" 
            onClick={handleCancel}
            disabled={isUploading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

ImagePreviewModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  imagePreviewUrl: PropTypes.string,
  onConfirm: PropTypes.func.isRequired
};

export default ImagePreviewModal;
