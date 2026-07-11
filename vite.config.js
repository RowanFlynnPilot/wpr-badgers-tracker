import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/wpr-badgers-tracker/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        mini: resolve(__dirname, 'mini.html'),
        'mini-standings': resolve(__dirname, 'mini-standings.html'),
        'mini-digest': resolve(__dirname, 'mini-digest.html'),
      },
    },
  },
})
