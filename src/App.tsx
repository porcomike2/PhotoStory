import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  Upload,
  Grid3x3,
  List,
  Search,
  Download,
  LogOut,
  Loader2,
  Image as ImageIcon,
  Calendar,
  MapPin,
  FileText,
} from 'lucide-react';
import { supabase, type Photo } from './services/supabaseClient';
import Auth from './components/Auth';
import PhotoForm from './components/PhotoForm';
import PhotoCard from './components/PhotoCard';
import PhotoOverlay from './components/PhotoOverlay';

type ViewMode = 'grid' | 'timeline';

export default function App() {
  const [session, setSession] = useState<boolean | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [search, setSearch] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [overlayPhoto, setOverlayPhoto] = useState<Photo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchPhotos = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .order('photo_date', { ascending: false });

      if (error) {
        console.error('Error fetching photos:', error);
      } else {
        setPhotos(data || []);
      }
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchPhotos();
    } else {
      setPhotos([]);
      setLoading(false);
    }
  }, [session, fetchPhotos]);

  function handleFileSelect(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    const url = URL.createObjectURL(file);
    setPendingPreview(url);
    setPendingFile(file);
    setUploading(false);
  }

  function handleFormClose() {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingFile(null);
    setPendingPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  }

  function handleFormSaved() {
    handleFormClose();
    fetchPhotos();
  }

  async function handleDelete(id: string) {
    const photo = photos.find((p) => p.id === id);
    if (!photo) return;

    const filePath = photo.storage_url.split('/photos/')[1];
    if (filePath) {
      await supabase.storage.from('photos').remove([filePath]);
    }

    await supabase.from('photos').delete().eq('id', id);
    setPhotos(photos.filter((p) => p.id !== id));
  }

  function handleExport() {
    const exportData = photos.map((p) => ({
      id: p.id,
      title: p.title,
      photo_date: p.photo_date,
      location: p.location,
      story: p.story,
      gps_lat: p.gps_lat,
      gps_lng: p.gps_lng,
      storage_url: p.storage_url,
      created_at: p.created_at,
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `photostory-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  const filteredPhotos = photos.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.location?.toLowerCase().includes(q) ||
      p.story?.toLowerCase().includes(q)
    );
  });

  if (session === null) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-neutral-600" size={32} />
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center">
                <Camera size={20} className="text-black" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">PhotoStory</h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExport}
                disabled={photos.length === 0}
                className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                title="Exporter mes souvenirs"
              >
                <Download size={18} />
                <span className="hidden sm:inline">Exporter</span>
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-all"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Deconnexion</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par titre, lieu, ou histoire..."
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-all"
              />
            </div>

            <div className="flex gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
                }`}
                title="Vue grille"
              >
                <Grid3x3 size={18} />
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'timeline' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
                }`}
                title="Vue timeline"
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-neutral-600" size={32} />
          </div>
        ) : filteredPhotos.length === 0 ? (
          <EmptyState onUpload={() => fileInputRef.current?.click()} onCapture={() => cameraInputRef.current?.click()} />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPhotos.map((photo) => (
              <PhotoCard key={photo.id} photo={photo} onDelete={handleDelete} onOpen={setOverlayPhoto} />
            ))}
          </div>
        ) : (
          <TimelineView photos={filteredPhotos} onDelete={handleDelete} onOpen={setOverlayPhoto} />
        )}
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-20">
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files?.[0])}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files?.[0])}
        />

        <button
          onClick={() => cameraInputRef.current?.click()}
          disabled={uploading}
          className="w-14 h-14 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          title="Capturer une photo"
        >
          {uploading ? <Loader2 size={22} className="animate-spin" /> : <Camera size={22} />}
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          title="Importer une photo"
        >
          <Upload size={22} />
        </button>
      </div>

      {/* Photo Form Modal */}
      {pendingFile && pendingPreview && (
        <PhotoForm file={pendingFile} previewUrl={pendingPreview} onClose={handleFormClose} onSaved={handleFormSaved} />
      )}

      {/* Photo Overlay (zoom + detail + edit) */}
      {overlayPhoto && (
        <PhotoOverlay
          photo={overlayPhoto}
          onClose={() => setOverlayPhoto(null)}
          onUpdated={fetchPhotos}
        />
      )}
    </div>
  );
}

function EmptyState({ onUpload, onCapture }: { onUpload: () => void; onCapture: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 bg-neutral-900 border border-neutral-800 rounded-3xl flex items-center justify-center mb-5">
        <ImageIcon size={36} className="text-neutral-600" />
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">Aucun souvenir pour l'instant</h2>
      <p className="text-neutral-500 max-w-sm mb-6">
        Commencez a documenter votre vie en important ou capturant votre premiere photo.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onCapture}
          className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-white hover:bg-neutral-800 transition-all"
        >
          <Camera size={18} /> Capturer
        </button>
        <button
          onClick={onUpload}
          className="flex items-center gap-2 px-4 py-2.5 bg-white text-black rounded-xl text-sm font-medium hover:bg-neutral-200 transition-all"
        >
          <Upload size={18} /> Importer
        </button>
      </div>
    </div>
  );
}

function TimelineView({ photos, onDelete, onOpen }: { photos: Photo[]; onDelete: (id: string) => void; onOpen: (photo: Photo) => void }) {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-px bg-neutral-800" />

      <div className="space-y-8">
        {photos.map((photo) => (
          <div key={photo.id} className="relative pl-12 sm:pl-16">
            {/* Dot */}
            <div className="absolute left-3 sm:left-5 top-2 w-3 h-3 bg-white rounded-full ring-4 ring-neutral-950" />

            <div className="group relative bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800 hover:border-neutral-700 transition-all duration-300">
              <div className="flex flex-col sm:flex-row">
                <div
                  className="relative sm:w-56 h-40 sm:h-auto shrink-0 overflow-hidden bg-neutral-800 cursor-pointer"
                  onClick={() => onOpen?.(photo)}
                >
                  <img
                    src={photo.storage_url}
                    alt={photo.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  {onDelete && (
                    <button
                      onClick={() => onDelete(photo.id)}
                      className="absolute top-2 right-2 p-2 bg-black/60 backdrop-blur-sm rounded-lg text-neutral-300 hover:text-red-400 transition-all sm:opacity-0 group-hover:opacity-100"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  )}
                </div>

                <div className="flex-1 p-5 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-neutral-500 uppercase tracking-wide font-medium">
                    <Calendar size={13} />
                    {formatDate(photo.photo_date)}
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
        ))}
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
