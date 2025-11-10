<script lang="ts">
	import { onMount } from 'svelte';

	export let userPlan: string = 'free';
	export let isAdmin: boolean = false;
	
	let adContainer: HTMLElement;
	let adLoaded = false;
	let adminShowAds = false;

	onMount(() => {
		if (shouldShowAd()) {
			loadAd();
		}
	});

	function shouldShowAd(): boolean {
		return userPlan === 'free' || (isAdmin && adminShowAds);
	}

	function loadAd() {
		if (typeof window !== 'undefined' && adContainer) {
			try {
				(window as any).adsbygoogle = (window as any).adsbygoogle || [];
				(window as any).adsbygoogle.push({});
				adLoaded = true;
			} catch (error) {
				console.log('Relaxed ad error:', error);
			}
		}
	}
</script>

{#if shouldShowAd()}
	<div class="my-12 flex justify-center">
		<div class="max-w-4xl w-full">
			<!-- Admin toggle -->
			{#if isAdmin}
				<div class="mb-2 text-center">
					<button 
						on:click={() => { adminShowAds = !adminShowAds; loadAd(); }}
						class="text-xs bg-yellow-200 text-yellow-900 px-2 py-1 rounded"
					>
						🔑 {adminShowAds ? 'Hide' : 'Show'} Relaxed Ad
					</button>
				</div>
			{/if}

			<!-- Relaxed ad container -->
			<div class="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 p-6">
				<div class="text-center text-xs text-gray-500 mb-4">Advertisement</div>
				
				<ins class="adsbygoogle"
					bind:this={adContainer}
					style="display:block"
					data-ad-format="autorelaxed"
					data-ad-client="ca-pub-2232955058223462"
					data-ad-slot="3668119593">
				</ins>
			</div>
		</div>
	</div>
{/if}
