<script lang="ts">
	import { onMount } from 'svelte';
	import { User, Crown, Clock, CreditCard, Settings, ExternalLink } from 'lucide-svelte';

	let currentUser: any = null;
	let usage: any = null;
	let loading = true;

	const API_BASE = 'https://ai-voiceover-api.rss-reply.workers.dev';

	onMount(async () => {
		// Get current user
		const token = localStorage.getItem('auth_token');
		if (!token) {
			window.location.href = '/';
			return;
		}

		try {
			const response = await fetch(`${API_BASE}/api/auth/me`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});

			const userData = await response.json();
			if (userData.success) {
				currentUser = userData.user;
			}
		} catch (error) {
			console.error('Failed to load user:', error);
		}

		loading = false;
	});

	async function openBillingPortal() {
		const token = localStorage.getItem('auth_token');
		if (!token) return;

		try {
			const response = await fetch(`${API_BASE}/api/billing/portal`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					return_url: window.location.origin + '/profile'
				})
			});

			const result = await response.json();
			if (result.success) {
				window.open(result.url, '_blank');
			}
		} catch (error) {
			console.error('Failed to open billing portal:', error);
		}
	}
</script>

<svelte:head>
	<title>Profile - AI Voiceover Generator</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8">
	<div class="container mx-auto px-4 max-w-4xl">
		{#if loading}
			<div class="text-center py-20">
				<div class="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
				<p class="text-gray-600 mt-4">Loading profile...</p>
			</div>
		{:else if !currentUser}
			<div class="text-center py-20">
				<h1 class="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h1>
				<a href="/" class="text-indigo-600 hover:text-indigo-800">Go back to home</a>
			</div>
		{:else}
			<!-- Profile Header -->
			<div class="bg-white rounded-2xl p-8 shadow-lg mb-8">
				<div class="flex items-center gap-4 mb-6">
					<div class="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
						<User class="w-8 h-8 text-white" />
					</div>
					<div>
						<h1 class="text-2xl font-bold text-gray-900">{currentUser.email}</h1>
						<div class="flex items-center gap-2 mt-1">
							{#if currentUser.isAdmin}
								<span class="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full font-bold flex items-center gap-1">
									<Crown class="w-4 h-4" />
									Administrator
								</span>
							{:else}
								<span class="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full font-medium">
									{currentUser.plan?.toUpperCase()} Plan
								</span>
							{/if}
						</div>
					</div>
				</div>

				<!-- Quick stats -->
				<div class="grid md:grid-cols-3 gap-6">
					<div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
						<div class="flex items-center gap-2 mb-2">
							<Clock class="w-5 h-5 text-blue-600" />
							<span class="font-medium text-gray-900">Usage This Month</span>
						</div>
						<p class="text-2xl font-bold text-blue-600">
							{currentUser.isAdmin ? '∞' : `${currentUser.minutesUsed || 0}`} 
							<span class="text-sm font-normal text-gray-600">
								{currentUser.isAdmin ? 'Unlimited' : 'minutes'}
							</span>
						</p>
					</div>
					
					<div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
						<div class="flex items-center gap-2 mb-2">
							<Crown class="w-5 h-5 text-green-600" />
							<span class="font-medium text-gray-900">Plan Status</span>
						</div>
						<p class="text-lg font-bold text-green-600">
							{#if currentUser.isAdmin}
								Admin Access
							{:else}
								{currentUser.plan?.charAt(0)?.toUpperCase()}{currentUser.plan?.slice(1)} Plan
							{/if}
						</p>
					</div>
					
					<div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4">
						<div class="flex items-center gap-2 mb-2">
							<Settings class="w-5 h-5 text-purple-600" />
							<span class="font-medium text-gray-900">Account</span>
						</div>
						<p class="text-sm text-gray-600">
							Member since {new Date().toLocaleDateString()}
						</p>
					</div>
				</div>
			</div>

			<!-- Plan & Billing -->
			{#if !currentUser.isAdmin}
				<div class="bg-white rounded-2xl p-8 shadow-lg mb-8">
					<h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
						<CreditCard class="w-6 h-6 text-indigo-600" />
						Billing & Subscription
					</h2>
					
					<div class="grid md:grid-cols-2 gap-6">
						<div>
							<h3 class="font-semibold text-gray-900 mb-2">Current Plan</h3>
							<p class="text-gray-600 mb-4">
								You're currently on the <strong>{currentUser.plan?.toUpperCase()}</strong> plan.
								{#if currentUser.plan === 'free'}
									Upgrade to access premium voices and more minutes.
								{/if}
							</p>
							
							{#if currentUser.plan === 'free'}
								<a href="/pricing" class="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
									<Crown class="w-4 h-4" />
									Upgrade Plan
								</a>
							{:else}
								<button 
									on:click={openBillingPortal}
									class="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
								>
									<ExternalLink class="w-4 h-4" />
									Manage Subscription
								</button>
							{/if}
						</div>
						
						<div>
							<h3 class="font-semibold text-gray-900 mb-2">Usage Limits</h3>
							<div class="space-y-2 text-sm text-gray-600">
								{#if currentUser.plan === 'free'}
									<p>• 10 minutes of audio per month</p>
									<p>• Basic Edge TTS voices only</p>
									<p>• 5MB file size limit</p>
									<p>• £0.15/min overage available</p>
								{:else if currentUser.plan === 'basic'}
									<p>• 100 minutes of audio per month</p>
									<p>• All Edge TTS + OpenAI voices</p>
									<p>• 15MB file size limit</p>
									<p>• £0.12/min overage rate</p>
								{:else}
									<p>• 300 minutes of audio per month</p>
									<p>• All premium voices</p>
									<p>• 50MB file size limit</p>
									<p>• £0.10/min overage rate</p>
									<p>• Commercial use license</p>
								{/if}
							</div>
						</div>
					</div>
				</div>
			{:else}
				<!-- Admin privileges -->
				<div class="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-8 shadow-lg mb-8 border-2 border-yellow-200">
					<h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
						<Crown class="w-6 h-6 text-yellow-600" />
						Administrator Privileges
					</h2>
					
					<div class="grid md:grid-cols-2 gap-6">
						<div>
							<h3 class="font-semibold text-gray-900 mb-2">🔓 Unlimited Access</h3>
							<ul class="space-y-1 text-sm text-gray-700">
								<li>• Unlimited audio generation</li>
								<li>• All premium voices included</li>
								<li>• No file size limits</li>
								<li>• Priority processing</li>
								<li>• All features unlocked</li>
							</ul>
						</div>
						
						<div>
							<h3 class="font-semibold text-gray-900 mb-2">🛠️ Admin Features</h3>
							<ul class="space-y-1 text-sm text-gray-700">
								<li>• User management access</li>
								<li>• Usage analytics</li>
								<li>• System monitoring</li>
								<li>• Feature flag control</li>
								<li>• Direct API access</li>
							</ul>
						</div>
					</div>
				</div>
			{/if}

			<!-- Account Settings -->
			<div class="bg-white rounded-2xl p-8 shadow-lg">
				<h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
					<Settings class="w-6 h-6 text-gray-600" />
					Account Settings
				</h2>
				
				<div class="space-y-6">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
						<input 
							type="email" 
							value={currentUser.email} 
							disabled
							class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
						/>
						<p class="text-xs text-gray-500 mt-1">Contact support to change your email address</p>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
						<div class="flex items-center gap-2">
							{#if currentUser.isAdmin}
								<span class="px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg font-medium">
									Administrator Account
								</span>
							{:else}
								<span class="px-3 py-2 bg-indigo-100 text-indigo-800 rounded-lg font-medium">
									{currentUser.plan?.charAt(0)?.toUpperCase()}{currentUser.plan?.slice(1)} User
								</span>
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
