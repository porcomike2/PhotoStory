import { useState, useEffect } from 'react';
import {
  TransformWrapper,
  TransformComponent,
  useControls,
} from 'react-zoom-pan-pinch';
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize,
  Calendar,
  MapPin,
  FileText,
  Pencil,
  Save,
  Loader2,
} from 'lucide-react';
import type { Photo } from '../services/supabaseClient';
import { supabase } from '../services/supabaseClient';

type PhotoOverlayProps = {
  photo: Photo;
  onClose: () => void;
  onUpdated: () => void;
};

export default function PhotoOverlay({ photo, onClose, onUpdated }: PhotoOverlayProps) {
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !editing) onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [editing, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 animate-fadeIn flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 z-20 shrink-0">
        <span className="text-sm text-neutral-500 truncate max-w-[60%]">{photo.title}</span>
        <button
          onClick={onClose}
          className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-all"
        >
          <X size={22} />
        </button>
      </div>

      {/* Zoomable image area */}
      <div className="flex-1 min-h-0 overflow-hidden flex items-center justify-center relative">
        <TransformWrapper
          initialScale={1}
          minScale={1}
          maxScale={4}
          wheel={{ step: 0.1 }}
          pinch={{ step: 5 }}
          doubleClick={{ mode: 'zoomIn', step: 2 }}
          limitToBounds={true}
          centerOnInit={true}
        >
          <ZoomControls />
          <TransformComponent
            wrapperClass="!w-full !h-full !overflow-hidden flex items-center justify-center"
            contentClass="!w-full !h-full !overflow-hidden flex items-center justify-center"
          >
            <img
              src={photo.storage_url}
              alt={photo.title}
              className="max-w-full max-h-full object-contain select-none pointer-events-auto"
              draggable={false}
            />
          </TransformComponent>
        </TransformWrapper>
      </div>

      {/* Detail panel */}
      <div className="shrink-0 bg-neutral-950/95 backdrop-blur-xl border-t border-neutral-800 max-h-[45vh] overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-bold text-white leading-snug">{photo.title}</h2>
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-all shrink-0"
            >
              <Pencil size={15} /> Modifier
            </button>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-400">
            <div className="flex items-center gap-1.5">
              <Calendar size={15} className="shrink-0" />
              {formatDate(photo.photo_date)}
            </div>
            {photo.location && (
              <div className="flex items-center gap-1.5">
                <MapPin size={15} className="shrink-0" />
                {photo.location}
              </div>
            )}
          </div>

          {photo.story && (
            <div className="flex items-start gap-2 text-sm text-neutral-300 leading-relaxed pt-1">
              <FileText size={15} className="shrink-0 mt-0.5 text-neutral-500" />
              <p className="whitespace-pre-wrap">{photo.story}</p>
            </div>
          )}

          {!photo.story && !photo.location && (
            <p className="text-sm text-neutral-600 italic">Aucun detail supplementaire.</p>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <EditModal photo={photo} onClose={() => setEditing(false)} onSaved={onUpdated} />
      )}
    </div>
  );
}

function ZoomControls() {
  const { zoomIn, zoomOut, resetTransform } = useControls();

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 p-1 bg-black/60 backdrop-blur-md rounded-xl border border-neutral-700/50">
      <button
        onClick={() => zoomOut()}
        className="p-2 text-neutral-300 hover:text-white rounded-lg transition-all"
        title="Dezoomer"
      >
        <ZoomOut size={18} />
      </button>
      <button
        onClick={() => resetTransform()}
        className="p-2 text-neutral-300 hover:text-white rounded-lg transition-all"
        title="Reinitialiser"
      >
        <Maximize size={18} />
      </button>
      <button
        onClick={() => zoomIn()}
        className="p-2 text-neutral-300 hover:text-white rounded-lg transition-all"
        title="Zoomer"
      >
        <ZoomIn size={18} />
      </button>
    </div>
  );
}

function EditModal({ photo, onClose, onSaved }: { photo: Photo; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(photo.title);
  const [photoDate, setPhotoDate] = useState(toInputDate(photo.photo_date));
  const [location, setLocation] = useState(photo.location || '');
  const [story, setStory] = useState(photo.story || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!title.trim()) {
      setError('Le titre est obligatoire');
      return;
    }
    if (!photoDate) {
      setError('La date est obligatoire');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('photos')
        .update({
          title: title.trim(),
          photo_date: new Date(photoDate).toISOString(),
          location: location.trim() || null,
          story: story.trim() || null,
        })
        .eq('id', photo.id);

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 sticky top-0 bg-neutral-900 z-10">
          <h2 className="text-lg font-semibold text-white">Modifier le souvenir</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-neutral-800"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-300">Titre</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-all"
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-300">Date</label>
            <input
              type="datetime-local"
              value={photoDate}
              onChange={(e) => setPhotoDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-all"
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-300">Lieu</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Lieu de la photo"
              className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-all"
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-300">Histoire</label>
            <textarea
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="Racontez l'histoire derriere cette photo..."
              rows={4}
              className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-all resize-none"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={loading || !title.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-black rounded-xl font-medium hover:bg-neutral-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Enregistrement...
              </>
            ) : (
              <>
                <Save size={18} /> Enregistrer les modifications
              </>
            )}
          </button>
        </div>
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
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toInputDate(iso: string): string {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
