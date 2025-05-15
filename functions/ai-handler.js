export async function onRequest(context) {
  // 1) Деструктурируем request и env
  const { request, env } = context;

  // 2) Если не POST — сразу 405
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // 3) Читаем JSON из тела
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

  // 4) Системный промпт
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

  // 5) Запрос к OpenAI
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
    const errText = await aiRes.text();
    return new Response(`OpenAI error: ${errText}`, { status: 502 });
  }

  const aiJson = await aiRes.json();
  const reply = aiJson.choices?.[0]?.message?.content || "Something went wrong.";

  // 6) Возвращаем клиенту
  return new Response(JSON.stringify({ reply }), {
    headers: { "Content-Type": "application/json" }
  });
}
