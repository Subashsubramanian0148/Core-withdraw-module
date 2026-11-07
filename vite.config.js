import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// Inline images so the standalone html/index.html has no external files
export default defineConfig({ plugins: [react()], server: { port: 5176 }, build: { assetsInlineLimit: 100000000 } })
