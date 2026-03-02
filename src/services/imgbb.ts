// ============================================================
// NIKLAUS - Upload de Imagens via IMGBB
// Suporta File, Blob e base64
// ============================================================

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY || 'da736db48f154b9108b23a36d4393848';

export const uploadImage = async (file: File): Promise<string> => {
  if (!file) throw new Error('Nenhum arquivo fornecido.');

  // Verificar tamanho (IMGBB aceita até 32MB)
  if (file.size > 32 * 1024 * 1024) {
    throw new Error('Arquivo muito grande. Máximo permitido: 32MB.');
  }

  // Verificar tipo
  if (!file.type.startsWith('image/')) {
    throw new Error('Tipo de arquivo inválido. Envie apenas imagens.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];

        const formData = new FormData();
        formData.append('key', IMGBB_API_KEY);
        formData.append('image', base64);
        formData.append('name', file.name.replace(/\.[^/.]+$/, ''));

        const response = await fetch('https://api.imgbb.com/1/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (data.success && data.data?.url) {
          resolve(data.data.url);
        } else {
          reject(new Error(data.error?.message || 'Falha no upload para IMGBB.'));
        }
      } catch (err: any) {
        reject(new Error('Erro de rede ao enviar imagem: ' + err.message));
      }
    };

    reader.onerror = () => reject(new Error('Erro ao ler arquivo de imagem.'));
    reader.readAsDataURL(file);
  });
};

// Upload via URL (para imagens já na internet)
export const uploadImageFromUrl = async (imageUrl: string): Promise<string> => {
  const formData = new FormData();
  formData.append('key', IMGBB_API_KEY);
  formData.append('image', imageUrl);

  const response = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  if (data.success && data.data?.url) return data.data.url;
  throw new Error('Falha ao importar imagem da URL.');
};
