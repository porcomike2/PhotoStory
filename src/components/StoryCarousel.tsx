import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar, MapPin, FileText } from 'lucide-react';
import type { Photo } from '../services/supabaseClient';

type StoryCarouselProps = {
  photos: Photo[];
  storyTitle: string;
  storyDescription?: string | null;
  onClose: () => void;
};

export default function StoryCarousel({ photos, storyTitle, storyDescription, onClose }: StoryCarouselProps) {
  const [index, setIndex] = useState(0);
  const [showInfo, setShowInfo] = useState(true);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % photos.length);
  }, [photos.length]);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + photos.length) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [next, prev, onClose]);

  if (photos.length === 0) return null;

  const photo = photos[index];

  return (
    <div className="fixed inset-0 z-50 bg-black/95 animate-fadeIn flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 z-20 shrink-0">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-white truncate">{storyTitle}</h2>
          {storyDescription && (
            <p className="text-xs text-neutral-500 truncate">{storyDescription}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-500 tabular-nums">
            {index + 1} / {photos.length}
          </span>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-all"
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {/* Carousel area */}
      <div className="flex-1 min-h-0 flex items-center justify-center relative px-4">
        <button
          onClick={prev}
          disabled={photos.length <= 1}
          className="absolute left-2 sm:left-4 p-2.5 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition-all disabled:opacity-30 disabled:cursor-not-allowed z-10"
        >
          <ChevronLeft size={24} />
        </button>

        <div
          className="max-w-full max-h-full flex items-center justify-center cursor-pointer"
          onClick={() => setShowInfo(!showInfo)}
        >
          <img
            key={photo.id}
            src={photo.storage_url}
            alt={photo.title}
            className="max-w-full max-h-full object-contain rounded-lg animate-fadeIn select-none"
            draggable={false}
          />
        </div>

        <button
          onClick={next}
          disabled={photos.length <= 1}
          className="absolute right-2 sm:right-4 p-2.5 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition-all disabled:opacity-30 disabled:cursor-not-allowed z-10"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Info panel */}
      {showInfo && (
        <div className="shrink-0 bg-neutral-950/95 backdrop-blur-xl border-t border-neutral-800 max-h-[35vh] overflow-y-auto animate-fadeIn">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 space-y-2">
            <h3 className="text-lg font-bold text-white">{photo.title}</h3>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-neutral-400">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="shrink-0" />
                {formatDate(photo.photo_date)}
              </div>
              {photo.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} className="shrink-0" />
                  {photo.location}
                </div>
              )}
            </div>
            {photo.story && (
              <div className="flex items-start gap-2 text-sm text-neutral-300 leading-relaxed pt-1">
                <FileText size={14} className="shrink-0 mt-0.5 text-neutral-500" />
                <p className="whitespace-pre-wrap">{photo.story}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dot indicators */}
      {photos.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? 'w-6 bg-white' : 'w-1.5 bg-neutral-600'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
