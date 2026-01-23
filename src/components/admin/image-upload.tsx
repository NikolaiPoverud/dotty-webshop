'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Image as ImageIcon, Loader2, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';

import { adminFetch } from '@/lib/admin-fetch';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value?: string;
  path?: string;
  onChange: (url: string, path: string) => void;
  onRemove?: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function ImageUpload({ value, path, onChange, onRemove }: ImageUploadProps): React.ReactElement {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File): Promise<void> {
    if (!file || file.size === 0) {
      setError('No file selected or file is empty');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max 10MB)`);
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await adminFetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      // Check content-type to see if we got JSON or HTML error
      const contentType = response.headers.get('content-type') || '';

      if (!contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 500));
        throw new Error(`Upload failed: Server error (${response.status})`);
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      onChange(result.data.url, result.data.path);
    } catch (err) {
      console.error('Upload error:', err);
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
  }

  function handleDrop(e: React.DragEvent): void {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleUpload(file);
    }
  }

  function handleDragOver(e: React.DragEvent): void {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent): void {
    e.preventDefault();
    setIsDragging(false);
  }

  async function handleRemove(): Promise<void> {
    if (path) {
      try {
        await fetch('/api/admin/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path }),
        });
      } catch (err) {
        console.error('Failed to delete image:', err);
      }
    }
    onRemove?.();
  }

  return (
    <div className="space-y-2">
      <AnimatePresence mode="wait">
        {value ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative aspect-[4/3] max-h-64 rounded-lg overflow-hidden bg-muted"
          >
            <Image
              src={value}
              alt="Product preview"
              fill
              className="object-cover"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-2 bg-background/80 hover:bg-error/80 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              'relative aspect-[4/3] max-h-64 rounded-lg border-2 border-dashed transition-colors cursor-pointer',
              isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50',
              isUploading && 'pointer-events-none'
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
              {isUploading ? (
                <>
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Laster opp...</p>
                </>
              ) : (
                <>
                  <div className="p-4 rounded-full bg-muted">
                    {isDragging ? (
                      <Upload className="w-8 h-8 text-primary" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      {isDragging ? 'Slipp for å laste opp' : 'Dra og slipp bilde her'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">eller klikk for å velge</p>
                  </div>
                  <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, GIF (maks 10MB)</p>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
