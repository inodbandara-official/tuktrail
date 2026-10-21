// Local/dev bootstrap: creates buckets, makes the public bucket anonymously readable,
// and allows browser PUTs to the private bucket from APP_URL.
// In production, configure R2/S3 buckets in the provider console instead (see README).
import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketCorsCommand,
  PutBucketPolicyCommand,
} from "@aws-sdk/client-s3";
import { env } from "../env";
import { createS3Client } from "./storage";

const e = env();
const client = createS3Client(e);

async function ensureBucket(name: string) {
  try {
    await client.send(new HeadBucketCommand({ Bucket: name }));
    console.log(`• bucket ${name} exists`);
  } catch {
    await client.send(new CreateBucketCommand({ Bucket: name }));
    console.log(`✓ bucket ${name} created`);
  }
}

await ensureBucket(e.S3_PRIVATE_BUCKET);
await ensureBucket(e.S3_PUBLIC_BUCKET);

await client.send(
  new PutBucketPolicyCommand({
    Bucket: e.S3_PUBLIC_BUCKET,
    Policy: JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${e.S3_PUBLIC_BUCKET}/*`],
        },
      ],
    }),
  }),
);
console.log(`✓ ${e.S3_PUBLIC_BUCKET} is publicly readable`);

try {
  await client.send(
    new PutBucketCorsCommand({
      Bucket: e.S3_PRIVATE_BUCKET,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: [e.APP_URL],
            AllowedMethods: ["PUT"],
            AllowedHeaders: ["content-type", "content-length"],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    }),
  );
  console.log(`✓ CORS on ${e.S3_PRIVATE_BUCKET} allows PUT from ${e.APP_URL}`);
} catch (err) {
  console.warn(`! could not set CORS on ${e.S3_PRIVATE_BUCKET}:`, (err as Error).message);
}
