import { useState, useEffect, useCallback } from 'react';
import { supabase, type Story, type Photo } from '../services/supabaseClient';
import StoryCarousel from './StoryCarousel';
import { BookOpen, Plus, X, Loader2, Images, Calendar } from 'lucide-react';

type StoriesViewProps = {
  onOpenCarousel?: (story: Story, photos: Photo[]) => void;
};

export default function StoriesView({ onOpenCarousel }: StoriesViewProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [activeStory, setActiveStory] = useState<{ story: Story; photos: Photo[] } | null>(null);

  const fetchStories = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching stories:', error);
      } else {
        setStories(data || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  async function openStory(story: Story) {
    const { data, error } = await supabase
      .from('photo_stories')
      .select('photos(*)')
      .eq('story_id', story.id)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching story photos:', error);
      return;
    }

    const photos = (data || []).map((d: { photos: Photo | Photo[] }) => {
      return Array.isArray(d.photos) ? d.photos[0] : d.photos;
    }).filter(Boolean) as Photo[];
    if (photos.length === 0) return;

    if (onOpenCarousel) {
      onOpenCarousel(story, photos);
    } else {
      setActiveStory({ story, photos });
    }
  }

  return (
    <div>
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="animate-spin text-neutral-600" size={32} />
        </div>
      ) : stories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-neutral-900 border border-neutral-800 rounded-3xl flex items-center justify-center mb-5">
            <BookOpen size={36} className="text-neutral-600" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Aucune story pour l'instant</h2>
          <p className="text-neutral-500 max-w-sm mb-6">
            Creez une story pour regrouper vos photos autour d'un theme ou d'un evenement.
          </p>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-black rounded-xl text-sm font-medium hover:bg-neutral-200 transition-all"
          >
            <Plus size={18} /> Creer une story
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-neutral-500">{stories.length} story{stories.length > 1 ? 's' : ''}</p>
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 rounded-lg transition-all"
            >
              <Plus size={16} /> Nouvelle story
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} onOpen={() => openStory(story)} />
            ))}
          </div>
        </>
      )}

      {creating && (
        <CreateStoryModal
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            fetchStories();
          }}
        />
      )}

      {activeStory && (
        <StoryCarousel
          photos={activeStory.photos}
          storyTitle={activeStory.story.title}
          storyDescription={activeStory.story.description}
          onClose={() => setActiveStory(null)}
        />
      )}
    </div>
  );
}

function StoryCard({ story, onOpen }: { story: Story; onOpen: () => void }) {
  const [photoCount, setPhotoCount] = useState<number | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { count } = await supabase
        .from('photo_stories')
        .select('*', { count: 'exact', head: true })
        .eq('story_id', story.id);
      setPhotoCount(count ?? 0);

      const { data } = await supabase
        .from('photo_stories')
        .select('photos(storage_url)')
        .eq('story_id', story.id)
        .order('position', { ascending: true })
        .limit(1);

      if (data && data.length > 0) {
        const first = data[0] as { photos: { storage_url: string } | { storage_url: string }[] };
        const photoObj = Array.isArray(first.photos) ? first.photos[0] : first.photos;
        setThumbnail(photoObj?.storage_url ?? null);
      }
    }
    load();
  }, [story.id]);

  return (
    <div
      onClick={onOpen}
      className="group relative bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800 hover:border-neutral-700 transition-all duration-300 cursor-pointer hover:shadow-2xl hover:shadow-black/40"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-800">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={story.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Images size={32} className="text-neutral-700" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-white font-semibold text-base leading-snug">{story.title}</h3>
          {story.description && (
            <p className="text-neutral-300 text-xs line-clamp-1 mt-0.5">{story.description}</p>
          )}
        </div>
      </div>
      <div className="px-4 py-2.5 flex items-center justify-between text-xs text-neutral-500">
        <span className="flex items-center gap-1.5">
          <Calendar size={12} />
          {formatDate(story.created_at)}
        </span>
        <span>{photoCount ?? '...'} photo{(photoCount ?? 0) > 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}

function CreateStoryModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!title.trim()) {
      setError('Le titre est obligatoire');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.from('stories').insert({
        title: title.trim(),
        description: description.trim() || null,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-neutral-800">
          <h2 className="text-lg font-semibold text-white">Creer une story</h2>
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
              placeholder="Nom de votre story"
              className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-all"
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-300">Description (optionnel)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description de la story..."
              rows={3}
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
            onClick={handleCreate}
            disabled={loading || !title.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-black rounded-xl font-medium hover:bg-neutral-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Creation...
              </>
            ) : (
              <>
                <Plus size={18} /> Creer la story
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
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}
