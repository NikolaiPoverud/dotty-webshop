'use client';

import { AnimatePresence, motion, Reorder, useDragControls } from 'framer-motion';
import { GripVertical, Loader2, Plus, X } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';

import type { GalleryImage } from '@/types';

interface GalleryUploadProps {
  value: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
}

interface DraggableImageItemProps {
  image: GalleryImage;
  index: number;
  onRemove: () => void;
}

function DraggableImageItem({ image, index, onRemove }: DraggableImageItemProps): React.ReactElement {
  const dragControls = useDragControls();

  function handlePointerDown(e: React.PointerEvent): void {
    dragControls.start(e);
  }

  return (
    <Reorder.Item
      value={image}
      dragListener={false}
      dragControls={dragControls}
      className="relative aspect-square rounded-md overflow-hidden bg-muted group cursor-grab active:cursor-grabbing"
      whileDrag={{ scale: 1.05, zIndex: 10, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
    >
      <Image
        src={image.url}
        alt={`Gallery image ${index + 1}`}
        fill
        className="object-cover pointer-events-none"
      />

      <div
        onPointerDown={handlePointerDown}
        className="absolute inset-0 flex items-center justify-center bg-background/0 hover:bg-background/40 transition-colors cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="w-6 h-6 text-white drop-shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="absolute top-1 left-1 w-5 h-5 bg-background/90 rounded-full flex items-center justify-center text-xs font-medium pointer-events-none">
        {index + 1}
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 p-1 bg-error text-background rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error/80 z-10"
        title="Fjern"
      >
        <X className="w-3 h-3" />
      </button>
    </Reorder.Item>
  );
}

export function GalleryUpload({ value, onChange }: GalleryUploadProps): React.ReactElement {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File): Promise<void> {
    if (!file || file.size === 0) {
      setError('No file selected or file is empty');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const responseText = await response.text();

      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        console.error('Failed to parse response:', responseText);
        throw new Error('Server returned invalid response');
      }

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      const newImage: GalleryImage = {
        url: result.data.url,
        path: result.data.path,
      };

      onChange([...value, newImage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  async function handleRemove(index: number): Promise<void> {
    const imageToRemove = value[index];

    if (imageToRemove.path) {
      try {
        await fetch('/api/admin/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: imageToRemove.path }),
        });
      } catch (err) {
        console.error('Failed to delete image:', err);
      }
    }

    const newImages = value.filter((_, i) => i !== index);
    onChange(newImages);
  }

  const ButtonIcon = isUploading ? Loader2 : Plus;
  const buttonText = isUploading ? 'Laster opp...' : 'Legg til bilde';

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {value.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Reorder.Group
              axis="x"
              values={value}
              onReorder={onChange}
              className="grid grid-cols-4 sm:grid-cols-5 gap-2"
              as="div"
            >
              {value.map((image, index) => (
                <DraggableImageItem
                  key={image.path || image.url}
                  image={image}
                  index={index}
                  onRemove={() => handleRemove(index)}
                />
              ))}
            </Reorder.Group>
            <p className="text-xs text-muted-foreground mt-2">
              Dra bildene for å endre rekkefølge
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="w-full py-3 px-4 border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground disabled:opacity-50"
      >
        <ButtonIcon className={`w-5 h-5 ${isUploading ? 'animate-spin' : ''}`} />
        <span>{buttonText}</span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />

      <p className="text-xs text-muted-foreground">
        Legg til flere bilder for å vise et galleri på produktsiden
      </p>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-error"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
