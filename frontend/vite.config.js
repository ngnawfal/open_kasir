import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [
        react(),
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes('node_modules')) return

                    if (id.includes('react') || id.includes('scheduler')) {
                        return 'vendor-react'
                    }

                    if (id.includes('lucide-react') || id.includes('react-icons')) {
                        return 'vendor-icons'
                    }

                    if (id.includes('@zxing/library') || id.includes('html5-qrcode')) {
                        return 'vendor-scanner'
                    }
                }
            }
        }
    },
    server: {
        host: true,  // Allow network access
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/uploads': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            }
        }
    }
})
