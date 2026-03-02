const GROK_API_KEY = import.meta.env.VITE_GROK_API_KEY;

async function askGrok(prompt: string) {
  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok-2-latest",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    console.log("GROK RESPONSE:", data);

    return data.choices?.[0]?.message?.content || "Sem resposta da IA";
  } catch (error) {
    console.error("Erro ao chamar Grok:", error);
    return "Erro ao gerar resposta da IA";
  }
}

export async function generateProductDescription(product: string) {
  return askGrok(`Crie uma descrição profissional para este produto: ${product}`);
}

export async function suggestPricing(product: string) {
  return askGrok(`Sugira um preço competitivo para este produto: ${product}`);
}

export async function suggestPromotions(product: string) {
  return askGrok(`Sugira uma promoção criativa para este produto: ${product}`);
}
