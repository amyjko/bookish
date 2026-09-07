#!/usr/bin/env bash
# Starts emulators, seeds the demo book into them, and runs the dev server
# against them. Used by `npm run demo`.
#
# Deliberately uses the offset ports from firebase.test.json rather than the
# defaults in firebase.json, so this never collides with another Firebase
# project's emulators running on 8080/9099/9199.
set -e

FIRESTORE_PORT=18080
AUTH_PORT=19099
STORAGE_PORT=19199
DEV_PORT=${DEMO_PORT:-5173}

# A hard-killed previous run can orphan the Java Firestore emulator.
for port in $AUTH_PORT $FIRESTORE_PORT $STORAGE_PORT 14400 14500 14501 14502; do
    pid=$(lsof -nP -tiTCP:"$port" -sTCP:LISTEN || true)
    if [ -n "$pid" ]; then
        kill "$pid" 2>/dev/null || true
    fi
done
sleep 1

# Seeding writes through the admin SDK; the dev server reads Firestore through
# the admin SDK on the reader route and through the client SDK on the write
# route, so both sets of variables are needed.
export FIRESTORE_EMULATOR_HOST=127.0.0.1:$FIRESTORE_PORT
export FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:$AUTH_PORT
export FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:$STORAGE_PORT
export GOOGLE_CLOUD_PROJECT=demo-bookish

# Read by the browser: which emulators to connect to, and which project.
export PUBLIC_CONTEXT=local
export PUBLIC_READER=false
export PUBLIC_FIREBASE_PROJECT_ID=demo-bookish
export PUBLIC_FIREBASE_STORAGE_BUCKET=demo-bookish.appspot.com
export PUBLIC_EMULATOR_FIRESTORE=$FIRESTORE_PORT
export PUBLIC_EMULATOR_AUTH=$AUTH_PORT
export PUBLIC_EMULATOR_STORAGE=$STORAGE_PORT

# Built and previewed rather than `vite dev`: the reader route's server render
# pulls the chapter model through a module cycle that Vite's dev SSR evaluator
# cannot order, though the production build resolves it fine. This is also how
# the emulator end-to-end suite runs the app.
#
# `vite build` directly rather than `npm run build`, whose `env` step would
# overwrite your .env with whichever project happens to be selected.
npx vite build

exec npx firebase emulators:exec \
    --only auth,firestore,storage \
    --project demo-bookish \
    --config firebase.test.json \
    "node scripts/seed-demo.js && \
     echo '' && \
     echo '  Demo book ready at http://localhost:$DEV_PORT/demo' && \
     echo '' && \
     npx vite preview --port $DEV_PORT --strictPort"
