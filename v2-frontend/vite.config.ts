import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 3000,
		proxy: {
			// Proxy API calls to Cloudflare Workers backend
			'/api': {
				target: 'https://ai-voiceover-api.rss-reply.workers.dev',
				changeOrigin: true
			}
		}
	}
});
