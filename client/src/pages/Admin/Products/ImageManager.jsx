import { useState, useEffect } from 'react';
import { Star, Trash2, Upload, AlertCircle } from 'lucide-react';
import {
  adminGetProductImages,
  adminUploadProductImage,
  adminDeleteProductImage,
  adminSetPrimaryImage,
} from '../../../services/admin.service';
import styles from './ImageManager.module.css';

const ImageManager = ({ productId }) => {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const load = () =>
    adminGetProductImages(productId)
      .then((data) => setImages(Array.isArray(data) ? data : []))
      .catch(() => {});

  useEffect(() => { load(); }, [productId]);

  const handleFiles = async (files) => {
    if (!files?.length) return;
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const data = await adminUploadProductImage(productId, file);
        if (data.error) { setError(data.error); break; }
      }
      await load();
    } catch {
      setError('Erreur lors de l\'upload.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDelete = async (imageId) => {
    const data = await adminDeleteProductImage(productId, imageId);
    if (data.error) { setError(data.error); return; }
    await load();
  };

  const handleSetPrimary = async (imageId) => {
    await adminSetPrimaryImage(productId, imageId);
    await load();
  };

  return (
    <div className={styles.root}>
      <div className={styles.label}>Images</div>

      {error && (
        <div className={styles.error}><AlertCircle size={13} />{error}</div>
      )}

      {images.length > 0 && (
        <div className={styles.grid}>
          {images.map((img) => (
            <div key={img.id} className={`${styles.card} ${img.is_primary ? styles.cardPrimary : ''}`}>
              <img
                src={img.url}
                alt={img.alt || ''}
                className={styles.img}
              />
              <div className={styles.cardActions}>
                <button
                  type="button"
                  className={`${styles.actionBtn} ${img.is_primary ? styles.actionBtnActive : ''}`}
                  onClick={() => !img.is_primary && handleSetPrimary(img.id)}
                  title={img.is_primary ? 'Image principale' : 'Définir comme principale'}
                >
                  <Star size={13} fill={img.is_primary ? 'currentColor' : 'none'} />
                </button>
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                  onClick={() => handleDelete(img.id)}
                  title="Supprimer"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              {img.is_primary && <div className={styles.primaryBadge}>Principale</div>}
            </div>
          ))}
        </div>
      )}

      <label
        className={`${styles.dropzone} ${dragOver ? styles.dropzoneActive : ''} ${uploading ? styles.dropzoneUploading : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className={styles.hiddenInput}
          disabled={uploading}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Upload size={20} className={styles.dropzoneIcon} />
        <span className={styles.dropzoneText}>
          {uploading ? 'Upload en cours…' : 'Glisser des images ici ou cliquer pour sélectionner'}
        </span>
        <span className={styles.dropzoneHint}>JPG, PNG, WebP — 10 Mo max</span>
      </label>
    </div>
  );
};

export default ImageManager;
