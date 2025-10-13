import "./env"; // ensures .env or .env.test is loaded first
import { PrismaClient } from "@prisma/client";

// prevent hot-reload duplication in dev
declare global {
  // eslint-disable-next-line no-var
  var __PRISMA__: PrismaClient | undefined;
}

export const prisma =
  global.__PRISMA__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["error"] : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") global.__PRISMA__ = prisma;
