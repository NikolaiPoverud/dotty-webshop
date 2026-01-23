'use client';

import { useRef, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import JSZip from 'jszip';
import { AlertCircle, CheckCircle, Download, FileText, Loader2, Upload, X } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

type ConversionStatus = 'pending' | 'converting' | 'done' | 'error';

interface ConvertedFile {
  id: string;
  originalName: string;
  status: ConversionStatus;
  pngDataUrl?: string;
  error?: string;
}

const STATUS_LABELS: Record<ConversionStatus, string> = {
  pending: 'Venter...',
  converting: 'Konverterer...',
  done: 'Ferdig',
  error: '',
};

function getStatusLabel(file: ConvertedFile): string {
  if (file.status === 'error') {
    return file.error || 'Feil';
  }
  return STATUS_LABELS[file.status];
}

function generateFileId(fileName: string): string {
  return `${fileName}-${Date.now()}-${Math.random()}`;
}

interface FileStatusIndicatorProps {
  file: ConvertedFile;
  onDownload: () => void;
}

function FileStatusIndicator({ file, onDownload }: FileStatusIndicatorProps): React.ReactElement | null {
  switch (file.status) {
    case 'converting':
      return <Loader2 className="w-5 h-5 animate-spin text-primary" />;
    case 'done':
      return (
        <>
          <CheckCircle className="w-5 h-5 text-green-500" />
          <button
            onClick={onDownload}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            title="Last ned"
          >
            <Download className="w-5 h-5" />
          </button>
        </>
      );
    case 'error':
      return <AlertCircle className="w-5 h-5 text-error" />;
    default:
      return null;
  }
}

interface FilePreviewProps {
  file: ConvertedFile;
}

function FilePreview({ file }: FilePreviewProps): React.ReactElement {
  if (file.status === 'done' && file.pngDataUrl) {
    return (
      <img
        src={file.pngDataUrl}
        alt={file.originalName}
        className="w-full h-full object-cover"
      />
    );
  }
  return <FileText className="w-8 h-8 text-muted-foreground" />;
}

export default function PdfConverterPage(): React.ReactElement {
  const [files, setFiles] = useState<ConvertedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function updateFileStatus(
    fileId: string,
    updates: Partial<ConvertedFile>
  ): void {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, ...updates } : f))
    );
  }

  async function convertPdfToPng(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);

    const scale = 2;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport,
      canvas: canvas,
    }).promise;

    return canvas.toDataURL('image/png');
  }

  async function processFiles(fileList: FileList): Promise<void> {
    const pdfFiles = Array.from(fileList).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );

    if (pdfFiles.length === 0) return;

    const newFiles: ConvertedFile[] = pdfFiles.map((f) => ({
      id: generateFileId(f.name),
      originalName: f.name,
      status: 'pending',
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    const batchSize = 3;
    for (let i = 0; i < pdfFiles.length; i += batchSize) {
      const batch = pdfFiles.slice(i, i + batchSize);
      const batchIds = newFiles.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (file, idx) => {
          const fileId = batchIds[idx].id;
          updateFileStatus(fileId, { status: 'converting' });

          try {
            const pngDataUrl = await convertPdfToPng(file);
            updateFileStatus(fileId, { status: 'done', pngDataUrl });
          } catch (error) {
            console.error('Conversion error:', error);
            updateFileStatus(fileId, { status: 'error', error: 'Kunne ikke konvertere' });
          }
        })
      );
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>): void {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  }

  function handleDrop(e: React.DragEvent): void {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
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

  function downloadFile(file: ConvertedFile): void {
    if (!file.pngDataUrl) return;

    const link = document.createElement('a');
    link.download = file.originalName.replace('.pdf', '.png');
    link.href = file.pngDataUrl;
    link.click();
  }

  async function downloadAll(): Promise<void> {
    const doneFiles = files.filter((f) => f.status === 'done' && f.pngDataUrl);
    if (doneFiles.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();

      for (const file of doneFiles) {
        if (!file.pngDataUrl) continue;
        const response = await fetch(file.pngDataUrl);
        const blob = await response.blob();
        const filename = file.originalName.replace(/\.pdf$/i, '.png');
        zip.file(filename, blob);
      }

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
  }

  function removeFile(id: string): void {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function clearAll(): void {
    setFiles([]);
  }

  const doneCount = files.filter((f) => f.status === 'done').length;
  const pendingCount = files.filter(
    (f) => f.status === 'pending' || f.status === 'converting'
  ).length;

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
        className={`relative rounded-lg border-2 border-dashed p-12 text-center cursor-pointer transition-colors mb-8 ${
          isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
        }`}
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
            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
              <FilePreview file={file} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{file.originalName}</p>
              <p className="text-sm text-muted-foreground">
                {getStatusLabel(file)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <FileStatusIndicator
                file={file}
                onDownload={() => downloadFile(file)}
              />
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
