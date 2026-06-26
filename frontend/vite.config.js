import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    define: {
        'process.env': {}
    },
    server: {
        port: 3000,
        open: true
    },
    // Add this to explicitly set the entry point
    build: {
        rollupOptions: {
            input: '/index.html'
        }
    }
})