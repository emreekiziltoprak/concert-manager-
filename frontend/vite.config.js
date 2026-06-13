import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Docker build sırasında veya lokalde .env.development dosyasını zorla yükletiyoruz
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
        usePolling: true // Windows/Docker dosya senkronizasyonu için kritik
      }
  },
    build: {
      sourcemap: true,
    },
    // Değişkenleri global olarak tanımlıyoruz ki kodun her yerinden erişilebilsin
    define: {
      'process.env': env
    }
  }
})