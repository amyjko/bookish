const { build } = require("esbuild")
const svgrPlugin = require("esbuild-plugin-svgr")

// Load environment variables from .env file
require('dotenv').config()

// Build a dictionary of the environment variables to pass to esbuild
const define = {}
for (const k in process.env) {
  define[`process.env.${k}`] = JSON.stringify(process.env[k])
}

// Dev or prod?
define["process.env.dev"] = process.argv[2] === "dev"

// Build the app with the environment variables.
const appOptions = {
  // the entry point file described above
  entryPoints: ['src/App.jsx'],
  loader: { '.js': 'jsx' },
  // the build folder location described above
  outfile: 'public/app.js',
  plugins: [ svgrPlugin() ],
  bundle: true,
  // Replace with the browser versions you need to target
  target: ['chrome60', 'firefox60', 'safari11', 'edge20'],
  // Optional and for development only. This provides the ability to
  // map the built code back to the original source format when debugging.
  sourcemap: 'inline',
  define
}

build(appOptions).catch(() => process.exit(1))

// Build the reader, slightly smaller for just reading.
const readerOptions = {
  // the entry point file described above
  entryPoints: ['src/Reader.jsx'],
  loader: { '.js': 'jsx' },
  plugins: [ svgrPlugin() ],
  bundle: true,
  minify: false,
  outfile: 'public/bookish.js',
  // Replace with the browser versions you need to target
  target: ['chrome60', 'firefox60', 'safari11', 'edge20'],
  // Optional and for development only. This provides the ability to
  // map the built code back to the original source format when debugging.
  sourcemap: 'inline',
}

build(readerOptions).catch(() => process.exit(1))