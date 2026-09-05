import { Camera, Upload, Image as ImageIcon } from 'lucide-react';

type EmptyStateProps = {
  onUpload: () => void;
  onCapture: () => void;
};

export default function EmptyState({ onUpload, onCapture }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 bg-neutral-900 border border-neutral-800 rounded-3xl flex items-center justify-center mb-5">
        <ImageIcon size={36} className="text-neutral-600" />
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">Aucun souvenir pour l'instant</h2>
      <p className="text-neutral-500 max-w-sm mb-6">
        Commencez à documenter votre vie en important ou capturant votre première photo.
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
