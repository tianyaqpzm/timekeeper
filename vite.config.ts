import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
const __dirname = dirname(fileURLToPath(import.meta.url));

// 如果你的 Angular 版本是 v17.1+，官方其实已经原生支持 .env 文件了，不需要 vite.config.ts。
//  该方法不会在执行，该文件可以删除
export default defineConfig(({ command, mode }) => {
    // 1. 强制让 Vite 加载一下当前模式的环境变量
    // process.cwd() 是当前运行命令的目录
    const env = loadEnv(mode, process.cwd(), '');
    debugger
    // 2. 在终端（Terminal）打印出来
    console.log('------------------------------------------------');
    console.log('当前模式 (Mode):', mode);
    console.log('尝试加载的变量 VITE_API_URL:', env.VITE_API_URL);
    console.log('------------------------------------------------');
    return {
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
            // 不生效
            proxy: {
                '/rest': {
                    target: 'http://pei.work.gd:8080',
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/rest/, ''),
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
    };
});
