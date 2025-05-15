export async function onRequest(context) {
  const { messages } = await context.request.json();
  const systemPrompt = `
You are a helpful AI assistant for a custom apparel website.
Guide the user step-by-step to:
1. Select a product (T-shirt, hoodie, hat, tote)
2. Choose a color
3. Choose a size (if applicable)
4. Choose a print method (print or embroidery)
5. Ask if the user wants double-sided printing/embroidery (+$4 or +$7)
6. Ask for quantity
7. Call /functions/calculate to get the price
8. Ask for a design file upload
Then confirm and say "Added to order" when a configuration is complete.
Be concise and user-friendly. Always wait for user input after each step.
`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${context.env.OPENAI_API_KEY}`,
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

  const json = await response.json();
  const reply = json.choices?.[0]?.message?.content || "Something went wrong.";

  return new Response(JSON.stringify({ reply }), {
    headers: { "Content-Type": "application/json" }
  });
}