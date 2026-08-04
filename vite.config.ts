import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // Load all env vars (no VITE_ prefix) — only available in this Node context, not the browser bundle
  const env = loadEnv(mode, process.cwd(), '')
  const workerUrl = env.AI_IMAGE_API_URL?.trim().replace(/\/$/, '')

  return {
    plugins: [react(), tailwindcss()],
    define: {
      // Injected at build/dev time; not exposed via import.meta.env
      __AI_IMAGE_PROVIDER__: JSON.stringify(env.AI_IMAGE_PROVIDER ?? 'mock'),
    },
    server: workerUrl
      ? {
          proxy: {
            '/api/generate-image': {
              target: workerUrl,
              changeOrigin: true,
              rewrite: () => '/generate-image',
            },
          },
        }
      : undefined,
    preview: workerUrl
      ? {
          proxy: {
            '/api/generate-image': {
              target: workerUrl,
              changeOrigin: true,
              rewrite: () => '/generate-image',
            },
          },
        }
      : undefined,
  }
})
