const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;
const WASENDER_API_KEY = process.env.WASENDER_API_KEY;

app.get("/", (req, res) => {
  res.status(200).send("🤖 Bot WhatsApp Café rodando!");
});

app.post("/webhook", async (req, res) => {
  try {
    console.log("Payload recebido:", JSON.stringify(req.body, null, 2));

    const msg = req.body?.data?.messages;
    const phone = msg?.key?.cleanedSenderPn;
    const message = msg?.messageBody;

    if (!phone || !message) {
      console.log("⚠️ Ignorado: sem phone ou message");
      return res.sendStatus(200);
    }

    console.log("Mensagem:", message, "De:", phone);

    await axios.post(
      "https://api.wasenderapi.com/send-message",
      {
        phone: phone,
        message: "Olá! Seu bot está funcionando! ☕",
      },
      {
        headers: {
          Authorization: `Bearer ${WASENDER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Erro no webhook:", err?.response?.data || err.message);
    res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
