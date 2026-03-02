app.post("/ai", async (req, res) => {
  try {

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.VITE_GROK_API_KEY}`
      },
      body: JSON.stringify({
        model: "grok-2-latest",
        messages: req.body.messages,
        max_tokens: req.body.max_tokens || 600
      })
    });

    const data = await response.json();

    console.log("Resposta IA:", data); // ajuda a debugar

    res.json(data);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro na IA" });
  }
});
