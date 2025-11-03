<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Volume2, Crown, Zap } from 'lucide-svelte';

	const dispatch = createEventDispatcher();

	let selectedType = 'edge';
	let selectedVoice = 'en-GB-LibbyNeural';

	const edgeVoices = {
		'en-GB-LibbyNeural': 'UK Female - Libby (Natural)',
		'en-GB-SoniaNeural': 'UK Female - Sonia (Professional)',
		'en-GB-RyanNeural': 'UK Male - Ryan',
		'en-US-JennyNeural': 'US Female - Jenny',
		'en-US-GuyNeural': 'US Male - Guy'
	};

	const openaiVoices = {
		'alloy': 'Neutral - Alloy (Clean, Apple-like)',
		'echo': 'Male - Echo',
		'fable': 'British Accent - Fable',
		'onyx': 'Deep Male - Onyx',
		'nova': 'Young Female - Nova (Most Natural)',
		'shimmer': 'Soft Female - Shimmer'
	};

	// Check if OpenAI is available (this would come from your backend)
	let hasOpenAI = true; // You'll need to fetch this from your API

	function selectVoiceType(type: string) {
		selectedType = type;
		// Reset to first voice of selected type
		if (type === 'edge') {
			selectedVoice = Object.keys(edgeVoices)[0];
		} else {
			selectedVoice = Object.keys(openaiVoices)[0];
		}
		dispatchSelection();
	}

	function selectVoice(voice: string) {
		selectedVoice = voice;
		dispatchSelection();
	}

	function dispatchSelection() {
		dispatch('voiceSelected', {
			type: selectedType,
			voice: selectedVoice
		});
	}

	// Dispatch initial selection
	dispatchSelection();
</script>

<div class="space-y-6">
	<!-- Voice Type Tabs -->
	<div class="flex rounded-xl overflow-hidden shadow-sm border border-gray-200">
		<button
			class="flex-1 px-6 py-4 font-medium transition-all duration-200 flex items-center justify-center gap-2
				{selectedType === 'edge' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}"
			on:click={() => selectVoiceType('edge')}
		>
			<Zap class="w-4 h-4" />
			Free Voices
			<span class="px-2 py-1 text-xs rounded-full bg-green-500 text-white font-bold">FREE</span>
		</button>
		
		<button
			class="flex-1 px-6 py-4 font-medium transition-all duration-200 flex items-center justify-center gap-2
				{selectedType === 'openai' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}
				{!hasOpenAI ? 'opacity-50 cursor-not-allowed' : ''}"
			on:click={() => hasOpenAI && selectVoiceType('openai')}
			disabled={!hasOpenAI}
		>
			<Crown class="w-4 h-4" />
			Premium Voices
			<span class="px-2 py-1 text-xs rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold">PREMIUM</span>
		</button>
	</div>

	<!-- Voice Options -->
	<div class="space-y-3">
		{#if selectedType === 'edge'}
			{#each Object.entries(edgeVoices) as [voiceId, description]}
				<label class="flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
					{selectedVoice === voiceId ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50'}">
					<input
						type="radio"
						name="voice"
						value={voiceId}
						bind:group={selectedVoice}
						on:change={() => selectVoice(voiceId)}
						class="sr-only"
					/>
					<div class="flex items-center gap-3 flex-1">
						<div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
							<Volume2 class="w-5 h-5 text-white" />
						</div>
						<div>
							<div class="font-semibold text-gray-900">{description}</div>
							<div class="text-sm text-gray-600">Microsoft Edge TTS</div>
						</div>
					</div>
					{#if selectedVoice === voiceId}
						<div class="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
							<div class="w-2 h-2 bg-white rounded-full"></div>
						</div>
					{/if}
				</label>
			{/each}
		{:else if hasOpenAI}
			{#each Object.entries(openaiVoices) as [voiceId, description]}
				<label class="flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
					{selectedVoice === voiceId ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'}">
					<input
						type="radio"
						name="voice"
						value={voiceId}
						bind:group={selectedVoice}
						on:change={() => selectVoice(voiceId)}
						class="sr-only"
					/>
					<div class="flex items-center gap-3 flex-1">
						<div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
							<Crown class="w-5 h-5 text-white" />
						</div>
						<div>
							<div class="font-semibold text-gray-900">{description}</div>
							<div class="text-sm text-gray-600">OpenAI TTS HD</div>
						</div>
					</div>
					{#if selectedVoice === voiceId}
						<div class="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
							<div class="w-2 h-2 bg-white rounded-full"></div>
						</div>
					{/if}
				</label>
			{/each}
		{:else}
			<div class="text-center py-8 px-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
				<Crown class="w-12 h-12 text-gray-400 mx-auto mb-4" />
				<h3 class="text-lg font-semibold text-gray-900 mb-2">Premium Voices Unavailable</h3>
				<p class="text-gray-600 mb-4">OpenAI API key not configured</p>
				<p class="text-sm text-gray-500">Add your API key to the .env file to unlock natural-sounding voices</p>
			</div>
		{/if}
	</div>
</div>
