#!/usr/bin/env bash
# Starts the dedicated test emulators (see firebase.test.json) for the
# e2e-emulator Playwright suite, first clearing any half-dead processes
# squatting the test-only ports — a hard-killed previous run can orphan the
# Java Firestore emulator. These ports are used ONLY by this suite, so
# clearing them is safe by construction.
set -ex
exec 2>&1
for port in 19099 18080 19199 15001 14400 14500 14501 14502; do
    pid=$(lsof -nP -tiTCP:"$port" -sTCP:LISTEN || true)
    if [ -n "$pid" ]; then
        kill "$pid" 2>/dev/null || true
    fi
done
sleep 1
npm --prefix functions run build
exec npx firebase emulators:start --only auth,firestore,storage,functions --project demo-bookish --config firebase.test.json
