<script lang="ts">
	import { onMount } from 'svelte';

	export let adSlot: string;
	export let adFormat: string = 'auto';
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
				console.log('In-feed ad error:', error);
			}
		}
	}
</script>

{#if shouldShowAd()}
	<div class="my-8 flex justify-center">
		<div class="max-w-md w-full">
			<!-- Admin toggle -->
			{#if isAdmin}
				<div class="mb-2 text-center">
					<button 
						on:click={() => { adminShowAds = !adminShowAds; loadAd(); }}
						class="text-xs bg-yellow-200 text-yellow-900 px-2 py-1 rounded"
					>
						🔑 {adminShowAds ? 'Hide' : 'Show'} In-Feed Ad
					</button>
				</div>
			{/if}

			<!-- Ad container -->
			<div class="bg-white rounded-lg border border-gray-200 p-4 min-h-[200px] flex items-center justify-center">
				{#if adLoaded}
					<ins class="adsbygoogle"
						bind:this={adContainer}
						style="display:block"
						data-ad-client="ca-pub-2232955058223462"
						data-ad-slot={adSlot}
						data-ad-format={adFormat}
						data-ad-layout={adFormat === 'fluid' ? 'in-article' : null}
						data-full-width-responsive="true">
					</ins>
				{:else}
					<div class="text-center text-gray-400">
						<div class="text-sm">Advertisement</div>
						<div class="text-xs mt-1">Supporting free unlimited access</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
