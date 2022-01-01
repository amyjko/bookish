const { build } = require("esbuild")

// Load environment variables from .env file
require('dotenv').config()

const options = {
  // the entry point file described above
  entryPoints: ['src/Reader.jsx'],
  loader: { '.js': 'jsx' },
  bundle: true,
  minify: false,
  outfile: 'build/bookish.js',
  // Replace with the browser versions you need to target
  target: ['chrome60', 'firefox60', 'safari11', 'edge20'],
  // Optional and for development only. This provides the ability to
  // map the built code back to the original source format when debugging.
  sourcemap: 'inline',
}

build(options).catch(() => process.exit(1))