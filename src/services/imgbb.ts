export const uploadImage = async (file: File): Promise<string> => {
  const API_KEY = "da736db48f154b9108b23a36d4393848";
  const formData = new FormData();
  formData.append("image", file);

  try {
    console.log(`Enviando arquivo: ${file.name} (${file.size} bytes) para IMGBB...`);
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (data.success) {
      console.log("Upload IMGBB com sucesso:", data.data.url);
      return data.data.url;
    } else {
      console.error("Erro retornado pelo IMGBB:", data.error);
      throw new Error(data.error.message || "Erro desconhecido no IMGBB");
    }
  } catch (error) {
    console.error("Erro na requisição IMGBB:", error);
    throw error;
  }
};
