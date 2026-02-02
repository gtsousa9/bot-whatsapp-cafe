const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

const WASENDER_API_KEY = process.env.WASENDER_API_KEY;
const GOOGLE_SHEET_WEBHOOK = process.env.GOOGLE_SHEET_WEBHOOK;

// 🟢 Rota de status
app.get("/", (req, res) => {
  res.send("🤖 Bot WhatsApp Café rodando!");
});

// 🧠 Armazenamento temporário de conversas
const pedidos = {};

// 🟢 Webhook para mensagens
app.post("/webhook", async (req, res) => {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.sendStatus(200);
    }

    console.log("Mensagem recebida:", message, "de", phone);

    const resposta = gerarResposta(phone, message);

    // Enviar resposta ao cliente
    await axios.post(
      "https://api.wasenderapi.com/send-message",
      {
        phone: phone,
        message: resposta,
      },
      {
        headers: {
          Authorization: `Bearer ${WASENDER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Se o pedido estiver completo, salva no Google Sheets
    if (pedidos[phone]?.finalizado) {
      await axios.post(GOOGLE_SHEET_WEBHOOK, {
        phone: phone,
        torra: pedidos[phone].torra,
        moagem: pedidos[phone].moagem,
        tamanho: pedidos[phone].tamanho,
      });

      delete pedidos[phone]; // limpa após salvar
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Erro no webhook:", error);
    res.sendStatus(500);
  }
});

// 🔵 Lógica do bot
function gerarResposta(phone, texto) {
  texto = texto.trim().toLowerCase();

  // Inicializa conversa
  if (!pedidos[phone] || texto === "menu" || texto === "oi" || texto === "olá") {
    pedidos[phone] = {};
    return `Olá! ☕ Seja bem-vindo à nossa loja de cafés!\n\nEscolha a torra:\n1️⃣ Clara\n2️⃣ Média\n3️⃣ Escura\n\nResponda com o número da opção.`;
  }

  const pedido = pedidos[phone];

  // Etapa 1 — Torra
  if (!pedido.torra) {
    if (texto === "1") pedido.torra = "Clara";
    else if (texto === "2") pedido.torra = "Média";
    else if (texto === "3") pedido.torra = "Escura";
    else return "Por favor, escolha a torra digitando 1, 2 ou 3.";

    return `Perfeito! ☕ Agora escolha a moagem:\n1️⃣ Em grãos\n2️⃣ Fina\n3️⃣ Média\n4️⃣ Grossa\n\nResponda com o número.`;
  }

  // Etapa 2 — Moagem
  if (!pedido.moagem) {
    if (texto === "1") pedido.moagem = "Em grãos";
    else if (texto === "2") pedido.moagem = "Fina";
    else if (texto === "3") pedido.moagem = "Média";
    else if (texto === "4") pedido.moagem = "Grossa";
    else return "Por favor, escolha a moagem digitando 1, 2, 3 ou 4.";

    return `Ótimo! 📦 Agora escolha o tamanho:\n1️⃣ 250g\n2️⃣ 500g\n\nResponda com o número.`;
  }

  // Etapa 3 — Tamanho
  if (!pedido.tamanho) {
    if (texto === "1") pedido.tamanho = "250g";
    else if (texto === "2") pedido.tamanho = "500g";
    else return "Por favor, escolha o tamanho digitando 1 ou 2.";

    pedido.finalizado = true;

    return `✅ Pedido confirmado!\n\nResumo:\n☕ Torra: ${pedido.torra}\n⚙️ Moagem: ${pedido.moagem}\n📦 Tamanho: ${pedido.tamanho}\n\nEm breve entraremos em contato para pagamento e entrega. Obrigado! 🙌`;
  }

  return "Digite 'menu' para iniciar um novo pedido.";
}

// 🚀 Inicia servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

