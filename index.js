const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;

const WASENDER_API_KEY = process.env.WASENDER_API_KEY;
const GOOGLE_SHEET_WEBHOOK = process.env.GOOGLE_SHEET_WEBHOOK;

app.get("/", (req, res) => {
  res.status(200).send("🤖 Bot WhatsApp Café rodando!");
});

const pedidos = {};

app.post("/webhook", async (req, res) => {
  try {
    console.log("Payload recebido:", JSON.stringify(req.body, null, 2));

    const msg = req.body?.data?.messages;

    const phone = msg?.key?.cleanedSenderPn || msg?.key?.senderPn;
    const message = msg?.messageBody || msg?.message?.conversation;

    if (!phone || !message) {
      console.log("⚠️ Ignorado: sem phone ou message");
      return res.sendStatus(200);
    }

    console.log("Mensagem recebida:", message, "de", phone);

    const resposta = gerarResposta(phone, message);

    // 📤 Enviar resposta via Wasender
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

    // 📊 Salvar no Google Sheets se finalizado
    if (pedidos[phone]?.finalizado) {
      await axios.post(GOOGLE_SHEET_WEBHOOK, {
        phone,
        torra: pedidos[phone].torra,
        moagem: pedidos[phone].moagem,
        tamanho: pedidos[phone].tamanho,
      });

      delete pedidos[phone];
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Erro no webhook:", error?.response?.data || error.message);
    res.sendStatus(500);
  }
});

function gerarResposta(phone, texto) {
  texto = texto.toLowerCase().trim();

  if (!pedidos[phone] || ["menu", "oi", "olá", "ola"].includes(texto)) {
    pedidos[phone] = {};
    return `Olá! ☕ Seja bem-vindo à nossa loja de cafés!\n\nEscolha a torra:\n1️⃣ Clara\n2️⃣ Média\n3️⃣ Escura\n\nResponda com o número da opção.`;
  }

  const pedido = pedidos[phone];

  if (!pedido.torra) {
    if (texto === "1") pedido.torra = "Clara";
    else if (texto === "2") pedido.torra = "Média";
    else if (texto === "3") pedido.torra = "Escura";
    else return "Por favor, escolha a torra digitando 1, 2 ou 3.";

    return `Perfeito! ☕ Agora escolha a moagem:\n1️⃣ Em grãos\n2️⃣ Fina\n3️⃣ Média\n4️⃣ Grossa\n\nResponda com o número.`;
  }

  if (!pedido.moagem) {
    if (texto === "1") pedido.moagem = "Em grãos";
    else if (texto === "2") pedido.moagem = "Fina";
    else if (texto === "3") pedido.moagem = "Média";
    else if (texto === "4") pedido.moagem = "Grossa";
    else return "Por favor, escolha a moagem digitando 1, 2, 3 ou 4.";

    return `Ótimo! 📦 Agora escolha o tamanho:\n1️⃣ 250g\n2️⃣ 500g\n\nResponda com o número.`;
  }

  if (!pedido.tamanho) {
    if (texto === "1") pedido.tamanho = "250g";
    else if (texto === "2") pedido.tamanho = "500g";
    else return "Por favor, escolha o tamanho digitando 1 ou 2.";

    pedido.finalizado = true;

    return `✅ Pedido confirmado!\n\nResumo:\n☕ Torra: ${pedido.torra}\n⚙️ Moagem: ${pedido.moagem}\n📦 Tamanho: ${pedido.tamanho}\n\nEm breve entraremos em contato para pagamento e entrega. Obrigado! 🙌`;
  }

  return "Digite 'menu' para iniciar um novo pedido.";
}

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
