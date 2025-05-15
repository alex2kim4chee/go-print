export async function onRequest(context) {
  // Достаём request и env из context
  const { request, env } = context;

  // Отвечаем 405 на все методы, кроме POST
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // Проверяем тип контента
  const ct = request.headers.get("content-type") || "";
  if (!ct.includes("multipart/form-data")) {
    return new Response("Invalid content type", { status: 400 });
  }

  // Получаем файл из formData
  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || typeof file.name !== "string") {
    return new Response("No file uploaded", { status: 400 });
  }

  // Генерируем имя и пишем в R2
  const fileName = `${Date.now()}-${file.name}`.replace(/\s+/g, "-");
  await env.PECAN_MOCKUPS.put(fileName, file.stream(), {
    httpMetadata: { contentType: file.type }
  });

  // Формируем публичный URL
  const publicUrl = `${env.R2_PUBLIC_URL}/${fileName}`;
  return new Response(JSON.stringify({
    status: "ok",
    fileName,
    url: publicUrl
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
