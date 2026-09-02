#!/usr/bin/env bash
# Clears any half-dead processes squatting the test-only emulator ports
# (a hard-killed previous run can orphan the Java Firestore emulator),
# builds the functions the functions emulator serves, then runs the given
# command under `firebase emulators:exec` so emulator output is visible
# and shutdown is handled cleanly. Used by `npm run test:e2e:emu`.
set -e
for port in 19099 18080 19199 15001 14400 14500 14501 14502; do
    pid=$(lsof -nP -tiTCP:"$port" -sTCP:LISTEN || true)
    if [ -n "$pid" ]; then
        kill "$pid" 2>/dev/null || true
    fi
done
sleep 1
npm --prefix functions run build
exec npx firebase emulators:exec \
    --only auth,firestore,storage,functions \
    --project demo-bookish \
    --config firebase.test.json \
    "$*"
