import {
  Camera,
  Grid3x3,
  List,
  Search,
  Download,
  LogOut,
  CheckSquare,
  X,
  BookOpen,
  Images,
} from 'lucide-react';

export type ViewMode = 'grid' | 'timeline';
export type TabMode = 'photos' | 'stories';

type AppHeaderProps = {
  tabMode: TabMode;
  viewMode: ViewMode;
  search: string;
  selectionMode: boolean;
  photosCount: number;
  onTabChange: (tab: TabMode) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onSearchChange: (value: string) => void;
  onEnterSelectionMode: () => void;
  onExitSelectionMode: () => void;
  onExport: () => void;
  onSignOut: () => void;
};

export default function AppHeader({
  tabMode,
  viewMode,
  search,
  selectionMode,
  photosCount,
  onTabChange,
  onViewModeChange,
  onSearchChange,
  onEnterSelectionMode,
  onExitSelectionMode,
  onExport,
  onSignOut,
}: AppHeaderProps) {
  return (
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
              onClick={onExport}
              disabled={photosCount === 0}
              className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              title="Exporter mes souvenirs (JSON)"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Exporter</span>
            </button>
            <button
              onClick={onSignOut}
              className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-all"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div className="flex gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-xl">
            <button
              onClick={() => onTabChange('photos')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                tabMode === 'photos' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Images size={16} /> Toutes les photos
            </button>
            <button
              onClick={() => onTabChange('stories')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                tabMode === 'stories' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <BookOpen size={16} /> Stories
            </button>
          </div>
        </div>

        {tabMode === 'photos' && (
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Rechercher par titre, lieu, ou histoire..."
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-all"
              />
            </div>

            <div className="flex gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-xl">
              <button
                onClick={() => onViewModeChange('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
                }`}
                title="Vue grille"
              >
                <Grid3x3 size={18} />
              </button>
              <button
                onClick={() => onViewModeChange('timeline')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'timeline' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
                }`}
                title="Vue timeline"
              >
                <List size={18} />
              </button>
            </div>

            {!selectionMode ? (
              <button
                onClick={onEnterSelectionMode}
                disabled={photosCount === 0}
                className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                title="Mode sélection"
              >
                <CheckSquare size={18} />
                <span className="hidden sm:inline">Sélectionner</span>
              </button>
            ) : (
              <button
                onClick={onExitSelectionMode}
                className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 rounded-xl transition-all whitespace-nowrap"
              >
                <X size={18} />
                <span className="hidden sm:inline">Annuler</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
