import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, X } from 'lucide-react';
import { supabase, type Photo, type Story } from './services/supabaseClient';
import { extractStoragePath } from './utils/storagePath';
import Auth from './components/Auth';
import PhotoForm from './components/PhotoForm';
import PhotoCard from './components/PhotoCard';
import PhotoOverlay from './components/PhotoOverlay';
import InstallPrompt from './components/InstallPrompt';
import StoriesView from './components/StoriesView';
import StoryCarousel from './components/StoryCarousel';
import AddToStoryModal from './components/AddToStoryModal';
import PdfExportModal from './components/PdfExportModal';
import EmptyState from './components/EmptyState';
import TimelineView from './components/TimelineView';
import AppHeader, { type ViewMode, type TabMode } from './components/AppHeader';
import BulkActionsBar from './components/BulkActionsBar';
import FloatingActions from './components/FloatingActions';

export default function App() {
  const [session, setSession] = useState<boolean | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [tabMode, setTabMode] = useState<TabMode>('photos');
  const [search, setSearch] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [overlayPhoto, setOverlayPhoto] = useState<Photo | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [addToStoryOpen, setAddToStoryOpen] = useState(false);
  const [pdfExportOpen, setPdfExportOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [carouselStory, setCarouselStory] = useState<{ story: Story; photos: Photo[] } | null>(null);
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
        setDeleteError(`Impossible de charger les photos: ${error.message}`);
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
    if (!file.type.startsWith('image/')) {
      setDeleteError('Le fichier doit être une image');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setDeleteError("L'image ne doit pas dépasser 20 Mo");
      return;
    }
    setDeleteError(null);
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

    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer "${photo.title}" ? Cette action est irréversible.`
    );
    if (!confirmed) return;

    const { error: deleteErr } = await supabase.from('photos').delete().eq('id', id);

    if (deleteErr) {
      setDeleteError(`Erreur lors de la suppression: ${deleteErr.message}`);
      return;
    }

    const filePath = extractStoragePath(photo.storage_url);
    if (filePath) {
      const { error: storageError } = await supabase.storage.from('photos').remove([filePath]);
      if (storageError) {
        console.warn('Storage remove failed after DB delete:', storageError.message);
      }
    }

    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  function exitSelectionMode() {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0 || bulkDeleting) return;

    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer ${ids.length} photo${ids.length > 1 ? 's' : ''} ? Cette action est irréversible.`
    );
    if (!confirmed) return;

    setBulkDeleting(true);
    setDeleteError(null);

    try {
      const toDelete = photos.filter((p) => selectedIds.has(p.id));
      const { error: deleteErr } = await supabase.from('photos').delete().in('id', ids);

      if (deleteErr) {
        setDeleteError(`Erreur lors de la suppression: ${deleteErr.message}`);
        return;
      }

      const paths = toDelete
        .map((p) => extractStoragePath(p.storage_url))
        .filter((p): p is string => Boolean(p));
      if (paths.length > 0) {
        const { error: storageError } = await supabase.storage.from('photos').remove(paths);
        if (storageError) {
          console.warn('Storage bulk remove failed after DB delete:', storageError.message);
        }
      }

      setPhotos((prev) => prev.filter((p) => !selectedIds.has(p.id)));
      exitSelectionMode();
    } finally {
      setBulkDeleting(false);
    }
  }

  function handleOverlayUpdated(updatedPhoto: Photo) {
    setPhotos((prev) => prev.map((p) => (p.id === updatedPhoto.id ? updatedPhoto : p)));
    setOverlayPhoto(updatedPhoto);
  }

  function handleToggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleSelectAll() {
    if (selectedIds.size === filteredPhotos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPhotos.map((p) => p.id)));
    }
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
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (err) {
      console.warn('SignOut server call failed:', err);
    } finally {
      setSession(false);
      try {
        Object.keys(localStorage)
          .filter((key) => key.startsWith('sb-'))
          .forEach((key) => localStorage.removeItem(key));
      } catch (err) {
        console.warn('localStorage cleanup failed:', err);
      }
    }
  }

  function handleTabChange(tab: TabMode) {
    setTabMode(tab);
    exitSelectionMode();
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

  const selectedPhotos = photos.filter((p) => selectedIds.has(p.id));

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
      <AppHeader
        tabMode={tabMode}
        viewMode={viewMode}
        search={search}
        selectionMode={selectionMode}
        photosCount={photos.length}
        onTabChange={handleTabChange}
        onViewModeChange={setViewMode}
        onSearchChange={setSearch}
        onEnterSelectionMode={() => setSelectionMode(true)}
        onExitSelectionMode={exitSelectionMode}
        onExport={handleExport}
        onSignOut={handleSignOut}
      />

      {selectionMode && (
        <BulkActionsBar
          selectedCount={selectedIds.size}
          filteredCount={filteredPhotos.length}
          bulkDeleting={bulkDeleting}
          onSelectAll={handleSelectAll}
          onAddToStory={() => setAddToStoryOpen(true)}
          onExportPdf={() => setPdfExportOpen(true)}
          onBulkDelete={handleBulkDelete}
        />
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {deleteError && (
          <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between gap-3 animate-fadeIn">
            <p className="text-sm text-red-400">{deleteError}</p>
            <button
              onClick={() => setDeleteError(null)}
              className="text-red-400 hover:text-red-300 transition-colors shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        )}
        {tabMode === 'stories' ? (
          <StoriesView
            onOpenCarousel={(story, storyPhotos) => setCarouselStory({ story, photos: storyPhotos })}
          />
        ) : loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-neutral-600" size={32} />
          </div>
        ) : filteredPhotos.length === 0 ? (
          <EmptyState
            onUpload={() => fileInputRef.current?.click()}
            onCapture={() => cameraInputRef.current?.click()}
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPhotos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onDelete={handleDelete}
                onOpen={setOverlayPhoto}
                selectionMode={selectionMode}
                selected={selectedIds.has(photo.id)}
                onToggleSelect={handleToggleSelect}
              />
            ))}
          </div>
        ) : (
          <TimelineView
            photos={filteredPhotos}
            onDelete={handleDelete}
            onOpen={setOverlayPhoto}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
          />
        )}
      </main>

      <FloatingActions
        visible={tabMode === 'photos'}
        uploading={uploading}
        fileInputRef={fileInputRef}
        cameraInputRef={cameraInputRef}
        onFileSelect={handleFileSelect}
      />

      {pendingFile && pendingPreview && (
        <PhotoForm
          file={pendingFile}
          previewUrl={pendingPreview}
          onClose={handleFormClose}
          onSaved={handleFormSaved}
        />
      )}

      {overlayPhoto && (
        <PhotoOverlay
          photo={overlayPhoto}
          onClose={() => setOverlayPhoto(null)}
          onUpdated={handleOverlayUpdated}
        />
      )}

      {carouselStory && (
        <StoryCarousel
          photos={carouselStory.photos}
          storyTitle={carouselStory.story.title}
          storyDescription={carouselStory.story.description}
          onClose={() => setCarouselStory(null)}
        />
      )}

      {addToStoryOpen && (
        <AddToStoryModal
          photoIds={Array.from(selectedIds)}
          onClose={() => setAddToStoryOpen(false)}
          onAdded={() => {
            setAddToStoryOpen(false);
            exitSelectionMode();
          }}
        />
      )}

      {pdfExportOpen && (
        <PdfExportModal photos={selectedPhotos} onClose={() => setPdfExportOpen(false)} />
      )}

      <InstallPrompt />
    </div>
  );
}
