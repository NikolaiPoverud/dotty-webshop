'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, Trash2, Image as ImageIcon, Loader2, CheckCircle } from 'lucide-react';

interface ConvertedImage {
  id: string;
  originalName: string;
  originalSize: number;
  webpBlob: Blob;
  webpSize: number;
  previewUrl: string;
  savings: number;
}

const QUALITY_PRESETS = [
  { value: 0.95, label: 'Maximum (95%)', description: 'Best quality, larger files' },
  { value: 0.85, label: 'High (85%)', description: 'Recommended for product images' },
  { value: 0.75, label: 'Medium (75%)', description: 'Good balance' },
  { value: 0.60, label: 'Low (60%)', description: 'Smaller files, visible compression' },
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export default function WebPConverterPage() {
  const [images, setImages] = useState<ConvertedImage[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [quality, setQuality] = useState(0.85);
  const [dragActive, setDragActive] = useState(false);

  const convertToWebP = useCallback(async (file: File): Promise<ConvertedImage> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Could not convert to WebP'));
              return;
            }

            const savings = Math.round((1 - blob.size / file.size) * 100);

            resolve({
              id: generateId(),
              originalName: file.name.replace(/\.(png|jpg|jpeg)$/i, '.webp'),
              originalSize: file.size,
              webpBlob: blob,
              webpSize: blob.size,
              previewUrl: URL.createObjectURL(blob),
              savings,
            });
          },
          'image/webp',
          quality
        );
      };

      img.onerror = () => reject(new Error('Could not load image'));
      img.src = URL.createObjectURL(file);
    });
  }, [quality]);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(file =>
      file.type === 'image/png' || file.type === 'image/jpeg'
    );

    if (validFiles.length === 0) return;

    setIsConverting(true);

    try {
      const converted = await Promise.all(validFiles.map(convertToWebP));
      setImages(prev => [...prev, ...converted]);
    } catch (error) {
      console.error('Conversion error:', error);
    } finally {
      setIsConverting(false);
    }
  }, [convertToWebP]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  function handleDownload(image: ConvertedImage): void {
    const url = URL.createObjectURL(image.webpBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = image.originalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleDownloadAll(): void {
    images.forEach(image => handleDownload(image));
  }

  function handleRemove(id: string): void {
    setImages(prev => {
      const image = prev.find(img => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.previewUrl);
      }
      return prev.filter(img => img.id !== id);
    });
  }

  function handleClearAll(): void {
    images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
  }

  const totalOriginalSize = images.reduce((acc, img) => acc + img.originalSize, 0);
  const totalWebPSize = images.reduce((acc, img) => acc + img.webpSize, 0);
  const totalSavings = totalOriginalSize > 0
    ? Math.round((1 - totalWebPSize / totalOriginalSize) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">WebP Converter</h1>
        <p className="text-muted-foreground mt-1">
          Convert PNG/JPG images to WebP format for smaller file sizes
        </p>
      </div>

      {/* Quality Selector */}
      <div className="bg-muted rounded-xl p-6 border border-border">
        <h2 className="font-semibold mb-4">Quality Setting</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUALITY_PRESETS.map(preset => (
            <button
              key={preset.value}
              onClick={() => setQuality(preset.value)}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                quality === preset.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="font-medium text-sm">{preset.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{preset.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all ${
          dragActive
            ? 'border-primary bg-primary/10'
            : 'border-border hover:border-primary/50'
        }`}
      >
        <input
          type="file"
          accept="image/png,image/jpeg"
          multiple
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center gap-4">
          {isConverting ? (
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          ) : (
            <Upload className="w-12 h-12 text-muted-foreground" />
          )}
          <div>
            <p className="font-medium">
              {isConverting ? 'Converting...' : 'Drop images here or click to upload'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              PNG and JPG files supported
            </p>
          </div>
        </div>
      </div>

      {/* Results */}
      {images.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Summary Stats */}
          <div className="bg-muted rounded-xl p-6 border border-border">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Original</p>
                  <p className="text-xl font-bold">{formatBytes(totalOriginalSize)}</p>
                </div>
                <div className="text-2xl text-muted-foreground">→</div>
                <div>
                  <p className="text-sm text-muted-foreground">WebP</p>
                  <p className="text-xl font-bold text-primary">{formatBytes(totalWebPSize)}</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-success/10 text-success rounded-full">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-semibold">{totalSavings}% smaller</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleDownloadAll}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-background font-medium rounded-lg hover:bg-primary-light transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download All ({images.length})
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Image List */}
          <div className="grid gap-3">
            {images.map(image => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-4 p-4 bg-muted rounded-lg border border-border"
              >
                {/* Preview */}
                <div className="relative w-16 h-16 rounded-md overflow-hidden bg-background flex-shrink-0">
                  <img
                    src={image.previewUrl}
                    alt={image.originalName}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{image.originalName}</p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span>{formatBytes(image.originalSize)}</span>
                    <span>→</span>
                    <span className="text-primary font-medium">{formatBytes(image.webpSize)}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      image.savings > 0 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                    }`}>
                      {image.savings > 0 ? `-${image.savings}%` : `+${Math.abs(image.savings)}%`}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(image)}
                    className="p-2 bg-background border border-border rounded-lg hover:bg-primary hover:text-background hover:border-primary transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemove(image.id)}
                    className="p-2 bg-background border border-border rounded-lg hover:bg-error hover:text-background hover:border-error transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Tips */}
      <div className="bg-muted/50 rounded-xl p-6 border border-border">
        <h3 className="font-semibold flex items-center gap-2 mb-3">
          <ImageIcon className="w-5 h-5 text-primary" />
          Optimal Image Sizes for Gallery
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• <strong>Main product images:</strong> 1280 × 1600px (4:5 ratio)</li>
          <li>• <strong>High-res option:</strong> 1920 × 2400px for maximum quality</li>
          <li>• <strong>Recommended quality:</strong> 85% for product images</li>
          <li>• <strong>Target file size:</strong> Under 200KB per image</li>
        </ul>
      </div>
    </div>
  );
}
