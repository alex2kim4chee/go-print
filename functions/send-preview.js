export async function onRequestPost(context) {
  const { imageBase64, orderList } = await context.request.json();
  if (!orderList || !Array.isArray(orderList) || orderList.length === 0) {
    return new Response("No order data", { status: 400 });
  }
  const htmlOrder = orderList.map((item, i) => `
    <li>
      <strong>${i + 1}.</strong> ${item.quantity} × ${item.product} (${item.color}, ${item.size}, ${item.method}, ${item.doubleSided ? "2 sides" : "1 side"})
    </li>
  `).join("");
  const html = `
    <h2>New Custom Apparel Order</h2>
    <ul>${htmlOrder}</ul>
    <p><strong>Preview:</strong></p>
    <img src="${imageBase64}" style="max-width: 500px; border: 1px solid #ccc;" />
  `;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${context.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "orders@pecanstudio.com",
      to: "difcolors@gmail.com",
      subject: "New Order with Preview",
      html
    })
  });
  const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${context.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      mode: "payment",
      success_url: "https://pecanstudio.com/go-print/success",
      cancel_url: "https://pecanstudio.com/go-print/cancel",
      line_items: JSON.stringify([{
        price_data: {
          currency: "usd",
          product_data: { name: "Custom Apparel Order" },
          unit_amount: Math.round((orderList.reduce((sum, item) => {
            const base = { tshirt:15, hoodie:30, hat:18, tote:20 }[item.product] || 0;
            const method = item.method === 'embroidery' ? 7 : 4;
            const extra = item.doubleSided ? method : 0;
            return sum + (base + method + extra) * item.quantity;
          }, 0) + 6.99) * 100)
        },
        quantity: 1
      }])
    })
  });
  const stripeData = await stripeRes.json();
  return new Response(JSON.stringify({ status: "ok", stripeUrl: stripeData.url }), { headers: { "Content-Type": "application/json" } });
}