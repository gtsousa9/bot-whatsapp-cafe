const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// 🔐 Variáveis de ambiente
const WASENDER_API_KEY = process.env.WASENDER_API_KEY;
const GOOGLE_SHEET_WEBHOOK = process.env.GOOGLE_SHEET_WEBHOOK;

// 🟢 Rota de verificação
app.get("/", (req, res) => {
  res.send("🤖 Bot WhatsApp Café rodando com sucesso!");
});

// 🟢 Webhook para receber mensagens do WhatsApp
app.post("/webhook", async (req, res) => {
  try {
    const message = req.body.message;
    const phone = req.body.phone;

    console.log("Mensagem recebida:", message, "de", phone);

    const reply = gerarResposta(message);

    // Enviar resposta ao cliente
    await axios.post(
      "https://api.wasenderapi.com/send-message",
      {
        phone: phone,
        message: reply,
      },
      {
        headers: {
          Authorization: `Bearer ${WASENDER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Salvar pedido no Google Sheets (se for pedido válido)
    if (reply.includes("Resumo do pedido")) {
      await axios.post(GOOGLE_SHEET_WEBHOOK, {
        phone: phone,
        message: message,
        timestamp: new Date().toISOString(),
      });
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Erro no webhook:", error);
    res.sendStatus(500);
  }
});

// 🔵 Lógica do bot
function gerarResposta(texto) {
  texto = texto.toLowerCase();

  if (texto.includes("oi") || texto.includes("olá")) {
    return `Olá! 👋 Seja bem-vindo à nossa loja de cafés ☕
Temos:
1️⃣ Torra clara
2️⃣ Torra média
3️⃣ Torra escura

Responda com o número da torra desejada.`;
  }

  if (texto === "1" || texto === "2" || texto === "3") {
    return `Perfeito! Agora escolha a moagem:
1️⃣ Em grãos
2️⃣ Moagem fina
3️⃣ Moagem média
4️⃣ Moagem grossa

Responda com o número.`;
  }

  if (["1", "2", "3", "4"].includes(texto)) {
    return `Ótimo! Agora escolha o tamanho:
1️⃣ 250g
2️⃣ 500g

Responda com o número.`;
  }

  if (texto === "1" || texto === "2") {
    return `✅ Resumo do pedido:
Café especial ☕
Sua escolha foi registrada!

Em breve entraremos em contato para pagamento e entrega.`;
  }

  return `Desculpe, não entendi 😅
Digite "oi" para começar seu pedido.`;
}

// 🚀 Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
