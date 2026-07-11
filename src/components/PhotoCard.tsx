import { MapPin, Calendar, Trash2 } from 'lucide-react';
import type { Photo } from '../services/supabaseClient';

type PhotoCardProps = {
  photo: Photo;
  onDelete?: (id: string) => void;
  onOpen?: (photo: Photo) => void;
};

export default function PhotoCard({ photo, onDelete, onOpen }: PhotoCardProps) {
  return (
    <div className="group relative bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800 hover:border-neutral-700 transition-all duration-300 hover:shadow-2xl hover:shadow-black/40">
      <div
        className="relative aspect-[4/3] overflow-hidden bg-neutral-800 cursor-pointer"
        onClick={() => onOpen?.(photo)}
      >
        <img
          src={photo.storage_url}
          alt={photo.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(photo.id);
            }}
            className="absolute top-2 right-2 p-2 bg-black/60 backdrop-blur-sm rounded-lg text-neutral-300 hover:text-red-400 hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100"
            title="Supprimer"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-white text-base leading-snug line-clamp-2">{photo.title}</h3>

        <div className="flex items-center gap-1.5 text-xs text-neutral-400">
          <Calendar size={13} className="shrink-0" />
          <span>{formatDate(photo.photo_date)}</span>
        </div>

        {photo.location && (
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <MapPin size={13} className="shrink-0" />
            <span className="line-clamp-1">{photo.location}</span>
          </div>
        )}

        {photo.story && (
          <p className="text-sm text-neutral-500 line-clamp-3 leading-relaxed pt-1">{photo.story}</p>
        )}
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
