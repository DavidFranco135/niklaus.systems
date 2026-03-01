export const uploadImage = async (file: File): Promise<string> => {
  const API_KEY = "da736db48f154b9108b23a36d4393848";
  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (data.success) {
      return data.data.url;
    } else {
      throw new Error(data.error.message);
    }
  } catch (error) {
    console.error("Error uploading image to IMGBB:", error);
    throw error;
  }
};
