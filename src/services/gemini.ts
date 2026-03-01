import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

export const generateProductDescription = async (productName: string, category: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Gere uma descrição curta e atraente para um produto chamado "${productName}" da categoria "${category}". Foco em vendas.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Descrição não disponível no momento.";
  }
};

export const suggestPricing = async (productName: string, costPrice: number) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Sugira um preço de venda para o produto "${productName}" que custa R$ ${costPrice}. Considere uma margem de lucro saudável para o varejo brasileiro. Retorne apenas o valor numérico sugerido.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};

export const suggestPromotions = async (salesData: any) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Com base nestes dados de vendas: ${JSON.stringify(salesData)}, sugira 3 promoções para aumentar o faturamento.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Sugestões não disponíveis.";
  }
};
