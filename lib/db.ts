import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

function ensureDatabaseEnv() {
  if (!process.env.DATABASE_URL) {
    const cwd = process.cwd();
    for (const envFile of [".env.local", ".env"]) {
      const fullPath = path.join(cwd, envFile);
      if (fs.existsSync(fullPath)) {
        dotenv.config({ path: fullPath, override: false });
      }
    }
  }

  const resolvedUrl =
    process.env.DATABASE_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL;

  if (resolvedUrl && !process.env.DATABASE_URL) {
    process.env.DATABASE_URL = resolvedUrl;
  }

  return resolvedUrl;
}

const resolvedDatabaseUrl = ensureDatabaseEnv();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(resolvedDatabaseUrl ? { datasources: { db: { url: resolvedDatabaseUrl } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
export default prisma;
