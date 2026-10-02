#!/usr/bin/env bash
#
# The QA topology in one command.
#
# Every scenario the brief asks to be photographed needs its own CMS behaviour, and a
# mock CMS instance is cheap: one process serves the documented REST shapes from the
# theme's fixture encoder with a scenario flag. This script starts the *scenario* half of
# the topology — the primary site (`:3200`) and its CMS (`:4011`) stay separate so the
# main preview is readable on its own.
#
#   bash scripts/qa-servers.sh          # start everything (Ctrl-C stops it again)
#   bash scripts/qa-servers.sh --build  # rebuild + repackage the standalone output first
#   bash scripts/qa-servers.sh --reset  # free this script's ports first, then start
#
# `--reset` exists because a stale topology is otherwise sticky: the preflight below refuses
# to start, and the leftover processes hold *only* these ports. It never touches anything
# outside the list it owns.
#
# Then, in another shell:
#   node scripts/screenshots.mjs --base http://127.0.0.1:3200 --scale 2
#
# Ports: 3300 slow CMS · 3400 suspended · 3500 empty · 3600 unreachable ·
#        3700 no logo · 3800 long labels.
set -euo pipefail
cd "$(dirname "$0")/.."

PORTS=(3300 3400 3500 3600 3700 3800 4013 4014 4015 4016 4017)

for argument in "$@"; do
  case "$argument" in
    --build)
      npm run build
      ARCH2_INCLUDE_QA=1 npm run prepare:standalone
      ;;
    --reset)
      for port in "${PORTS[@]}"; do
        # `ss -H` with a sport filter: one pid per port, nothing else is touched.
        while read -r pid; do
          [[ -n "$pid" ]] && kill "$pid" 2>/dev/null && echo "[qa] freed :$port (pid $pid)"
        done < <(ss -ltnpH "sport = :$port" 2>/dev/null | grep -oP 'pid=\K[0-9]+' | sort -u)
      done
      sleep 2
      ;;
  esac
done

if [[ ! -f .next/standalone/server.js ]]; then
  echo "no .next/standalone/server.js — run: npm run build && ARCH2_INCLUDE_QA=1 npm run prepare:standalone" >&2
  exit 1
fi

# Preflight: a half-bound topology photographs the wrong thing (an EADDRINUSE mock dies
# and the theme then talks to whatever still holds the port). Refuse instead of guessing.
for port in "${PORTS[@]}"; do
  if (exec 3<>"/dev/tcp/127.0.0.1/$port") 2>/dev/null; then
    exec 3>&- 2>/dev/null || true
    echo "port $port is already in use — stop the previous QA topology first" >&2
    exit 1
  fi
done

pids=()
cleanup() {
  # Kill the whole group, not just the direct children.
  for pid in "${pids[@]:-}"; do kill "$pid" 2>/dev/null || true; done
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

mock() { # name port site-port mode [extra flags...]
  local name=$1 port=$2 origin=$3 mode=$4
  shift 4
  echo "[qa] mock CMS  :$port  ($name)"
  node --experimental-strip-types scripts/mock-cms.mjs --port "$port" --origin "http://127.0.0.1:$origin" --mode "$mode" "$@" &
  pids+=($!)
}

theme() { # name port cms-port
  local name=$1 port=$2 cms=$3
  echo "[qa] theme     :$port  ($name → CMS :$cms)"
  ( cd .next/standalone && PORT="$port" HOSTNAME=0.0.0.0 \
      ESHOBE_CMS_URL="http://127.0.0.1:$cms" ESHOBE_PUBLIC_ORIGIN="http://127.0.0.1:$port" \
      node server.js ) &
  pids+=($!)
}

# 2.5s per CMS read: slow enough that a navigation is still in flight when the shot is
# taken, fast enough that the *page the shot starts from* loads while the run waits.
mock "deliberately slow" 4015 3300 slow --delay 2500
mock "suspended site"    4013 3400 holding
mock "empty site"        4014 3500 empty
mock "no logo"           4016 3700 nologo
mock "long labels"       4017 3800 longlabels

# The themes start together so their first request is already answered by a live CMS.
theme "slow CMS"        3300 4015
theme "suspended site"  3400 4013
theme "empty site"      3500 4014
theme "unreachable"     3600 4099   # deliberately dead port
theme "no logo"         3700 4016
theme "long labels"     3800 4017

echo '[qa] scenario servers up — Ctrl-C to stop'
wait
