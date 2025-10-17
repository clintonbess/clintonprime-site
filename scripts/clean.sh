pnpm dlx rimraf **/node_modules apps/**/node_modules libs/**/node_modules packages/**/node_modules
pnpm dlx rimraf apps/**/dist libs/**/dist packages/**/dist

pnpm install --no-frozen-lockfile