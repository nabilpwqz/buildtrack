import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string(),
  DATABASE_URL_UNPOOLED: z.string().optional(),
  NEON_BRANCH: z.string().optional(),
  NEON_BRANCH_ID: z.string().optional(),
  AUTH_TRUST_HOST: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_ENDPOINT_URL_S3: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AUTH_SECRET: z.string().default("buildtrack-forged-steel-molten-amber-jwt-secret-key-32-chars-min!"),
  NEXTAUTH_URL: z.string().optional().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED,
  NEON_BRANCH: process.env.NEON_BRANCH,
  NEON_BRANCH_ID: process.env.NEON_BRANCH_ID,
  AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_ENDPOINT_URL_S3: process.env.AWS_ENDPOINT_URL_S3,
  AWS_REGION: process.env.AWS_REGION,
  AUTH_SECRET: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NODE_ENV: process.env.NODE_ENV,
});

export function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("Environment validation failed:", result.error.format());
    throw new Error("Invalid environment variables");
  }
  return result.data;
}

