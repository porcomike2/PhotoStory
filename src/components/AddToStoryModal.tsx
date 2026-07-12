import { useState, useEffect } from 'react';
import { supabase, type Story } from '../services/supabaseClient';
import { X, Plus, Loader2, Check } from 'lucide-react';

type AddToStoryModalProps = {
  photoIds: string[];
  onClose: () => void;
  onAdded: () => void;
};

export default function AddToStoryModal({ photoIds, onClose, onAdded }: AddToStoryModalProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStories() {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setStories(data || []);
      }
      setLoading(false);
    }
    fetchStories();
  }, []);

  async function handleAdd() {
    if (!selectedStory) return;
    setSaving(true);
    setError(null);

    try {
      const { data: existing } = await supabase
        .from('photo_stories')
        .select('photo_id')
        .eq('story_id', selectedStory);

      const existingIds = new Set((existing || []).map((d: { photo_id: string }) => d.photo_id));
      const toInsert = photoIds
        .filter((id) => !existingIds.has(id))
        .map((id, i) => ({
          story_id: selectedStory,
          photo_id: id,
          position: (existing?.length ?? 0) + i,
        }));

      if (toInsert.length > 0) {
        const { error: insertError } = await supabase.from('photo_stories').insert(toInsert);
        if (insertError) {
          setError(insertError.message);
          setSaving(false);
          return;
        }
      }

      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setSaving(false);
    }
  }

  async function handleCreateAndAdd() {
    if (!newTitle.trim()) return;
    setSaving(true);
    setError(null);

    try {
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .insert({
          title: newTitle.trim(),
          description: newDescription.trim() || null,
        })
        .select()
        .single();

      if (storyError) {
        setError(storyError.message);
        setSaving(false);
        return;
      }

      const toInsert = photoIds.map((id, i) => ({
        story_id: storyData.id,
        photo_id: id,
        position: i,
      }));

      const { error: insertError } = await supabase.from('photo_stories').insert(toInsert);
      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }

      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 sticky top-0 bg-neutral-900 z-10">
          <h2 className="text-lg font-semibold text-white">
            Ajouter {photoIds.length} photo{photoIds.length > 1 ? 's' : ''} a une story
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-neutral-800"
            disabled={saving}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-neutral-600" size={24} />
            </div>
          ) : creating ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-300">Titre de la story</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Nom de votre story"
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-all"
                  disabled={saving}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-300">Description (optionnel)</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Description..."
                  rows={2}
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-all resize-none"
                  disabled={saving}
                />
              </div>
              {error && (
                <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
                  {error}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setCreating(false)}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-neutral-800 text-neutral-300 rounded-xl text-sm font-medium hover:bg-neutral-700 transition-all disabled:opacity-50"
                >
                  Retour
                </button>
                <button
                  onClick={handleCreateAndAdd}
                  disabled={saving || !newTitle.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-black rounded-xl text-sm font-medium hover:bg-neutral-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Creer et ajouter
                </button>
              </div>
            </div>
          ) : stories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-500 mb-4">Aucune story existante.</p>
              <button
                onClick={() => setCreating(true)}
                className="flex items-center gap-2 mx-auto px-4 py-2.5 bg-white text-black rounded-xl text-sm font-medium hover:bg-neutral-200 transition-all"
              >
                <Plus size={18} /> Creer une story
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {stories.map((story) => (
                <button
                  key={story.id}
                  onClick={() => setSelectedStory(story.id === selectedStory ? null : story.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left ${
                    selectedStory === story.id
                      ? 'bg-neutral-800 border-neutral-600'
                      : 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800/50'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{story.title}</p>
                    {story.description && (
                      <p className="text-xs text-neutral-500 truncate">{story.description}</p>
                    )}
                  </div>
                  {selectedStory === story.id && (
                    <Check size={18} className="text-white shrink-0 ml-2" />
                  )}
                </button>
              ))}

              <button
                onClick={() => setCreating(true)}
                className="w-full flex items-center gap-2 px-4 py-3 border border-dashed border-neutral-700 rounded-xl text-sm text-neutral-400 hover:text-white hover:border-neutral-600 transition-all"
              >
                <Plus size={16} /> Creer une nouvelle story
              </button>

              {error && (
                <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                onClick={handleAdd}
                disabled={saving || !selectedStory}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-black rounded-xl font-medium hover:bg-neutral-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] mt-2"
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Ajout...
                  </>
                ) : (
                  <>
                    <Check size={18} /> Ajouter a la story
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
