export async function onRequest(context) {
  const ct = context.request.headers.get("content-type") || "";
  if (!ct.includes("multipart/form-data")) {
    return new Response("Invalid content type", { status: 400 });
  }

  const formData = await context.request.formData();
  const file = formData.get("file");
  if (!file || typeof file.name !== "string") {
    return new Response("No file uploaded", { status: 400 });
  }

  const fileName = `${Date.now()}-${file.name}`.replace(/\s+/g, "-");

  // Записываем файл в R2 через binding PECAN_MOCKUPS
  await context.env.PECAN_MOCKUPS.put(fileName, file.stream(), {
    httpMetadata: { contentType: file.type }
  });

  const publicUrl = `${context.env.R2_PUBLIC_URL}/${fileName}`;
  return new Response(JSON.stringify({
    status: "ok",
    fileName,
    url: publicUrl
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
