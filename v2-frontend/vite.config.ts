import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 3000,
		proxy: {
			// Proxy API calls during development only
			'/api': {
				target: 'https://ai-voiceover-api.rss-reply.workers.dev',
				changeOrigin: true
			}
		}
	},
	define: {
		// Use Cloudflare Workers API in production
		'process.env.VITE_API_URL': JSON.stringify('https://ai-voiceover-api.rss-reply.workers.dev')
	}
});
