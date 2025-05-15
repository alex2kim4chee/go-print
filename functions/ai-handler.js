// Обработка GET — сразу 405
export async function onRequestGet(context) {
  return new Response('Method Not Allowed', { status: 405 });
}

// Обработка POST — здесь вся логика AI
export async function onRequestPost(context) {
  const { request, env } = context;

  // Проверяем тело
  let payload;
  try {
    payload = await request.json();
  } catch (e) {
    return new Response('Bad JSON', { status: 400 });
  }
  const { messages } = payload;
  if (!Array.isArray(messages)) {
    return new Response('Invalid payload', { status: 400 });
  }

  // Системный промпт
  const systemPrompt = `
You are a helpful AI assistant for a custom apparel website.
Guide the user step-by-step to:
1. Select a product (T-shirt, hoodie, hat, tote)
2. Choose a color
3. Choose a size (if applicable)
4. Choose a print method (print or embroidery)
5. Ask if the user wants double-sided printing/embroidery (+$4 or +$7)
6. Ask for quantity
7. Call /api/calculate to get the price
8. Ask for a design file upload
Then confirm and say "Added to order" when a configuration is complete.
Be concise and user-friendly. Always wait for user input after each step.
`;

  // Запрос в OpenAI
  const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      temperature: 0.7
    })
  });

  if (!aiRes.ok) {
    const err = await aiRes.text();
    return new Response(`OpenAI error: ${err}`, { status: 502 });
  }

  const aiJson = await aiRes.json();
  const reply = aiJson.choices?.[0]?.message?.content || "Something went wrong.";

  return new Response(JSON.stringify({ reply }), {
    headers: { "Content-Type": "application/json" }
  });
}
