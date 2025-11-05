<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { User, Settings, CreditCard, LogOut, Menu, X } from 'lucide-svelte';

	export let currentUser: any = null;
	
	const dispatch = createEventDispatcher();

	let mobileMenuOpen = false;

	function showLogin() {
		dispatch('showLogin');
	}

	function logout() {
		dispatch('logout');
	}

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}
</script>

<nav class="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
	<div class="container mx-auto px-4">
		<div class="flex items-center justify-between h-16">
			<!-- Logo -->
			<div class="flex items-center gap-2">
				<div class="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
					<span class="text-white font-bold text-sm">AI</span>
				</div>
				<span class="font-bold text-gray-900">Voiceover</span>
			</div>

			<!-- Desktop Navigation -->
			<div class="hidden md:flex items-center space-x-8">
				<a href="/" class="text-gray-600 hover:text-gray-900 transition-colors">Home</a>
				<a href="/pricing" class="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
				<a href="#how-it-works" class="text-gray-600 hover:text-gray-900 transition-colors">How it Works</a>
				
				{#if currentUser}
					<!-- User dropdown -->
					<div class="relative group">
						<button class="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors">
							<User class="w-4 h-4 text-gray-600" />
							<span class="text-sm text-gray-700">{currentUser.email}</span>
							{#if currentUser.isAdmin}
								<span class="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full font-bold">ADMIN</span>
							{:else}
								<span class="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs rounded-full">{currentUser.plan?.toUpperCase()}</span>
							{/if}
						</button>
						
						<!-- Dropdown menu -->
						<div class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
							<div class="py-2">
								<a href="/profile" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
									<Settings class="w-4 h-4" />
									Profile & Settings
								</a>
								<a href="/billing" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
									<CreditCard class="w-4 h-4" />
									Billing & Usage
								</a>
								<hr class="my-2">
								<button on:click={logout} class="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left">
									<LogOut class="w-4 h-4" />
									Sign Out
								</button>
							</div>
						</div>
					</div>
				{:else}
					<button 
						on:click={showLogin}
						class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
					>
						Sign In
					</button>
				{/if}
			</div>

			<!-- Mobile menu button -->
			<div class="md:hidden">
				<button 
					on:click={toggleMobileMenu}
					class="p-2 text-gray-600 hover:text-gray-900 transition-colors"
				>
					{#if mobileMenuOpen}
						<X class="w-6 h-6" />
					{:else}
						<Menu class="w-6 h-6" />
					{/if}
				</button>
			</div>
		</div>

		<!-- Mobile menu -->
		{#if mobileMenuOpen}
			<div class="md:hidden border-t border-gray-200 py-4">
				<div class="space-y-4">
					<a href="/" class="block text-gray-600 hover:text-gray-900 transition-colors">Home</a>
					<a href="/pricing" class="block text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
					
					{#if currentUser}
						<div class="pt-4 border-t border-gray-200">
							<div class="flex items-center gap-2 mb-4">
								<User class="w-4 h-4 text-gray-600" />
								<span class="text-sm text-gray-700">{currentUser.email}</span>
								{#if currentUser.isAdmin}
									<span class="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full font-bold">ADMIN</span>
								{/if}
							</div>
							<a href="/profile" class="block text-gray-600 hover:text-gray-900 transition-colors mb-2">Profile</a>
							<a href="/billing" class="block text-gray-600 hover:text-gray-900 transition-colors mb-2">Billing</a>
							<button on:click={logout} class="block text-gray-600 hover:text-gray-900 transition-colors text-left">
								Sign Out
							</button>
						</div>
					{:else}
						<button 
							on:click={showLogin}
							class="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
						>
							Sign In
						</button>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</nav>
