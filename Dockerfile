# Runs the SvelteKit SSR server that adapter-node emits into build/.
# The app is built locally BEFORE deploying (see the stage and release
# scripts), with the environment-specific .env already applied, so this
# image only installs production dependencies and serves the artifacts.
# Building here instead would risk client asset hashes diverging from the
# ones Firebase Hosting serves from build/client.
FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
# --ignore-scripts skips the svelte-kit sync prepare script, which needs
# the source tree that this image intentionally does not contain.
RUN npm ci --omit=dev --ignore-scripts

COPY build ./build

ENV NODE_ENV=production
# Trust Firebase Hosting's forwarded headers so request URLs reflect the
# origin the reader used rather than the Cloud Run service URL.
ENV PROTOCOL_HEADER=x-forwarded-proto
ENV HOST_HEADER=x-forwarded-host

# Cloud Run provides PORT, which adapter-node reads.
CMD ["node", "build"]
