import { defineConfig } from 'vite'
import reactOxc from '@vitejs/plugin-react-oxc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactOxc()],
  server: {
    port: 3000,
  },
})