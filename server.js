const express = require("express");
const app = express();
app.use(express.json());

const MI_TOKEN_SECRETO = "token_secreto_manqa_2026";

app.get("/webhook", (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === MI_TOKEN_SECRETO) {
    console.log("¡Webhook verificado con éxito!");
    return res.status(200).send(challenge);
  }
  return res.status(403).end();
});

app.post("/webhook", (req, res) => {
  console.log("¡Mensaje recibido! Datos:", JSON.stringify(req.body, null, 2));
  res.status(200).send("EVENT_RECEIVED");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor activo en puerto ${PORT}`));
