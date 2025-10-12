import fs from "node:fs";
import path from "node:path";
import glob from "fast-glob";

const ROOTS = ["apps/web/src", "libs/api/src"]; // adjust if needed
const FINDERS = [
  /from\s+["']\.\.\/\.\.\/kernel\/types\/neo-file["'];?/g,
  /from\s+["']\.\.\/kernel\/types\/neo-file["'];?/g,
  /from\s+["']\.\.\/\.\.\/kernel\/types["'];?/g,
  /from\s+["']\.\.\/kernel\/types["'];?/g,
];
const REPLACER = `from "@clintonprime/types";`;

for (const root of ROOTS) {
  const files = glob.sync(["**/*.ts", "**/*.tsx"], {
    cwd: root,
    absolute: true,
  });
  for (const file of files) {
    const src = fs.readFileSync(file, "utf8");
    let out = src;
    for (const re of FINDERS) out = out.replace(re, REPLACER);
    if (out !== src) {
      fs.writeFileSync(file, out, "utf8");
      console.log("updated imports:", path.relative(process.cwd(), file));
    }
  }
}
