# ensure devDeps are installed for the build step
unset NODE_ENV
pnpm install --prod=false          # or: pnpm -w install --prod=false