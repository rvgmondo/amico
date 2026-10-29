#!/usr/bin/env bash
# Deploy to the live site, amicomotors.co.za (cPanel account amicomotorsco, app root ~/amico).
#
#   bash scripts/deploy-prod.sh
#
# Needs the "amico-prod" host in ~/.ssh/config (key authorised in cPanel, SSH Access).
# Builds locally with the live address baked in (the host's process limit makes building
# there unreliable), then ships code + .next and restarts the Node app. It never touches
# amico.db, media/ or node_modules. If dependencies change, run on the server:
#   source ~/nodevenv/amico/20/bin/activate && cd ~/amico && npm ci --omit=dev --maxsockets 3
#
# The connection to this host drops on long transfers (29 Oct 2026: a streamed deploy died
# half way and left the live site without its public/ folder). So the package goes up in
# 10 MB pieces, each retried, is checked against its md5 on the server, and only then
# replaces the old build, in one step that runs on the server itself.
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="$PWD/vendor/node:$PATH"

rm -rf .next
NEXT_PUBLIC_SERVER_URL=https://amicomotors.co.za npm run build

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
tar czf "$work/deploy.tgz" .next package.json package-lock.json next.config.ts tsconfig.json postcss.config.mjs server.cjs public src scripts
sum="$(md5sum "$work/deploy.tgz" | cut -c1-32)"
(cd "$work" && split -b 10m deploy.tgz part.)

ssh_retry() { for t in 1 2 3 4 5 6; do ssh -o ConnectTimeout=20 amico-prod "$1" && return 0; sleep 5; done; return 1; }
ssh_retry 'rm -rf ~/dparts && mkdir -p ~/dparts'
for f in "$work"/part.*; do
  ok=0
  for t in 1 2 3 4 5 6; do
    if scp -o ServerAliveInterval=10 -o ConnectTimeout=20 -q "$f" amico-prod:dparts/; then ok=1; break; fi
    sleep 5
  done
  [ "$ok" = 1 ] || { echo "upload of $(basename "$f") failed; live site untouched"; exit 1; }
done

ssh_retry "cd ~ && cat dparts/part.* > deploy.tgz && [ \"\$(md5sum deploy.tgz | cut -c1-32)\" = \"$sum\" ] && nohup sh -c 'cd ~/amico && gzip -t ~/deploy.tgz && rm -rf .next public && tar xzf ~/deploy.tgz && rm -rf ~/deploy.tgz ~/dparts && cloudlinux-selector restart --json --interpreter nodejs --app-root amico && echo DONE' > ~/deploy.log 2>&1 &" \
  || { echo "package did not arrive intact; live site untouched"; exit 1; }

sleep 45
ssh_retry 'cat ~/deploy.log'
# Test the new server directly, whatever DNS currently says.
curl -s --resolve amicomotors.co.za:443:85.187.142.78 -o /dev/null -w "live: %{http_code}\n" --max-time 90 https://amicomotors.co.za/
