import React, { useRef, useState } from 'react';
import { Image as ImageIcon, Loader2, X, Camera } from 'lucide-react';
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
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const aspectClass =
    aspectRatio === 'square'
      ? 'aspect-square'
      : aspectRatio === 'video'
      ? 'aspect-video'
      : 'min-h-[120px]';

  const handleClick = () => {
    if (!uploading) inputRef.current?.click();
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setUploading(true);

    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch (err: any) {
      setError(err.message || 'Erro no upload');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      // Reset input para permitir re-upload do mesmo arquivo
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div
        onClick={handleClick}
        className={`${aspectClass} w-full bg-white/5 border-2 border-dashed ${
          error ? 'border-rose-500/50' : 'border-white/10 hover:border-neon-blue/50'
        } rounded-xl flex flex-col items-center justify-center overflow-hidden group transition-all cursor-pointer`}
      >
        {value ? (
          <>
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              <Camera size={24} className="text-white" />
              <span className="text-white text-xs font-bold">Trocar Imagem</span>
            </div>
          </>
        ) : uploading ? (
          <div className="flex flex-col items-center gap-2 text-neon-blue">
            <Loader2 size={32} className="animate-spin" />
            <span className="text-xs font-bold">Enviando...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-white/20 group-hover:text-white/40 transition-colors p-4 text-center">
            <ImageIcon size={32} />
            <span className="text-xs font-bold">{label}</span>
            <span className="text-[10px]">PNG, JPG, WEBP até 32MB</span>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
          <X size={12} />
          {error}
        </p>
      )}

      {value && onClear && !uploading && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="absolute top-2 right-2 p-1 bg-black/70 rounded-full text-white/60 hover:text-rose-500 transition-colors z-10"
        >
          <X size={14} />
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
