import { defineConfig } from 'vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: { 'process.env.NODE_ENV': '"production"' },
  build: {
    // We always run this build after the app build, so we don't want to destroy it.
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'reader/Reader.tsx'),
      name: "Bookish",
      fileName: "bookish",
      // Make an immediately evaluated function suitable for script import by books.
      formats: ["iife"]
    },
    rollupOptions: {
      output: {
        entryFileNames: (assetInfo) => assetInfo.name === 'Reader' ? 'bookish.js' : assetInfo.name ?? "",
        assetFileNames: (assetInfo) => assetInfo.name === 'style.css' ? 'bookish.css' : assetInfo.name ?? ""
      } 
    }
  }
})
