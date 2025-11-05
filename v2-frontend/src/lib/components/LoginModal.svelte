<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { X, Mail, Lock, User } from 'lucide-svelte';

	export let show = false;
	
	const dispatch = createEventDispatcher();

	let isSignUp = false;
	let email = '';
	let password = '';
	let name = '';
	let loading = false;
	let error = '';

	const API_BASE = 'https://ai-voiceover-api.rss-reply.workers.dev';

	async function handleSubmit() {
		if (!email || !password) {
			error = 'Please fill in all fields';
			return;
		}

		loading = true;
		error = '';

		try {
			const endpoint = isSignUp ? '/api/auth/sign-up' : '/api/auth/sign-in';
			const body = isSignUp 
				? { email, password, name }
				: { email, password };

			const response = await fetch(`${API_BASE}${endpoint}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(body)
			});

			const result = await response.json();

			if (response.ok) {
				// Store auth token
				localStorage.setItem('auth_token', result.token);
				
				// Dispatch success event
				dispatch('authSuccess', {
					user: result.user,
					token: result.token
				});
				
				// Close modal
				show = false;
				resetForm();
			} else {
				error = result.error || 'Authentication failed';
			}
		} catch (err) {
			error = 'Network error. Please try again.';
		} finally {
			loading = false;
		}
	}

	function resetForm() {
		email = '';
		password = '';
		name = '';
		error = '';
		isSignUp = false;
	}

	function closeModal() {
		show = false;
		resetForm();
	}

	function toggleMode() {
		isSignUp = !isSignUp;
		error = '';
	}
</script>

{#if show}
	<!-- Modal backdrop -->
	<div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-2xl max-w-md w-full">
			<!-- Header -->
			<div class="p-6 border-b border-gray-200">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
							<User class="w-5 h-5 text-white" />
						</div>
						<div>
							<h3 class="text-lg font-semibold text-gray-900">
								{isSignUp ? 'Create Account' : 'Sign In'}
							</h3>
							<p class="text-sm text-gray-600">
								{isSignUp ? 'Join to access premium features' : 'Welcome back!'}
							</p>
						</div>
					</div>
					<button 
						on:click={closeModal}
						class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
					>
						<X class="w-5 h-5 text-gray-500" />
					</button>
				</div>
			</div>

			<!-- Form -->
			<form on:submit|preventDefault={handleSubmit} class="p-6">
				<!-- Name field (signup only) -->
				{#if isSignUp}
					<div class="mb-4">
						<label class="block text-sm font-medium text-gray-700 mb-2">
							Full Name
						</label>
						<div class="relative">
							<User class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
							<input
								type="text"
								bind:value={name}
								placeholder="Enter your full name"
								class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
								required={isSignUp}
							/>
						</div>
					</div>
				{/if}

				<!-- Email field -->
				<div class="mb-4">
					<label class="block text-sm font-medium text-gray-700 mb-2">
						Email Address
					</label>
					<div class="relative">
						<Mail class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
						<input
							type="email"
							bind:value={email}
							placeholder="Enter your email"
							class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
							required
						/>
					</div>
				</div>

				<!-- Password field -->
				<div class="mb-6">
					<label class="block text-sm font-medium text-gray-700 mb-2">
						Password
					</label>
					<div class="relative">
						<Lock class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
						<input
							type="password"
							bind:value={password}
							placeholder="Enter your password"
							class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
							required
						/>
					</div>
				</div>

				<!-- Error display -->
				{#if error}
					<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
						<p class="text-red-700 text-sm">{error}</p>
					</div>
				{/if}

				<!-- Submit button -->
				<button
					type="submit"
					disabled={loading}
					class="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold
						hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed
						transition-all duration-200 flex items-center justify-center gap-2"
				>
					{#if loading}
						<div class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
						{isSignUp ? 'Creating Account...' : 'Signing In...'}
					{:else}
						{isSignUp ? 'Create Account' : 'Sign In'}
					{/if}
				</button>

				<!-- Toggle mode -->
				<div class="mt-4 text-center">
					<button
						type="button"
						on:click={toggleMode}
						class="text-sm text-gray-600 hover:text-gray-800 transition-colors"
					>
						{isSignUp 
							? 'Already have an account? Sign in' 
							: "Don't have an account? Sign up"}
					</button>
				</div>

				<!-- Admin note -->
				<div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
					<p class="text-blue-700 text-xs text-center">
						🔑 Admin users get full access automatically
					</p>
				</div>
			</form>
		</div>
	</div>
{/if}
