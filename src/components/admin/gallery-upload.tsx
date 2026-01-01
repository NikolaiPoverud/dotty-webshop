'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Loader2, GripVertical } from 'lucide-react';
import Image from 'next/image';
import type { GalleryImage } from '@/types';

interface GalleryUploadProps {
  value: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
}

export function GalleryUpload({ value, onChange }: GalleryUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

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

  const moveImage = useCallback((fromIndex: number, toIndex: number) => {
    const newImages = [...value];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    onChange(newImages);
  }, [value, onChange]);

  return (
    <div className="space-y-3">
      {/* Existing Images */}
      <AnimatePresence>
        {value.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-3 gap-3"
          >
            {value.map((image, index) => (
              <motion.div
                key={image.path || index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
              >
                <Image
                  src={image.url}
                  alt={`Gallery image ${index + 1}`}
                  fill
                  className="object-cover"
                />

                {/* Order indicator */}
                <div className="absolute top-1 left-1 w-5 h-5 bg-background/80 rounded-full flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </div>

                {/* Actions overlay */}
                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => moveImage(index, index - 1)}
                      className="p-1.5 bg-background rounded-full hover:bg-muted transition-colors"
                      title="Flytt til venstre"
                    >
                      <GripVertical className="w-4 h-4 rotate-90" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="p-1.5 bg-error text-background rounded-full hover:bg-error/80 transition-colors"
                    title="Fjern"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {index < value.length - 1 && (
                    <button
                      type="button"
                      onClick={() => moveImage(index, index + 1)}
                      className="p-1.5 bg-background rounded-full hover:bg-muted transition-colors"
                      title="Flytt til høyre"
                    >
                      <GripVertical className="w-4 h-4 rotate-90" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
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
