'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, Loader2, X, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';

// Configure PDF.js worker - use local copy for speed
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface ConvertedFile {
  id: string;
  originalName: string;
  status: 'pending' | 'converting' | 'done' | 'error';
  pngDataUrl?: string;
  error?: string;
}

export default function PdfConverterPage() {
  const [files, setFiles] = useState<ConvertedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const convertPdfToPng = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    // Get first page (artwork PDFs typically have one page)
    const page = await pdf.getPage(1);

    // High resolution for quality artwork
    const scale = 2;
    const viewport = page.getViewport({ scale });

    // Create canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Render PDF page to canvas
    await page.render({
      canvasContext: context,
      viewport: viewport,
      canvas: canvas,
    }).promise;

    // Convert to PNG
    return canvas.toDataURL('image/png');
  };

  const processFiles = async (fileList: FileList) => {
    const pdfFiles = Array.from(fileList).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );

    if (pdfFiles.length === 0) return;

    // Add files to state
    const newFiles: ConvertedFile[] = pdfFiles.map((f) => ({
      id: `${f.name}-${Date.now()}-${Math.random()}`,
      originalName: f.name,
      status: 'pending' as const,
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    // Process files in parallel batches of 3
    const batchSize = 3;
    for (let i = 0; i < pdfFiles.length; i += batchSize) {
      const batch = pdfFiles.slice(i, i + batchSize);
      const batchIds = newFiles.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (file, idx) => {
          const fileId = batchIds[idx].id;

          // Update status to converting
          setFiles((prev) =>
            prev.map((f) => (f.id === fileId ? { ...f, status: 'converting' as const } : f))
          );

          try {
            const pngDataUrl = await convertPdfToPng(file);
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileId ? { ...f, status: 'done' as const, pngDataUrl } : f
              )
            );
          } catch (error) {
            console.error('Conversion error:', error);
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileId
                  ? { ...f, status: 'error' as const, error: 'Kunne ikke konvertere' }
                  : f
              )
            );
          }
        })
      );
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const downloadFile = (file: ConvertedFile) => {
    if (!file.pngDataUrl) return;

    const link = document.createElement('a');
    link.download = file.originalName.replace('.pdf', '.png');
    link.href = file.pngDataUrl;
    link.click();
  };

  const downloadAll = async () => {
    const doneFiles = files.filter((f) => f.status === 'done' && f.pngDataUrl);
    if (doneFiles.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();

      // Add each PNG to the zip
      for (const file of doneFiles) {
        if (!file.pngDataUrl) continue;
        // Convert data URL to blob
        const response = await fetch(file.pngDataUrl);
        const blob = await response.blob();
        const filename = file.originalName.replace('.pdf', '.png').replace('.PDF', '.png');
        zip.file(filename, blob);
      }

      // Generate and download zip
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.download = `dotty-bilder-${Date.now()}.zip`;
      link.href = URL.createObjectURL(zipBlob);
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Zip error:', error);
    } finally {
      setIsZipping(false);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const clearAll = () => {
    setFiles([]);
  };

  const doneCount = files.filter((f) => f.status === 'done').length;
  const pendingCount = files.filter((f) => f.status === 'pending' || f.status === 'converting').length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">PDF til PNG Konverter</h1>
        <p className="text-muted-foreground">
          Last opp PDF-filer for å konvertere til PNG-bilder som kan brukes som produktbilder.
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={`
          relative rounded-lg border-2 border-dashed p-12 text-center cursor-pointer
          transition-colors mb-8
          ${isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg font-medium mb-2">
          {isDragging ? 'Slipp filene her' : 'Dra og slipp PDF-filer her'}
        </p>
        <p className="text-sm text-muted-foreground">
          eller klikk for å velge (flere filer støttes)
        </p>
      </div>

      {/* Actions */}
      {files.length > 0 && (
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-muted-foreground">
            {doneCount} av {files.length} konvertert
            {pendingCount > 0 && ` (${pendingCount} behandles...)`}
          </div>
          <div className="flex gap-3">
            <button
              onClick={clearAll}
              className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Tøm liste
            </button>
            {doneCount > 0 && (
              <button
                onClick={downloadAll}
                disabled={isZipping}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isZipping ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Pakker...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Last ned ZIP ({doneCount})
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* File List */}
      <AnimatePresence mode="popLayout">
        {files.map((file) => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex items-center gap-4 p-4 mb-3 bg-card border border-border rounded-lg"
          >
            {/* Preview/Icon */}
            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
              {file.status === 'done' && file.pngDataUrl ? (
                <img
                  src={file.pngDataUrl}
                  alt={file.originalName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <FileText className="w-8 h-8 text-muted-foreground" />
              )}
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{file.originalName}</p>
              <p className="text-sm text-muted-foreground">
                {file.status === 'pending' && 'Venter...'}
                {file.status === 'converting' && 'Konverterer...'}
                {file.status === 'done' && 'Ferdig'}
                {file.status === 'error' && file.error}
              </p>
            </div>

            {/* Status/Actions */}
            <div className="flex items-center gap-2">
              {file.status === 'converting' && (
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              )}
              {file.status === 'done' && (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <button
                    onClick={() => downloadFile(file)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title="Last ned"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </>
              )}
              {file.status === 'error' && (
                <AlertCircle className="w-5 h-5 text-error" />
              )}
              <button
                onClick={() => removeFile(file.id)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title="Fjern"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Empty State */}
      {files.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Ingen filer ennå. Last opp PDF-filer for å komme i gang.</p>
        </div>
      )}
    </div>
  );
}
