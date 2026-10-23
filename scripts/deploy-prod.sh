#!/usr/bin/env bash
# Deploy to the live site, amicomotors.co.za (cPanel account amicomotorsco, app root ~/amico).
#
#   bash scripts/deploy-prod.sh
#
# Needs the "amico-prod" host in ~/.ssh/config (key authorised in cPanel, SSH Access).
# Builds locally with the live address baked in (the host's process limit makes building
# there unreliable), ships code + .next, restarts the Node app. It never touches amico.db,
# media/ or node_modules. If dependencies change, run on the server:
#   source ~/nodevenv/amico/20/bin/activate && cd ~/amico && npm ci --omit=dev --maxsockets 3
# Afterwards the committed .next is restored, because the repo's .next is the staging build.
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="$PWD/vendor/node:$PATH"

rm -rf .next
NEXT_PUBLIC_SERVER_URL=https://amicomotors.co.za npm run build

tar czf - .next package.json package-lock.json next.config.ts tsconfig.json postcss.config.mjs server.cjs public src scripts \
  | ssh -o ServerAliveInterval=15 amico-prod 'cd ~/amico && rm -rf .next public && tar xzf - && cloudlinux-selector restart --json --interpreter nodejs --app-root amico'

git checkout -- .next && git clean -fdq .next
curl -s -o /dev/null -w "amicomotors.co.za: %{http_code}\n" --max-time 90 https://amicomotors.co.za/
