import dotenv from "dotenv";
import path from "node:path";

const envPath = process.env.NODE_ENV === "test" ? ".env.test" : ".env";
dotenv.config({ path: path.resolve(envPath), override: true });
