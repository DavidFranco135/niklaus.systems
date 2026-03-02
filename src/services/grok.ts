// src/services/grok.ts
const GROK_API_KEY = import.meta.env.VITE_GROK_API_KEY;

export interface GrokMessage {
  role: 'user' | 'assistant';
  content: string;
}

async function askGrok(prompt: string): Promise<string> {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'grok-2-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Sem resposta';
}

export async function chatWithAssistant(
  userMessage: string,
  history: GrokMessage[] = []
): Promise<string> {
  // ✅ 'system' é aceito pela xAI, 'assistant' como 1ª msg causa 400
  const messages = [
    {
      role: 'system' as const,
      content:
        'Você é o NIKLAUS AI, assistente especializado em gestão de pequenos negócios, ' +
        'varejo e PDV. Responda sempre em português brasileiro, de forma objetiva e amigável. ' +
        'Use **negrito** para destacar pontos importantes.',
    },
    ...history.slice(-8),
    { role: 'user' as const, content: userMessage },
  ];

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'grok-2-latest',
      messages,
      temperature: 0.7,
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    if (response.status === 401) throw new Error('API Key inválida. Verifique VITE_GROK_API_KEY no .env.local');
    if (response.status === 429) throw new Error('Limite de requisições atingido. Aguarde um momento.');
    throw new Error((err as any)?.error?.message || `Erro HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Sem resposta da IA';
}

export async function generateProductDescription(product: string): Promise<string> {
  return askGrok(`Crie uma descrição profissional e atrativa para: ${product}. Máximo 3 linhas.`);
}

export async function suggestPricing(product: string): Promise<string> {
  return askGrok(`Sugira uma faixa de preço competitiva para este produto no Brasil: ${product}.`);
}

export async function suggestPromotions(product: string): Promise<string> {
  return askGrok(`Sugira 3 promoções criativas para pequeno varejo: ${product}.`);
}
