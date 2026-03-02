// ============================================================
// NIKLAUS AI - Powered by xAI Grok
// Substitui o Gemini por Grok para todas as funcionalidades de IA
// ============================================================

const GROK_API_KEY = import.meta.env.VITE_GROK_API_KEY || 'xai-HvqsAFMpXRUaYIbNkNsMy7H5TRNJAzWL1tl3GR7etEiTZtcTQDpgpKTnHiFWiJXPZD6KE9qFbNKGxmrK';
const GROK_BASE_URL = 'https://api.x.ai/v1';

interface GrokMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function grokChat(messages: GrokMessage[], maxTokens = 500): Promise<string> {
  try {
    const response = await fetch(`${GROK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-3-mini',
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Grok API error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Sem resposta da IA.';
  } catch (error) {
    console.error('Grok API Error:', error);
    throw error;
  }
}

// ========================
// Gerar descrição de produto
// ========================
export const generateProductDescription = async (productName: string, category: string): Promise<string> => {
  try {
    const text = await grokChat([
      {
        role: 'system',
        content: 'Você é um especialista em copywriting para e-commerce brasileiro. Crie descrições curtas, atrativas e focadas em vendas.',
      },
      {
        role: 'user',
        content: `Gere uma descrição comercial curta (máximo 3 linhas) para o produto "${productName}" da categoria "${category}". Seja direto, atrativo e use linguagem de vendas.`,
      },
    ], 200);
    return text;
  } catch {
    return 'Descrição não disponível no momento.';
  }
};

// ========================
// Sugerir preço de venda
// ========================
export const suggestPricing = async (productName: string, costPrice: number): Promise<string | null> => {
  try {
    const text = await grokChat([
      {
        role: 'system',
        content: 'Você é um consultor financeiro para pequeno varejo brasileiro. Responda APENAS com o valor numérico sugerido, sem texto adicional.',
      },
      {
        role: 'user',
        content: `Produto: "${productName}". Custo: R$ ${costPrice.toFixed(2)}. Qual o preço de venda ideal para o varejo brasileiro com margem saudável? Responda apenas o número.`,
      },
    ], 50);
    return text.trim().replace(/[^0-9.,]/g, '');
  } catch {
    return null;
  }
};

// ========================
// Sugerir promoções
// ========================
export const suggestPromotions = async (salesData: any): Promise<string> => {
  try {
    const text = await grokChat([
      {
        role: 'system',
        content: 'Você é um especialista em marketing para pequeno varejo brasileiro.',
      },
      {
        role: 'user',
        content: `Com base nestes dados de vendas: ${JSON.stringify(salesData)}, sugira 3 promoções práticas e criativas para aumentar o faturamento.`,
      },
    ], 500);
    return text;
  } catch {
    return 'Sugestões não disponíveis no momento.';
  }
};

// ========================
// Chat do Assistente IA
// ========================
export const chatWithAssistant = async (
  userMessage: string,
  conversationHistory: GrokMessage[] = []
): Promise<string> => {
  try {
    const messages: GrokMessage[] = [
      {
        role: 'system',
        content: `Você é o NIKLAUS AI, assistente inteligente do sistema ERP NIKLAUS de gestão de vendas e estoque. 
Ajude o usuário com:
- Dúvidas sobre o sistema
- Sugestões de preços e promoções
- Análise de dados de vendas
- Dicas de gestão de estoque
- Estratégias de atendimento ao cliente
- Controle financeiro
Seja profissional, direto e use linguagem moderna. Responda sempre em português brasileiro.`,
      },
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];

    return await grokChat(messages, 800);
  } catch (error) {
    console.error('Chat error:', error);
    return 'Ocorreu um erro ao conectar com a IA. Verifique sua conexão e tente novamente.';
  }
};

export type { GrokMessage };
