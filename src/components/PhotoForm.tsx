import { useState, useEffect } from 'react';
import { X, Loader2, Save, MapPin, Calendar, FileText, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { extractExif, reverseGeocode, getCurrentLocation } from '../services/exifService';

type PhotoFormProps = {
  file: File;
  previewUrl: string;
  onClose: () => void;
  onSaved: () => void;
};

export default function PhotoForm({ file, previewUrl, onClose, onSaved }: PhotoFormProps) {
  const [title, setTitle] = useState('');
  const [photoDate, setPhotoDate] = useState('');
  const [location, setLocation] = useState('');
  const [story, setStory] = useState('');
  const [gpsLat, setGpsLat] = useState<number | null>(null);
  const [gpsLng, setGpsLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function processFile() {
      setExtracting(true);
      setError(null);

      try {
        const exif = await extractExif(file);

        if (cancelled) return;

        if (exif.photoDate) {
          const d = new Date(exif.photoDate);
          setPhotoDate(formatDateForInput(d));
        } else {
          setPhotoDate(formatDateForInput(new Date()));
        }

        if (exif.gpsLat !== null && exif.gpsLng !== null) {
          setGpsLat(exif.gpsLat);
          setGpsLng(exif.gpsLng);

          const address = await reverseGeocode(exif.gpsLat, exif.gpsLng);
          if (!cancelled && address) {
            setLocation(address);
          }
        } else {
          const currentLoc = await getCurrentLocation();
          if (!cancelled && currentLoc) {
            setGpsLat(currentLoc.lat);
            setGpsLng(currentLoc.lng);
            const address = await reverseGeocode(currentLoc.lat, currentLoc.lng);
            if (!cancelled && address) {
              setLocation(address);
            }
          }
        }
      } catch {
        if (!cancelled) {
          setPhotoDate(formatDateForInput(new Date()));
        }
      } finally {
        if (!cancelled) {
          setExtracting(false);
        }
      }
    }

    processFile();

    return () => {
      cancelled = true;
    };
  }, [file]);

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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError('Vous devez etre connecte');
        setLoading(false);
        return;
      }

      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, file, { upsert: false });

      if (uploadError) {
        setError(`Erreur d'upload: ${uploadError.message}`);
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('photos').getPublicUrl(fileName);
      const storageUrl = urlData.publicUrl;

      const { error: insertError } = await supabase.from('photos').insert({
        storage_url: storageUrl,
        title: title.trim(),
        photo_date: new Date(photoDate).toISOString(),
        location: location.trim() || null,
        story: story.trim() || null,
        gps_lat: gpsLat,
        gps_lng: gpsLng,
      });

      if (insertError) {
        setError(`Erreur d'enregistrement: ${insertError.message}`);
        setLoading(false);
        return;
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 sticky top-0 bg-neutral-900 z-10">
          <h2 className="text-lg font-semibold text-white">Enrichir le souvenir</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-neutral-800"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="relative w-full h-48 rounded-xl overflow-hidden bg-neutral-800">
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            {extracting && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-white">
                  <Loader2 className="animate-spin" size={24} />
                  <span className="text-sm">Extraction EXIF...</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-300">
              <ImageIcon size={15} /> Titre
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Donnez un titre a ce souvenir"
              className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-all"
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-300">
              <Calendar size={15} /> Date
            </label>
            <input
              type="datetime-local"
              value={photoDate}
              onChange={(e) => setPhotoDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-all"
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-300">
              <MapPin size={15} /> Lieu
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Lieu de la photo"
              className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-all"
              disabled={loading || extracting}
            />
            {extracting && (
              <p className="text-xs text-neutral-500 flex items-center gap-1">
                <Loader2 size={11} className="animate-spin" /> Detection du lieu...
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-300">
              <FileText size={15} /> Histoire
            </label>
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
            disabled={loading || extracting || !title.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-black rounded-xl font-medium hover:bg-neutral-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Enregistrement...
              </>
            ) : (
              <>
                <Save size={18} /> Enregistrer le souvenir
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
