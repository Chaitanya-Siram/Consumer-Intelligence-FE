import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const azureEndpoint = (env.VITE_AZURE_OPENAI_ENDPOINT || 'https://amx-gpt-india.openai.azure.com').replace(/\/$/, '');
  const azureApiKey = env.VITE_AZURE_OPENAI_API_KEY;
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      open: true,
      proxy: {
        '/api-pexels': {
          target: 'https://api.pexels.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api-pexels/, ''),
        },
        '/api-azure-openai': {
          target: azureEndpoint,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api-azure-openai/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('api-key', azureApiKey);
            });
          },
        },
      },
    },
  };
});
