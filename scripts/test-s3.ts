import "dotenv/config";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ forcePathStyle: true });
const bucket = "assets";
const key = "uploads/file.txt";

async function main() {
  console.log(`Uploading to bucket "${bucket}" with key "${key}"...`);
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: "Hello World!" }));
  console.log("Upload successful!");

  const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 3600 });
  console.log(`[view] ${url}`);
}

main().catch((err) => {
  console.error("S3 Operation failed:", err);
  process.exit(1);
});

