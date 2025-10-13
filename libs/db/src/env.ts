import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import path from "node:path";

const envPath = process.env.NODE_ENV === "test" ? ".env.test" : ".env";
dotenvExpand.expand(
  dotenv.config({ path: path.resolve(envPath), override: true })
);
