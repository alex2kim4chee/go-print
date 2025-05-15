export async function onRequest(context) {
  // Достаём request из context
  const { request } = context;

  // Отвечаем 405 на все методы, кроме POST
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // Разбираем тело запроса
  const orderList = await request.json();
  if (!Array.isArray(orderList) || orderList.length === 0) {
    return new Response("Invalid order data", { status: 400 });
  }

  const basePrices = { tshirt: 15, hoodie: 30, hat: 18, tote: 20 };
  let subtotal = 0;
  const results = [];

  for (const item of orderList) {
    const base = basePrices[item.product] || 0;
    const methodCost = item.method === 'embroidery' ? 7 : 4;
    const extra = item.doubleSided ? methodCost : 0;
    const itemTotal = (base + methodCost + extra) * item.quantity;
    results.push({ ...item, itemTotal: itemTotal.toFixed(2) });
    subtotal += itemTotal;
  }

  const shipping = 6.99;
  const total = subtotal + shipping;

  return new Response(JSON.stringify({
    subtotal: subtotal.toFixed(2),
    shipping: shipping.toFixed(2),
    total: total.toFixed(2),
    breakdown: results
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
