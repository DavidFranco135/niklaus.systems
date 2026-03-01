import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const generateProductDescription = async (productName: string, category: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Gere uma descrição curta e atraente para um produto chamado "${productName}" da categoria "${category}". Foco em vendas.`,
  });
  return response.text;
};

export const suggestPricing = async (productName: string, costPrice: number) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Sugira um preço de venda para o produto "${productName}" que custa R$ ${costPrice}. Considere uma margem de lucro saudável para o varejo brasileiro. Retorne apenas o valor numérico sugerido.`,
  });
  return response.text;
};

export const suggestPromotions = async (salesData: any) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Com base nestes dados de vendas: ${JSON.stringify(salesData)}, sugira 3 promoções para aumentar o faturamento.`,
  });
  return response.text;
};
