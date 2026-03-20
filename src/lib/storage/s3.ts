import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { serverEnv } from "@/lib/config/server";
import { Readable } from "node:stream";

let s3Client: S3Client | null = null;

function getS3Client() {
  if (!serverEnv.storage.bucketName || !serverEnv.storage.bucketRegion) {
    throw new Error("S3 storage is not configured.");
  }

  if (!s3Client) {
    s3Client = new S3Client({
      region: serverEnv.storage.bucketRegion,
    });
  }

  return s3Client;
}

export function getStorageBucket() {
  if (!serverEnv.storage.bucketName || !serverEnv.storage.bucketRegion) {
    return null;
  }

  return {
    bucketName: serverEnv.storage.bucketName,
    region: serverEnv.storage.bucketRegion,
    prefix: serverEnv.storage.uploadPrefix,
  };
}

export async function uploadToS3(params: {
  key: string;
  body: Readable;
  contentType: string;
}) {
  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: serverEnv.storage.bucketName!,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
    })
  );

  const bucketRegion = serverEnv.storage.bucketRegion!;

  return `https://${serverEnv.storage.bucketName}.s3.${bucketRegion}.amazonaws.com/${params.key}`;
}
