<script lang="ts">
	import { onMount } from 'svelte';
	import { X } from 'lucide-svelte';

	export let show = false;
	export let processingTime = 180; // 3 minutes in seconds
	
	let timeRemaining = processingTime;
	let adLoaded = false;
	
	onMount(() => {
		if (show) {
			startCountdown();
			loadGoogleAds();
		}
	});
	
	function startCountdown() {
		const interval = setInterval(() => {
			timeRemaining--;
			if (timeRemaining <= 0) {
				clearInterval(interval);
			}
		}, 1000);
	}
	
	function loadGoogleAds() {
		// Load Google AdSense
		if (typeof window !== 'undefined') {
			const script = document.createElement('script');
			script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
			script.async = true;
			script.crossOrigin = 'anonymous';
			document.head.appendChild(script);
			
			script.onload = () => {
				adLoaded = true;
				// Initialize ads
				try {
					(window as any).adsbygoogle = (window as any).adsbygoogle || [];
					(window as any).adsbygoogle.push({});
				} catch (error) {
					console.log('Ad loading error:', error);
				}
			};
		}
	}
	
	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}
</script>

{#if show}
	<div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
		<!-- Header -->
		<div class="flex items-center justify-between mb-4">
			<div>
				<h3 class="font-semibold text-blue-900">While you wait...</h3>
				<p class="text-sm text-blue-700">Processing time remaining: {formatTime(timeRemaining)}</p>
			</div>
			<div class="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
				Free Tier
			</div>
		</div>
		
		<!-- Ad Space -->
		<div class="bg-white rounded-lg p-4 border border-gray-200 min-h-[200px] flex items-center justify-center">
			{#if adLoaded}
				<!-- Google AdSense Ad Unit -->
				<ins class="adsbygoogle"
					style="display:block"
					data-ad-client="ca-pub-YOUR-PUBLISHER-ID"
					data-ad-slot="YOUR-AD-SLOT"
					data-ad-format="auto"
					data-full-width-responsive="true">
				</ins>
			{:else}
				<!-- Placeholder while ad loads -->
				<div class="text-center text-gray-500">
					<div class="animate-pulse">
						<div class="h-4 bg-gray-200 rounded w-32 mx-auto mb-2"></div>
						<div class="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
					</div>
					<p class="text-xs mt-2">Loading...</p>
				</div>
			{/if}
		</div>
		
		<!-- Free tier benefits -->
		<div class="mt-4 text-xs text-blue-600 space-y-1">
			<p>🎧 <strong>Free unlimited audio generation</strong> supported by ads</p>
			<p>⚡ Want ad-free processing? <a href="/pricing" class="underline hover:text-blue-800">Upgrade to Basic (£9/month)</a></p>
		</div>
	</div>
{/if}
