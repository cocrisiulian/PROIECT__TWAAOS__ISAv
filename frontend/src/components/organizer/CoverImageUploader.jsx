import { useEffect, useMemo, useState } from 'react';
import Cropper from 'react-easy-crop';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { uploadCoverImage } from '../../api/organizer.js';
import { parseCoverImage } from '../../utils/coverImage.js';
import { toPublicAssetUrl } from '../../utils/assetUrl.js';

const OUTPUT_KEYS = ['card', 'list', 'background'];
const ALLOWED_FILE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

function CropPreview({ src, alt }) {
  if (!src) {
    return <div className="h-20 rounded-md bg-gray-100 border border-dashed border-gray-300" />;
  }

  return (
    <img
      src={src}
      alt={alt}
      className="h-20 w-full object-cover rounded-md border border-gray-200"
    />
  );
}

export default function CoverImageUploader({ value, onChange, onUploadModeChange, disabled }) {
  const { t } = useTranslation();
  const [imageSrc, setImageSrc] = useState('');
  const [sourceFile, setSourceFile] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const parsedValue = useMemo(() => parseCoverImage(value), [value]);
  const currentPreview = parsedValue.card || parsedValue.list || parsedValue.background || '';
  const currentPreviewUrl = useMemo(() => toPublicAssetUrl(currentPreview), [currentPreview]);
  const isManagedCoverValue = useMemo(() => {
    if (!value || typeof value !== 'string') return false;
    const trimmed = value.trim();
    if (!trimmed) return false;
    return trimmed.startsWith('{') || trimmed.includes('/uploads/covers/');
  }, [value]);

  useEffect(() => {
    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageSrc]);

  useEffect(() => {
    onUploadModeChange?.(Boolean(sourceFile) || isManagedCoverValue);
  }, [isManagedCoverValue, onUploadModeChange, sourceFile]);

  const isAllowedImage = (file) => {
    if (!file) return false;
    if (ALLOWED_FILE_TYPES.has(file.type)) return true;
    const lowerName = (file.name || '').toLowerCase();
    return ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  };

  const clearSelectedImage = () => {
    if (imageSrc) {
      URL.revokeObjectURL(imageSrc);
    }
    setImageSrc('');
    setSourceFile(null);
    setShowEditor(false);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    onChange('');
    onUploadModeChange?.(false);
  };

  const editCurrentImage = async () => {
    if (!currentPreviewUrl) {
      toast.error(t('organizer.coverUploader.errors.noExistingImage'));
      return;
    }

    setUploading(true);
    try {
      const response = await fetch(currentPreviewUrl);
      if (!response.ok) {
        throw new Error('Unable to load existing image');
      }

      const blob = await response.blob();
      const mimeType = blob.type || 'image/webp';
      const extension = mimeType.includes('png')
        ? 'png'
        : mimeType.includes('gif')
          ? 'gif'
          : mimeType.includes('jpeg')
            ? 'jpg'
            : mimeType.includes('webp')
              ? 'webp'
              : 'img';

      const file = new File([blob], `existing-cover.${extension}`, { type: mimeType });
      const objectUrl = URL.createObjectURL(file);

      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }

      setImageSrc(objectUrl);
      setSourceFile(file);
      setShowEditor(true);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      onUploadModeChange?.(true);
    } catch (error) {
      toast.error(t('organizer.coverUploader.errors.openCurrentFailed'));
    } finally {
      setUploading(false);
    }
  };

  const onSelectFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!isAllowedImage(file)) {
      toast.error(t('organizer.coverUploader.errors.invalidType'));
      return;
    }

    if (imageSrc) {
      URL.revokeObjectURL(imageSrc);
    }

    const objectUrl = URL.createObjectURL(file);
    setImageSrc(objectUrl);
    setSourceFile(file);
    setShowEditor(true);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    onUploadModeChange?.(true);
  };

  const saveCropSelection = async () => {
    if (!sourceFile) {
      toast.error(t('organizer.coverUploader.errors.selectImage'));
      return;
    }

    if (!croppedAreaPixels) {
      toast.error(t('organizer.coverUploader.errors.adjustCrop'));
      return;
    }

    const normalizedArea = {
      x: Math.round(croppedAreaPixels.x),
      y: Math.round(croppedAreaPixels.y),
      width: Math.round(croppedAreaPixels.width),
      height: Math.round(croppedAreaPixels.height),
    };

    // One crop controls all output variants.
    const cropPayload = Object.fromEntries(
      OUTPUT_KEYS.map((key) => [key, normalizedArea])
    );

    setUploading(true);
    try {
      const response = await uploadCoverImage(sourceFile, cropPayload);
      onChange(response.data.cover_image_url);
      toast.success(t('organizer.coverUploader.successUploaded'));
      setShowEditor(false);
      onUploadModeChange?.(true);
    } catch (error) {
      toast.error(error?.response?.data?.detail || t('organizer.coverUploader.errors.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium cursor-pointer hover:bg-gray-50 transition">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
            onChange={onSelectFile}
            className="hidden"
            disabled={disabled || uploading}
          />
          {t('organizer.coverUploader.uploadFromDevice')}
        </label>
        {currentPreviewUrl && !showEditor && (
          <button
            type="button"
            onClick={editCurrentImage}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-200 text-sm font-medium text-blue-600 hover:bg-blue-50 transition"
            disabled={disabled || uploading}
          >
            {t('organizer.coverUploader.editCurrentImage')}
          </button>
        )}
        {(showEditor || sourceFile || currentPreviewUrl) && (
          <button
            type="button"
            onClick={clearSelectedImage}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition"
            disabled={disabled || uploading}
          >
            {t('organizer.coverUploader.deleteSelectedImage')}
          </button>
        )}
        <span className="text-xs text-gray-500">{t('organizer.coverUploader.helperText')}</span>
      </div>

      {currentPreviewUrl ? (
        <div>
          <p className="text-xs text-gray-500 mb-1">{t('organizer.coverUploader.currentCover')}</p>
          <CropPreview src={currentPreviewUrl} alt={t('organizer.coverUploader.currentCover')} />
        </div>
      ) : null}

      {showEditor && imageSrc && (
        <div className="rounded-xl border border-gray-200 p-3 bg-gray-50 space-y-3">
          <div className="flex flex-wrap gap-2 text-xs text-gray-600">
            <span className="px-2.5 py-1.5 rounded-full border border-blue-600 bg-blue-600 text-white">
              {t('organizer.coverUploader.mainCropArea')}
            </span>
          </div>

          <div className="relative w-full h-72 rounded-lg overflow-hidden bg-black/80">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={16 / 9}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, croppedAreaPixelsValue) => {
                setCroppedAreaPixels(croppedAreaPixelsValue);
              }}
              minZoom={1}
              maxZoom={3}
              zoomSpeed={0.1}
              objectFit="contain"
              showGrid
            />
          </div>

          <div>
            <label className="text-xs text-gray-600">{t('organizer.coverUploader.zoom')} {zoom.toFixed(2)}x</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(event) => {
                const nextZoom = parseFloat(event.target.value);
                setZoom(nextZoom);
              }}
              className="w-full"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowEditor(false)}
              className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-white"
              disabled={uploading}
            >
              {t('organizer.form.cancel')}
            </button>
            <button
              type="button"
              onClick={saveCropSelection}
              className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              disabled={uploading}
            >
              {uploading ? t('organizer.coverUploader.processing') : t('organizer.coverUploader.saveCropUpload')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
