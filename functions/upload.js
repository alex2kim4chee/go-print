import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export async function onRequestPost(context) {
  const contentType = context.request.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    return new Response('Invalid content type', { status: 400 });
  }

  const formData = await context.request.formData();
  const file = formData.get('file');

  if (!file || typeof file.name !== 'string') {
    return new Response('No file uploaded', { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);
  const fileName = `${Date.now()}-${file.name}`.replace(/\s+/g, '-');

  const s3 = new S3Client({
    region: "auto",
    endpoint: context.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: context.env.R2_ACCESS_KEY_ID,
      secretAccessKey: context.env.R2_SECRET_ACCESS_KEY
    }
  });

  await s3.send(new PutObjectCommand({
    Bucket: context.env.R2_BUCKET_NAME,
    Key: fileName,
    Body: buffer,
    ContentType: file.type
  }));

  const publicUrl = `${context.env.R2_PUBLIC_URL}/${fileName}`;

  return new Response(JSON.stringify({
    status: 'ok',
    fileName,
    url: publicUrl
  }), { headers: { "Content-Type": "application/json" } });
}