import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    // Base path for GitHub Pages deployment
    // Change this to your repo name when deploying
    base: process.env.NODE_ENV === 'production' ? '/social-scheduler/' : '/',
});
