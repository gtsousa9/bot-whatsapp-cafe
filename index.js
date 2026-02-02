const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;
const WASENDER_API_KEY = process.env.WASENDER_API_KEY;

// Página inicial (teste no navegador)
app.get("/", (req, res) => {
  res.status(200).send("🤖 Bot WhatsApp Café rodando!");
});

// Memória simples de pedidos
const pedidos = {};

// Webhook da Wasender
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

    const resposta = gerarResposta(phone, message);

    // Enviar resposta via Wasender
    await axios.post(
      "https://api.wasenderapi.com/api/send-message",
      {
        to: phone,
        text: resposta,
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

// Função que controla o fluxo do pedido
function gerarResposta(phone, texto) {
  texto = texto.toLowerCase().trim();

  if (!pedidos[phone] || ["menu", "oi", "olá", "ola"].includes(texto)) {
    pedidos[phone] = {};
    return (
      "Olá! ☕ Bem-vindo à nossa loja de cafés!\n\n" +
      "Escolha a torra:\n" +
      "1️⃣ Clara\n" +
      "2️⃣ Média\n" +
      "3️⃣ Escura\n\n" +
      "Responda com o número."
    );
  }

  const pedido = pedidos[phone];

  // Escolha da torra
  if (!pedido.torra) {
    if (texto === "1") pedido.torra = "Clara";
    else if (texto === "2") pedido.torra = "Média";
    else if (texto === "3") pedido.torra = "Escura";
    else return "Por favor, escolha a torra digitando 1, 2 ou 3.";

    return (
      "Perfeito! ☕ Agora escolha a moagem:\n" +
      "1️⃣ Em grãos\n" +
      "2️⃣ Fina\n" +
      "3️⃣ Média\n" +
      "4️⃣ Grossa\n\n" +
      "Responda com o número."
    );
  }

  // Escolha da moagem
  if (!pedido.moagem) {
    if (texto === "1") pedido.moagem = "Em grãos";
    else if (texto === "2") pedido.moagem = "Fina";
    else if (texto === "3") pedido.moagem = "Média";
    else if (texto === "4") pedido.moagem = "Grossa";
    else return "Por favor, escolha a moagem digitando 1, 2, 3 ou 4.";

    return (
      "Ótimo! 📦 Agora escolha o tamanho:\n" +
      "1️⃣ 250g\n" +
      "2️⃣ 500g\n\n" +
      "Responda com o número."
    );
  }

  // Escolha do tamanho
  if (!pedido.tamanho) {
    if (texto === "1") pedido.tamanho = "250g";
    else if (texto === "2") pedido.tamanho = "500g";
    else return "Por favor, escolha o tamanho digitando 1 ou 2.";

    pedido.finalizado = true;

    return (
      "✅ Pedido confirmado!\n\n" +
      "Resumo:\n" +
      `☕ Torra: ${pedido.torra}\n` +
      `⚙️ Moagem: ${pedido.moagem}\n` +
      `📦 Tamanho: ${pedido.tamanho}\n\n` +
      "Em breve entraremos em contato para pagamento e entrega. Obrigado! 🙌"
    );
  }

  return "Digite 'menu' para iniciar um novo pedido.";
}

// Inicializa o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
