import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { FileText, X, Loader2 } from 'lucide-react';
import type { Photo } from '../services/supabaseClient';

type PdfExportModalProps = {
  photos: Photo[];
  onClose: () => void;
};

export default function PdfExportModal({ photos, onClose }: PdfExportModalProps) {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generate() {
    setGenerating(true);
    setError(null);

    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 40;
      const imgMaxWidth = pageWidth - margin * 2;
      const imgMaxHeight = pageHeight * 0.5;

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        setProgress(Math.round(((i + 1) / photos.length) * 100));

        if (i > 0) doc.addPage();

        let y = margin;

        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(20, 20, 20);
        const titleLines = doc.splitTextToSize(photo.title, imgMaxWidth);
        doc.text(titleLines, margin, y + 14);
        y += titleLines.length * 22 + 8;

        // Date + Location
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(120, 120, 120);
        const dateStr = new Date(photo.photo_date).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
        const metaParts = [dateStr, photo.location].filter(Boolean);
        if (metaParts.length > 0) {
          doc.text(metaParts.join(' - '), margin, y + 10);
          y += 20;
        }

        // Image
        const imgData = await fetchImageAsBase64(photo.storage_url);
        if (imgData) {
          const { width, height } = await getImageDimensions(imgData, imgMaxWidth, imgMaxHeight);
          const imgY = y;
          try {
            doc.addImage(imgData, 'JPEG', margin, imgY, width, height);
          } catch {
            try {
              doc.addImage(imgData, 'PNG', margin, imgY, width, height);
            } catch {
              // skip image if format unsupported
            }
          }
          y += height + 16;
        }

        // Story
        if (photo.story) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(11);
          doc.setTextColor(50, 50, 50);
          const storyLines = doc.splitTextToSize(photo.story, imgMaxWidth);
          const availableHeight = pageHeight - y - margin;
          const maxLines = Math.floor(availableHeight / 16);
          const linesToShow = storyLines.slice(0, maxLines);
          doc.text(linesToShow, margin, y + 10);
        }
      }

      doc.save(`photostory-${new Date().toISOString().split('T')[0]}.pdf`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la generation du PDF');
      setGenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-neutral-800">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText size={18} /> Export PDF
          </h2>
          {!generating && (
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-neutral-800"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="p-6 flex flex-col items-center">
          {generating ? (
            <>
              <Loader2 size={32} className="animate-spin text-white mb-4" />
              <p className="text-sm text-neutral-400 mb-2">Generation du PDF...</p>
              <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-neutral-600 mt-2">{progress}%</p>
            </>
          ) : error ? (
            <div className="w-full text-center">
              <p className="text-sm text-red-400 mb-4">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-neutral-800 text-neutral-300 rounded-xl text-sm hover:bg-neutral-700 transition-all"
              >
                Fermer
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function fetchImageAsBase64(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 1200;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = maxDim / Math.max(width, height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      try {
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function getImageDimensions(
  dataUrl: string,
  maxWidth: number,
  maxHeight: number
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
      width = width * ratio;
      height = height * ratio;
      resolve({ width, height });
    };
    img.onerror = () => resolve({ width: maxWidth, height: maxHeight * 0.6 });
    img.src = dataUrl;
  });
}
