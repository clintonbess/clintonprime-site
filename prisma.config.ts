import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import { defineConfig } from "prisma/config";
import path from "node:path";

const envPath = process.env.NODE_ENV === "test" ? ".env.test" : ".env";
dotenvExpand.expand(
  dotenv.config({ path: path.resolve(envPath), override: true })
);

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("${")) {
  const {
    DATABASE_USER,
    DATABASE_PASS,
    DATABASE_HOST,
    DATABASE_PORT,
    DATABASE_NAME,
  } = process.env;
  process.env.DATABASE_URL = `postgresql://${DATABASE_USER}:${DATABASE_PASS}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}?schema=public`;
}

export default defineConfig({
  schema: "libs/db/prisma/schema.prisma",
});
