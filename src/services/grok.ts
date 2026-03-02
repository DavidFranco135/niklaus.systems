// NIKLAUS AI — xAI Grok
const GROK_BASE_URL = 'https://api.x.ai/v1';

function getKey(): string {
  const k = import.meta.env.VITE_GROK_API_KEY;
  if (k && k.startsWith('xai-') && k.length > 30) return k;
  return 'xai-6A3UbPouCGTtUkCyT1p0PQMbQSRAuYYIi12NJTgBUvtovro0y8L1R0qQNPwj5xEH4037bfqyIfhlj4Eh';
}

export interface GrokMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function grokChat(messages: GrokMessage[], maxTokens = 600): Promise<string> {
  const res = await fetch(`${GROK_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getKey()}` },
    body: JSON.stringify({ model: 'grok-3-mini', messages, max_tokens: maxTokens, temperature: 0.7 }),
  });
  if (!res.ok) { const b = await res.text(); throw new Error(`${res.status}: ${b}`); }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? 'Sem resposta.';
}

export const generateProductDescription = async (name: string, category: string): Promise<string> => {
  try {
    return await grokChat([
      { role: 'system', content: 'Especialista em copywriting para e-commerce brasileiro. Respostas curtas.' },
      { role: 'user', content: `Descrição de venda (máx 3 linhas) para: "${name}" — categoria: "${category}".` },
    ], 200);
  } catch { return 'Descrição não disponível.'; }
};

export const suggestPricing = async (name: string, costPrice: number): Promise<string | null> => {
  try {
    const r = await grokChat([
      { role: 'system', content: 'Consultor de varejo. Responda APENAS com o número do preço, sem texto.' },
      { role: 'user', content: `Produto: "${name}". Custo: R$${costPrice.toFixed(2)}. Preço ideal?` },
    ], 20);
    return r.replace(/[^0-9.,]/g, '') || null;
  } catch { return null; }
};

export const suggestPromotions = async (salesData: any): Promise<string> => {
  try {
    return await grokChat([
      { role: 'system', content: 'Especialista em marketing para pequeno varejo brasileiro.' },
      { role: 'user', content: `Dados: ${JSON.stringify(salesData)}. Sugira 3 promoções práticas.` },
    ], 500);
  } catch { return 'Sugestões indisponíveis.'; }
};

export const chatWithAssistant = async (userMessage: string, history: GrokMessage[] = []): Promise<string> => {
  try {
    return await grokChat([
      { role: 'system', content: `Você é o NIKLAUS AI, assistente do ERP NIKLAUS para gestão de vendas e estoque. Seja direto, profissional e use português brasileiro.` },
      ...history.slice(-8),
      { role: 'user', content: userMessage },
    ], 800);
  } catch (err: any) {
    console.error('Grok error:', err);
    return '❌ Erro ao conectar com a IA. Verifique sua conexão e tente novamente.';
  }
};
