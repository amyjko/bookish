const { build } = require("esbuild")

// Load environment variables from .env file
require('dotenv').config()

// Build a dictionary of the environment variables to pass to esbuild
const define = {}
for (const k in process.env) {
  define[`process.env.${k}`] = JSON.stringify(process.env[k])
}

const options = {
  // the entry point file described above
  entryPoints: ['src/Reader.jsx'],
  loader: { '.js': 'jsx' },
  bundle: true,
  minify: true,
  // Replace with the browser versions you need to target
  target: ['chrome60', 'firefox60', 'safari11', 'edge20'],
  // Optional and for development only. This provides the ability to
  // map the built code back to the original source format when debugging.
  sourcemap: 'inline',
  define
}

build(options).catch(() => process.exit(1))