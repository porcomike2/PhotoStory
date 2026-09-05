import { Calendar, MapPin, FileText, CheckSquare } from 'lucide-react';
import type { Photo } from '../services/supabaseClient';
import { formatDateLong } from '../utils/date';

type TimelineViewProps = {
  photos: Photo[];
  onDelete: (id: string) => void;
  onOpen: (photo: Photo) => void;
  selectionMode?: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
};

export default function TimelineView({
  photos,
  onDelete,
  onOpen,
  selectionMode,
  selectedIds,
  onToggleSelect,
}: TimelineViewProps) {
  return (
    <div className="relative">
      <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-px bg-neutral-800" />

      <div className="space-y-8">
        {photos.map((photo) => {
          const isSelected = selectedIds.has(photo.id);
          return (
            <div key={photo.id} className="relative pl-12 sm:pl-16">
              <div
                className={`absolute left-3 sm:left-5 top-2 w-3 h-3 rounded-full ring-4 ring-neutral-950 ${
                  isSelected ? 'bg-white' : 'bg-neutral-500'
                }`}
              />

              <div
                className={`group relative bg-neutral-900 rounded-2xl overflow-hidden border transition-all duration-300 ${
                  isSelected
                    ? 'border-white ring-2 ring-white/30'
                    : 'border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row">
                  <div
                    className="relative sm:w-56 h-40 sm:h-auto shrink-0 overflow-hidden bg-neutral-800"
                    onClick={() => (selectionMode ? onToggleSelect(photo.id) : onOpen(photo))}
                    style={{ cursor: selectionMode ? 'pointer' : 'zoom-in' }}
                  >
                    <img
                      src={photo.storage_url}
                      alt={photo.title}
                      loading="lazy"
                      className={`w-full h-full object-cover ${isSelected ? 'opacity-70' : ''}`}
                    />

                    {selectionMode && (
                      <div
                        className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-white border-white'
                            : 'bg-black/50 border-white/70 backdrop-blur-sm'
                        }`}
                      >
                        {isSelected && <CheckSquare size={14} className="text-black" />}
                      </div>
                    )}

                    {!selectionMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(photo.id);
                        }}
                        className="absolute top-2 right-2 p-2 bg-black/60 backdrop-blur-sm rounded-lg text-neutral-300 hover:text-red-400 transition-all sm:opacity-0 group-hover:opacity-100"
                        title="Supprimer"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="flex-1 p-5 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-neutral-500 uppercase tracking-wide font-medium">
                      <Calendar size={13} />
                      {formatDateLong(photo.photo_date)}
                    </div>

                    <h3 className="text-lg font-semibold text-white leading-snug">{photo.title}</h3>

                    {photo.location && (
                      <div className="flex items-center gap-1.5 text-sm text-neutral-400">
                        <MapPin size={14} className="shrink-0" />
                        <span className="line-clamp-1">{photo.location}</span>
                      </div>
                    )}

                    {photo.story && (
                      <div className="flex items-start gap-1.5 text-sm text-neutral-500 leading-relaxed pt-1">
                        <FileText size={14} className="shrink-0 mt-0.5" />
                        <p className="line-clamp-4">{photo.story}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
