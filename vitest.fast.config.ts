import path from 'path'
import vue from '@vitejs/plugin-vue2'
import content from '@originjs/vite-plugin-content'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue(), content()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/unit/setup.ts'],
    alias: [
      { find: /^vue$/, replacement: 'vue/dist/vue.runtime.common.js' }
    ],
    pool: 'forks',
    maxWorkers: 1,
    minWorkers: 1,
    testTimeout: 60000
  }
})
