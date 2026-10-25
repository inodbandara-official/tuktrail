import {
  CopyObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env, type ServerEnv } from "../env";

export type BucketKind = "private" | "public";

/** Thin S3 wrapper. Works with RustFS/MinIO (path-style), Cloudflare R2 and AWS S3. */
export interface Storage {
  put(
    bucket: BucketKind,
    key: string,
    body: Buffer,
    contentType: string,
    cacheControl?: string,
  ): Promise<void>;
  get(bucket: BucketKind, key: string): Promise<Buffer>;
  remove(bucket: BucketKind, keys: string[]): Promise<void>;
  /** Presigned PUT. Content-Type and Content-Length are signed, so the client cannot change them. */
  presignPut(key: string, contentType: string, contentLength: number, expiresInS: number): Promise<string>;
  publicUrl(key: string): string;
  /** Short-lived read URL for a private object (owner/admin previews of pending photos). */
  presignGet(bucket: BucketKind, key: string, expiresInS: number): Promise<string>;
  /** Size in bytes, or null if the object doesn't exist. */
  size(bucket: BucketKind, key: string): Promise<number | null>;
  copy(
    from: BucketKind,
    fromKey: string,
    to: BucketKind,
    toKey: string,
    cacheControl?: string,
  ): Promise<void>;
}

export function createS3Client(e: ServerEnv): S3Client {
  return new S3Client({
    region: e.S3_REGION,
    endpoint: e.S3_ENDPOINT,
    forcePathStyle: e.S3_FORCE_PATH_STYLE,
    credentials: { accessKeyId: e.S3_ACCESS_KEY_ID, secretAccessKey: e.S3_SECRET_ACCESS_KEY },
    // R2 and RustFS reject the newer default checksum headers on presigned PUTs.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}

export function createStorage(e: ServerEnv = env()): Storage {
  const client = createS3Client(e);
  const bucketName = (b: BucketKind) => (b === "public" ? e.S3_PUBLIC_BUCKET : e.S3_PRIVATE_BUCKET);
  const base = e.STORAGE_PUBLIC_BASE_URL.replace(/\/$/, "");

  return {
    async put(bucket, key, body, contentType, cacheControl) {
      await client.send(
        new PutObjectCommand({
          Bucket: bucketName(bucket),
          Key: key,
          Body: body,
          ContentType: contentType,
          CacheControl: cacheControl,
        }),
      );
    },
    async get(bucket, key) {
      const res = await client.send(new GetObjectCommand({ Bucket: bucketName(bucket), Key: key }));
      if (!res.Body) throw new Error(`Empty object: ${key}`);
      return Buffer.from(await res.Body.transformToByteArray());
    },
    async remove(bucket, keys) {
      if (keys.length === 0) return;
      for (let i = 0; i < keys.length; i += 1000) {
        await client.send(
          new DeleteObjectsCommand({
            Bucket: bucketName(bucket),
            Delete: { Objects: keys.slice(i, i + 1000).map((Key) => ({ Key })), Quiet: true },
          }),
        );
      }
    },
    async presignPut(key, contentType, contentLength, expiresInS) {
      const cmd = new PutObjectCommand({
        Bucket: e.S3_PRIVATE_BUCKET,
        Key: key,
        ContentType: contentType,
        ContentLength: contentLength,
      });
      return getSignedUrl(client, cmd, {
        expiresIn: expiresInS,
        signableHeaders: new Set(["content-type", "content-length"]),
      });
    },
    async presignGet(bucket, key, expiresInS) {
      return getSignedUrl(client, new GetObjectCommand({ Bucket: bucketName(bucket), Key: key }), {
        expiresIn: expiresInS,
      });
    },
    async size(bucket, key) {
      try {
        const res = await client.send(new HeadObjectCommand({ Bucket: bucketName(bucket), Key: key }));
        return res.ContentLength ?? null;
      } catch {
        return null;
      }
    },
    async copy(from, fromKey, to, toKey, cacheControl) {
      await client.send(
        new CopyObjectCommand({
          Bucket: bucketName(to),
          Key: toKey,
          CopySource: `${bucketName(from)}/${fromKey.split("/").map(encodeURIComponent).join("/")}`,
          ...(cacheControl ? { CacheControl: cacheControl, MetadataDirective: "COPY" } : {}),
        }),
      );
    },
    publicUrl(key) {
      return `${base}/${key.split("/").map(encodeURIComponent).join("/")}`;
    },
  };
}

let cached: Storage | undefined;
export function getStorage(): Storage {
  cached ??= createStorage();
  return cached;
}
