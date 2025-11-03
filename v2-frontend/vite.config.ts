import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 3000,
		proxy: {
			// Proxy API calls to Flask backend during development
			'/api': {
				target: 'http://localhost:5000',
				changeOrigin: true
			}
		}
	}
});
