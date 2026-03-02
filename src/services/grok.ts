const API_URL = "https://niklaus-systems.onrender.com/ai";

export interface GrokMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function grokChat(messages: GrokMessage[], maxTokens = 600): Promise<string> {

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messages,
      max_tokens: maxTokens
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Erro API:", errorText);
    throw new Error("Erro na IA");
  }

  const data = await res.json();

  console.log("Resposta IA:", data);

  return data?.choices?.[0]?.message?.content || "Sem resposta.";
}

export const chatWithAssistant = async (
  userMessage: string,
  history: GrokMessage[] = []
): Promise<string> => {

  try {

    return await grokChat([
      {
        role: "system",
        content:
          "Você é o NIKLAUS AI, assistente do ERP NIKLAUS para gestão de vendas e estoque. Seja direto e profissional."
      },
      ...history,
      { role: "user", content: userMessage }
    ], 800);

  } catch (err) {

    console.error("Erro Grok:", err);

    return "❌ Erro ao conectar com a IA.";

  }

};
