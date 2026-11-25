import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const DEFAULT_BUCKET = process.env.NEON_STORAGE_BUCKET || "assets";

let _s3: S3Client | null = null;

export function getS3Client(): S3Client {
  if (!_s3) {
    _s3 = new S3Client({
      forcePathStyle: true,
      region: process.env.AWS_REGION || "us-east-2",
      endpoint: process.env.AWS_ENDPOINT_URL_S3,
      credentials:
        process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
          ? {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            }
          : undefined,
    });
  }
  return _s3;
}

export function isStorageConfigured(): boolean {
  return Boolean(
    process.env.AWS_ENDPOINT_URL_S3 &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY
  );
}

export async function uploadToStorage(params: {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType?: string;
  bucket?: string;
}): Promise<{ bucket: string; key: string }> {
  const s3 = getS3Client();
  const bucket = params.bucket || DEFAULT_BUCKET;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType || "application/octet-stream",
    })
  );

  return { bucket, key: params.key };
}

export async function getStorageSignedUrl(params: {
  key: string;
  bucket?: string;
  expiresIn?: number;
}): Promise<string> {
  const s3 = getS3Client();
  const bucket = params.bucket || DEFAULT_BUCKET;

  return await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: bucket,
      Key: params.key,
    }),
    { expiresIn: params.expiresIn || 3600 }
  );
}

export async function deleteFromStorage(params: {
  key: string;
  bucket?: string;
}): Promise<void> {
  const s3 = getS3Client();
  const bucket = params.bucket || DEFAULT_BUCKET;

  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: params.key,
    })
  );
}

