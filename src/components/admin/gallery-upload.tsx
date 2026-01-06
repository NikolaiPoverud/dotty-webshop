'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { Plus, X, Loader2, GripVertical } from 'lucide-react';
import Image from 'next/image';
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

function DraggableImageItem({ image, index, onRemove }: DraggableImageItemProps) {
  const dragControls = useDragControls();

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

      {/* Drag handle */}
      <div
        onPointerDown={(e) => dragControls.start(e)}
        className="absolute inset-0 flex items-center justify-center bg-background/0 hover:bg-background/40 transition-colors cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="w-6 h-6 text-white drop-shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Order indicator */}
      <div className="absolute top-1 left-1 w-5 h-5 bg-background/90 rounded-full flex items-center justify-center text-xs font-medium pointer-events-none">
        {index + 1}
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-1 right-1 p-1 bg-error text-background rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error/80 z-10"
        title="Fjern"
      >
        <X className="w-3 h-3" />
      </button>
    </Reorder.Item>
  );
}

export function GalleryUpload({ value, onChange }: GalleryUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setError(null);
    setIsUploading(true);

    try {
      // Validate file exists and has content (Safari fix)
      if (!file || file.size === 0) {
        throw new Error('No file selected or file is empty');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      // Get response as text first to handle Safari's JSON parsing quirks
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
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
    // Reset input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleRemove = async (index: number) => {
    const imageToRemove = value[index];

    // Try to delete from storage
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

    // Remove from array
    const newImages = value.filter((_, i) => i !== index);
    onChange(newImages);
  };

  return (
    <div className="space-y-3">
      {/* Draggable Image Grid */}
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

      {/* Add Image Button */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="w-full py-3 px-4 border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground disabled:opacity-50"
      >
        {isUploading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Laster opp...</span>
          </>
        ) : (
          <>
            <Plus className="w-5 h-5" />
            <span>Legg til bilde</span>
          </>
        )}
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
