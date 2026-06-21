import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import obfuscator from 'vite-plugin-javascript-obfuscator';

export default defineConfig(({ mode }) => {
    const isProd = mode === 'production';
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': 'http://localhost:8080',
        },
      },
      plugins: [
        react(),
        // Obfuscation chỉ khi build production
        isProd && obfuscator({
          options: {
            compact: true,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 0.75,
            deadCodeInjection: true,
            deadCodeInjectionThreshold: 0.4,
            debugProtection: false, // Tránh vấn đề khi debug
            debugProtectionInterval: 0,
            disableConsoleOutput: true,
            identifierNamesGenerator: 'hexadecimal',
            log: false,
            numbersToExpressions: true,
            renameGlobals: false,
            selfDefending: true,
            simplify: true,
            splitStrings: true,
            splitStringsChunkLength: 10,
            stringArray: true,
            stringArrayCallsTransform: true,
            stringArrayEncoding: ['base64'],
            stringArrayIndexShift: true,
            stringArrayRotate: true,
            stringArrayShuffle: true,
            stringArrayWrappersCount: 2,
            stringArrayWrappersChainedCalls: true,
            stringArrayWrappersParametersMaxCount: 4,
            stringArrayWrappersType: 'variable',
            stringArrayThreshold: 0.75,
            transformObjectKeys: true,
            unicodeEscapeSequence: false
          },
          apply: 'build', // Chỉ áp dụng khi build
        })
      ].filter(Boolean),
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        minify: 'terser', // Sử dụng terser để minify tốt hơn
        terserOptions: {
          compress: {
            drop_console: true, // Xóa console.log
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.info', 'console.debug'], // Xóa các hàm này
          },
          mangle: {
            safari10: true,
          },
          format: {
            comments: false, // Xóa hết comments
          },
        },
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom', 'react-router-dom'],
              'vendor-crypto': ['bcryptjs', 'crypto-js'],
              'vendor-http': ['axios'],
              'vendor-icons': ['lucide-react'],
              'vendor-markdown': ['react-markdown', 'remark-gfm'],
              'vendor-mermaid': ['mermaid'],
              'vendor-i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
              'vendor-syntax': ['react-syntax-highlighter'],
            },
          }
        }
      }
    };
});
