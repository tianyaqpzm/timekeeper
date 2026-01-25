import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    root: '.',
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: true,
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
    server: {
        port: 4200,
        strictPort: true,
        proxy: {
            '/api': {
                target: 'http://pei.work.gd:8080',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ''),
            },
        },
    },
    optimizeDeps: {
        include: [
            '@angular/core',
            '@angular/common',
            '@angular/platform-browser',
            '@angular/router',
            '@angular/forms',
            '@angular/animations',
            '@angular/compiler',
            '@angular/material',
            '@angular/cdk',
            'rxjs',
        ],
    },
});
