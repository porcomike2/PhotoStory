import { BookOpen, FileDown, Trash2, Loader2 } from 'lucide-react';

type BulkActionsBarProps = {
  selectedCount: number;
  filteredCount: number;
  bulkDeleting: boolean;
  onSelectAll: () => void;
  onAddToStory: () => void;
  onExportPdf: () => void;
  onBulkDelete: () => void;
};

export default function BulkActionsBar({
  selectedCount,
  filteredCount,
  bulkDeleting,
  onSelectAll,
  onAddToStory,
  onExportPdf,
  onBulkDelete,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-[73px] sm:top-[81px] z-20 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800 animate-fadeIn">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        <span className="text-sm text-neutral-300">
          {selectedCount} sélectionnée{selectedCount > 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onSelectAll}
            className="px-3 py-1.5 text-xs text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-all whitespace-nowrap"
          >
            {selectedCount === filteredCount ? 'Tout désélectionner' : 'Tout sélectionner'}
          </button>
          <button
            onClick={onAddToStory}
            disabled={bulkDeleting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-black bg-white rounded-lg font-medium hover:bg-neutral-200 transition-all whitespace-nowrap disabled:opacity-50"
          >
            <BookOpen size={14} /> Ajouter à une story
          </button>
          <button
            onClick={onExportPdf}
            disabled={bulkDeleting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-all whitespace-nowrap disabled:opacity-50"
          >
            <FileDown size={14} /> Export PDF
          </button>
          <button
            onClick={onBulkDelete}
            disabled={bulkDeleting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {bulkDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {bulkDeleting ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  );
}
