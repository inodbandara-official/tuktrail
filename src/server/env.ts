import { z } from "zod";

const bool = z
  .enum(["true", "false", "1", "0", ""])
  .default("false")
  .transform((v) => v === "true" || v === "1");

const optional = z
  .string()
  .optional()
  .transform((v) => (v ? v : undefined));

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.url().default("http://localhost:3000"),
  ENABLE_DESIGN_PAGE: bool,

  DATABASE_URL: z.string().min(1),

  S3_ENDPOINT: optional,
  S3_REGION: z.string().default("us-east-1"),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_FORCE_PATH_STYLE: bool,
  S3_PRIVATE_BUCKET: z.string().min(1),
  S3_PUBLIC_BUCKET: z.string().min(1),
  STORAGE_PUBLIC_BASE_URL: z.url(),

  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
  GOOGLE_CLIENT_ID: optional,
  GOOGLE_CLIENT_SECRET: optional,
  SEED_ADMIN_EMAIL: z.email().optional(),

  SMTP_HOST: z.string().default("localhost"),
  SMTP_PORT: z.coerce.number().int().default(1025),
  SMTP_SECURE: bool,
  SMTP_USER: optional,
  SMTP_PASSWORD: optional,
  EMAIL_FROM: z.string().default("TukTrail <no-reply@tuktrail.local>"),

  UPLOAD_MAX_FILES: z.coerce.number().int().min(1).max(10).default(5),
  UPLOAD_MAX_BYTES: z.coerce
    .number()
    .int()
    .min(1)
    .default(10 * 1024 * 1024),
  UPLOAD_SUBMISSIONS_PER_DAY: z.coerce.number().int().min(1).default(10),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

/** Parsed lazily so `next build` and unit tests don't need every variable set. */
export function env(): ServerEnv {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`);
    throw new Error(`Invalid server environment:\n${issues.join("\n")}`);
  }
  cached = parsed.data;
  return cached;
}
