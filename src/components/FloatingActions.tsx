import type { RefObject } from 'react';
import { Camera, Upload, Loader2 } from 'lucide-react';

type FloatingActionsProps = {
  visible: boolean;
  uploading: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  cameraInputRef: RefObject<HTMLInputElement | null>;
  onFileSelect: (file: File | undefined) => void;
};

export default function FloatingActions({
  visible,
  uploading,
  fileInputRef,
  cameraInputRef,
  onFileSelect,
}: FloatingActionsProps) {
  return (
    <div className="fixed bottom-20 sm:bottom-6 right-6 flex flex-col gap-3 z-20">
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onFileSelect(e.target.files?.[0])}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFileSelect(e.target.files?.[0])}
      />

      {visible && (
        <>
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
        </>
      )}
    </div>
  );
}
