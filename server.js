import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.post("/ai", async (req, res) => {
  try {

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROK_API_KEY}`
      },
      body: JSON.stringify({
        model: "grok-3-mini",
        messages: req.body.messages,
        max_tokens: req.body.max_tokens || 600
      })
    });

    const data = await response.json();

    res.json(data);

  } catch (error) {

    console.error("Erro IA:", error);

    res.status(500).json({
      error: "Erro ao conectar com IA"
    });

  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor IA rodando na porta ${PORT}`);
});
