const express = require("express");
const { GoogleGenAI } = require("@google/genai"); // SDK oficial de Google
const app = express();
app.use(express.json());

const MI_TOKEN_SECRETO = "token_secreto_manqa_2026";

// Inicializar Gemini usando la clave que guardamos en Render
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 1. Endpoint GET: Verificación inicial de Meta (Se mantiene intacto)
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

// 2. Endpoint POST: Recepción de mensajes en tiempo real e Inteligencia Artificial
app.post("/webhook", async (req, res) => {
  // Responder a Meta de inmediato con un 200 OK para evitar reintentos de red
  res.status(200).send("EVENT_RECEIVED");

  const body = req.body;

  // Verificación estricta del formato de listas que envía la API de WhatsApp
  if (
    body.entry &&
    body.entry[0].changes &&
    body.entry[0].changes[0].value &&
    body.entry[0].changes[0].value.messages &&
    body.entry[0].changes[0].value.messages[0]
  ) {
    const messageData = body.entry[0].changes[0].value.messages[0];
    const userPhone = messageData.from;
    const userMessage = messageData.text?.body || "";

    // Esto se imprimirá en tu consola negra de Render cuando escribas
    console.log(`\n--- 📥 NUEVO MENSAJE DE WHATSAPP ---`);
    console.log(`Teléfono del usuario: ${userPhone}`);
    console.log(`Texto enviado: "${userMessage}"`);

    try {
      // INSTRUCCIONES DEL SISTEMA DE MANQ'A (PROMPT BASE CON LOS INTENTS)
      const instruccionesSistema = `
      Eres el asistente virtual oficial de Manq'a Sostenible S.C. Tu objetivo es guiar amablemente al usuario.
      Responde siempre de manera muy corta, empática y directa en español (máximo 2 o 3 líneas por respuesta).

      INFORMACIÓN OFICIAL PARA RESPONDER PREGUNTAS FRECUENTES (FAQ):
      - Dirección de Manq'a: Calle Murillo #123, Zona Central.
      - Horario de atención: Lunes a Viernes de 09:00 a 18:00.
      - Requisitos de inscripción: Ser mayor de edad y presentar tu documento de identidad (CI).

      REGLAS DE FLUJOS E INTENTS CRÍTICOS:
      1. [INTENT: SALUDO] Si el usuario saluda ("hola", "buenos días"), dale una cálida bienvenida y preséntale el menú:
         - Escribe 1 para Dirección y Horarios.
         - Escribe 2 para Requisitos de Inscripción.
         - Escribe 3 para hablar con un Asesor Humano.
      2. [INTENT: FAQ] Si pregunta por direcciones, horarios o inscripciones, usa la información oficial de arriba para responder de forma concisa.
      3. [INTENT: DERIVACIÓN A HUMANO] Si el usuario escribe el número "3", o usa palabras como "humano", "persona", "asesor", "técnico", o manifiesta mucha frustración, debes responder ÚNICAMENTE con el siguiente comando exacto entre corchetes: "[TRIGGER_HUMAN_DESK]".
      `;

      // Llamar a Gemini Flash pasando las directrices del negocio y el mensaje de texto libre
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [{ text: instruccionesSistema }] },
          { role: "user", parts: [{ text: userMessage }] }
        ]
      });

      const respuestaBot = response.text || "";
      
      console.log(`\n--- 🧠 PROCESAMIENTO GEMINI FLASH ---`);
      console.log(`Respuesta lógica generada: "${respuestaBot}"`);

      // EVALUAR SI SE ACTIVÓ EL INTENT DE TRASPASO MANUAL
      if (respuestaBot.includes("[TRIGGER_HUMAN_DESK]")) {
        console.log(`🚨 [ALERTA CRM HUMANO]: El usuario ${userPhone} ha solicitado soporte manual. Desactivando flujo automatizado.`);
      }
      console.log(`------------------------------------\n`);

    } catch (error) {
      console.error("❌ Error en el motor de Gemini:", error);
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor activo en puerto ${PORT}`));
