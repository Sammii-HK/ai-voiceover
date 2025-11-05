<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { X, Clock, CheckCircle, AlertCircle, Loader } from 'lucide-svelte';

	export let show = false;
	export let progress = 0; // 0-100
	export let status = 'processing'; // 'processing', 'completed', 'error'
	export let currentStep = '';
	export let totalSteps = 0;
	export let completedSteps = 0;
	export let estimatedTime = '';
	export let fileName = '';

	const dispatch = createEventDispatcher();

	function closeModal() {
		show = false;
		dispatch('close');
	}

	$: progressPercent = Math.min(100, Math.max(0, progress));
	$: statusColor = status === 'completed' ? 'green' : status === 'error' ? 'red' : 'indigo';
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
							{#if status === 'processing'}
								<Loader class="w-5 h-5 text-white animate-spin" />
							{:else if status === 'completed'}
								<CheckCircle class="w-5 h-5 text-white" />
							{:else}
								<AlertCircle class="w-5 h-5 text-white" />
							{/if}
						</div>
						<div>
							<h3 class="text-lg font-semibold text-gray-900">
								{#if status === 'processing'}
									Generating Audio
								{:else if status === 'completed'}
									Generation Complete!
								{:else}
									Generation Failed
								{/if}
							</h3>
							<p class="text-sm text-gray-600">{fileName}</p>
						</div>
					</div>
					<button 
						on:click={closeModal}
						class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
						title={status === 'processing' ? 'Close (processing continues in background)' : 'Close'}
					>
						<X class="w-5 h-5 text-gray-500" />
					</button>
				</div>
			</div>

			<!-- Progress content -->
			<div class="p-6">
				<!-- Progress bar -->
				<div class="mb-6">
					<div class="flex items-center justify-between mb-2">
						<span class="text-sm font-medium text-gray-700">Progress</span>
						<span class="text-sm text-gray-500">{progressPercent.toFixed(0)}%</span>
					</div>
					
					<div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
						<div 
							class="h-full bg-gradient-to-r transition-all duration-500 ease-out
								{statusColor === 'green' ? 'from-green-500 to-emerald-500' :
								 statusColor === 'red' ? 'from-red-500 to-pink-500' :
								 'from-indigo-500 to-purple-500'}"
							style="width: {progressPercent}%"
						></div>
					</div>
				</div>

				<!-- Current step -->
				<div class="mb-6">
					<div class="flex items-center gap-2 mb-2">
						<Clock class="w-4 h-4 text-gray-500" />
						<span class="text-sm font-medium text-gray-700">Current Step</span>
					</div>
					<p class="text-gray-600">{currentStep}</p>
				</div>

				<!-- Stats -->
				<div class="grid grid-cols-2 gap-4 mb-6">
					<div class="bg-gray-50 rounded-lg p-3">
						<div class="text-sm text-gray-500">Completed</div>
						<div class="text-lg font-semibold text-gray-900">{completedSteps}/{totalSteps}</div>
					</div>
					
					<div class="bg-gray-50 rounded-lg p-3">
						<div class="text-sm text-gray-500">Est. Time</div>
						<div class="text-lg font-semibold text-gray-900">{estimatedTime}</div>
					</div>
				</div>

				<!-- Status message -->
				{#if status === 'processing'}
					<div class="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
						<p class="text-indigo-700 text-sm">
							🎧 Generating high-quality audio with premium AI voices. 
							This may take 2-5 minutes for best results.
						</p>
					</div>
				{:else if status === 'completed'}
					<div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
						<p class="text-green-700 text-sm font-medium">
							✅ Audio generation completed successfully!
						</p>
					</div>
					
					<button
						on:click={closeModal}
						class="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-200"
					>
						Continue
					</button>
				{:else if status === 'error'}
					<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
						<p class="text-red-700 text-sm">
							❌ Generation failed. Please try again or contact support if the issue persists.
						</p>
					</div>
					
					<button
						on:click={closeModal}
						class="w-full py-3 px-4 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-all duration-200"
					>
						Close
					</button>
				{/if}

				<!-- Processing tips -->
				{#if status === 'processing'}
					<div class="mt-4 text-xs text-gray-500 space-y-1">
						<p>💡 Tip: Keep this tab open for best results</p>
						<p>⚡ Using premium voices for natural-sounding audio</p>
						<p>🌍 Processing on global edge network</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
