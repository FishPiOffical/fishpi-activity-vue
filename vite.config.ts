import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import VueRouter from 'unplugin-vue-router/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isProd = mode === 'production'

  return {
    // 生产环境 base 路径（如果部署到子目录，如 /activity 则修改为 '/activity/'）
    base: env.VITE_BASE_PATH || '/',

    plugins: [
      VueRouter({
        routesFolder: 'src/pages',
        dts: 'src/typed-router.d.ts',
      }),
      vue(),
      AutoImport({
        imports: [
          'vue',
          'vue-router',
          'pinia',
          '@vueuse/core',
          {
            'naive-ui': [
              'useDialog',
              'useMessage',
              'useNotification',
              'useLoadingBar',
            ],
          },
        ],
        dts: 'src/auto-imports.d.ts',
        dirs: ['src/composables'],
        vueTemplate: true,
      }),
      Components({
        resolvers: [NaiveUiResolver()],
        dts: 'src/components.d.ts',
        dirs: ['src/components'],
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8090',
          changeOrigin: true,
        },
        '/backend': {
          target: 'http://localhost:8090',
          changeOrigin: true,
        },
      },
    },
    esbuild: {
      // 生产环境移除 console 和 debugger
      drop: isProd ? ['console', 'debugger'] : [],
    },
    build: {
      // 分包配置
      rollupOptions: {
        output: {
          manualChunks: {
            'naive-ui': ['naive-ui'],
          },
        },
      },
    },
  }
})
