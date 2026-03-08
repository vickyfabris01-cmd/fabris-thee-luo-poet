import { useState } from 'react';
import Cropper from 'react-easy-crop';
import Modal from './Modal';

export default function ImageCropper({ file, onSave, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState(null);
  const [loading, setLoading] = useState(false);

  const imageUrl = URL.createObjectURL(file);

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedArea(croppedAreaPixels);
  };

  const handleSaveCrop = async () => {
    if (!croppedArea) {
      alert('Please crop the image first');
      return;
    }

    setLoading(true);
    try {
      // Create canvas and crop image
      const image = new Image();
      image.src = imageUrl;

      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Use the smaller of width/height for a square crop
        const size = Math.min(croppedArea.width, croppedArea.height);
        canvas.width = size;
        canvas.height = size;

        ctx.drawImage(
          image,
          croppedArea.x,
          croppedArea.y,
          croppedArea.width,
          croppedArea.height,
          0,
          0,
          size,
          size
        );

        canvas.toBlob((blob) => {
          const croppedFile = new File([blob], file.name, { type: 'image/jpeg' });
          onSave(croppedFile);
          setLoading(false);
        }, 'image/jpeg', 0.95);
      };
    } catch (err) {
      console.error('Crop error:', err);
      alert('Error cropping image: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <Modal open={true} onClose={onCancel}>
      <div style={{ padding: 20, maxWidth: 500 }}>
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>Crop Profile Image</h3>
        
        <div style={{ position: 'relative', width: '100%', height: 300, marginBottom: 16, background: 'var(--surface)' }}>
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={true}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ display: 'block', marginBottom: 4, fontSize: 12, color: 'var(--muted)' }}>Zoom</span>
          <input 
            type="range" 
            value={zoom} 
            onInput={(e) => setZoom(parseFloat(e.target.value))} 
            min="1" 
            max="3" 
            step="0.1" 
            style={{ width: '100%' }}
          />
        </label>

        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            onClick={handleSaveCrop} 
            className="btn-primary" 
            disabled={loading}
            style={{ flex: 1 }}
          >
            {loading ? 'Saving...' : 'Save Crop'}
          </button>
          <button 
            onClick={onCancel}
            disabled={loading}
            style={{ flex: 1 }}
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
