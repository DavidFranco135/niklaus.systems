import React, { useRef, useState } from 'react';
import { Image as ImageIcon, Loader2, X, Camera, CheckCircle2 } from 'lucide-react';
import { uploadImage } from '../services/imgbb';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onClear?: () => void;
  aspectRatio?: 'square' | 'video' | 'free';
  label?: string;
  className?: string;
}

export default function ImageUpload({
  value,
  onChange,
  onClear,
  aspectRatio = 'video',
  label = 'Clique para fazer upload',
  className = '',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const aspectClass =
    aspectRatio === 'square'
      ? 'aspect-square'
      : aspectRatio === 'video'
      ? 'aspect-video'
      : 'min-h-[120px]';

  const displayed = preview || value;

  const handleClick = () => {
    if (!uploading) inputRef.current?.click();
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setDone(false);

    // Mostrar preview local IMEDIATAMENTE, sem esperar upload
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);

    try {
      const url = await uploadImage(file);
      onChange(url);
      setPreview('');
      setDone(true);
      setTimeout(() => setDone(false), 2500);
    } catch (err: any) {
      setPreview('');
      setError(err.message || 'Erro no upload. Tente novamente.');
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localUrl);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div
        onClick={handleClick}
        className={`${aspectClass} w-full bg-white/5 border-2 border-dashed ${
          error
            ? 'border-rose-500/50'
            : done
            ? 'border-emerald-500/50'
            : 'border-white/10 hover:border-neon-blue/50'
        } rounded-xl flex flex-col items-center justify-center overflow-hidden group transition-all cursor-pointer`}
      >
        {displayed ? (
          <>
            <img
              src={displayed}
              alt="Preview"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                <Loader2 size={24} className="animate-spin text-neon-blue" />
                <span className="text-white text-xs font-bold">Enviando...</span>
              </div>
            )}
            {!uploading && (
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <Camera size={22} className="text-white" />
                <span className="text-white text-xs font-bold">Trocar Imagem</span>
              </div>
            )}
          </>
        ) : uploading ? (
          <div className="flex flex-col items-center gap-2 text-neon-blue">
            <Loader2 size={32} className="animate-spin" />
            <span className="text-xs font-bold">Enviando...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-white/20 group-hover:text-white/50 transition-colors p-4 text-center">
            <ImageIcon size={28} />
            <span className="text-xs font-bold">{label}</span>
            <span className="text-[10px]">PNG, JPG, WEBP até 32MB</span>
          </div>
        )}
      </div>

      {done && (
        <p className="mt-1 text-xs text-emerald-500 flex items-center gap-1">
          <CheckCircle2 size={12} /> Imagem salva!
        </p>
      )}

      {error && (
        <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
          <X size={12} /> {error}
        </p>
      )}

      {(value || preview) && onClear && !uploading && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setPreview(''); onClear(); }}
          className="absolute top-2 right-2 p-1.5 bg-black/70 rounded-full text-white/60 hover:text-rose-400 transition-colors z-10"
        >
          <X size={13} />
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
        disabled={uploading}
      />
    </div>
  );
}
