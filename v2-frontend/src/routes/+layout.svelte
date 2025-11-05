<script lang="ts">
	import '../app.css';
	import TopNav from '$lib/components/TopNav.svelte';
	import LoginModal from '$lib/components/LoginModal.svelte';
	import { onMount } from 'svelte';

	let currentUser: any = null;
	let showLogin = false;

	function handleShowLogin() {
		showLogin = true;
	}

	function handleAuthSuccess(event: CustomEvent) {
		currentUser = event.detail.user;
		console.log('Logged in as:', currentUser);
	}

	function handleLogout() {
		localStorage.removeItem('auth_token');
		currentUser = null;
	}

	// Check for existing auth token on load
	onMount(() => {
		const token = localStorage.getItem('auth_token');
		if (token) {
			fetch('https://ai-voiceover-api.rss-reply.workers.dev/api/auth/me', {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			})
			.then(res => res.json())
			.then(data => {
				if (data.success) {
					currentUser = data.user;
				}
			})
			.catch(() => {
				localStorage.removeItem('auth_token');
			});
		}
	});
</script>

<TopNav {currentUser} on:showLogin={handleShowLogin} on:logout={handleLogout} />

<main>
	<slot />
</main>

<LoginModal bind:show={showLogin} on:authSuccess={handleAuthSuccess} />
