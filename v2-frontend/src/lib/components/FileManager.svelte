<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { FileText, Trash2, Download, Play, RefreshCw, Clock, Loader } from 'lucide-svelte';
	import ProgressModal from './ProgressModal.svelte';

	export let files: any[] = [];
	export let selectedVoice: { type: string; voice: string };

	const dispatch = createEventDispatcher();

	let processingFiles = new Set<string>();
	let showProgress = false;
	let progressData = {
		progress: 0,
		status: 'processing',
		currentStep: '',
		totalSteps: 0,
		completedSteps: 0,
		estimatedTime: '',
		fileName: ''
	};

	function formatFileSize(bytes: number): string {
		return (bytes / 1024).toFixed(1) + ' KB';
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'ready': return 'bg-green-100 text-green-800';
			case 'processing': return 'bg-yellow-100 text-yellow-800';
			case 'completed': return 'bg-blue-100 text-blue-800';
			default: return 'bg-red-100 text-red-800';
		}
	}

	function getStatusIcon(status: string) {
		switch (status) {
			case 'ready': return Play;
			case 'processing': return RefreshCw;
			case 'completed': return Download;
			default: return Clock;
		}
	}

	async function generateAudio(filename: string) {
		try {
			processingFiles.add(filename);
			processingFiles = processingFiles; // Trigger reactivity

			// Show progress modal
			progressData = {
				progress: 0,
				status: 'processing',
				currentStep: 'Starting audio generation...',
				totalSteps: 10,
				completedSteps: 0,
				estimatedTime: '2-3 minutes',
				fileName: filename
			};
			showProgress = true;

			const response = await fetch(`${API_BASE}/generate/${filename}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					voice_type: selectedVoice.type,
					voice: selectedVoice.voice
				})
			});

			const result = await response.json();

			if (result.success) {
				// Update progress
				progressData.currentStep = 'Processing audio with AI voices...';
				progressData.progress = 10;
				progressData = progressData;
				
				// Start polling for status
				pollStatus(filename);
			} else {
				progressData.status = 'error';
				progressData.currentStep = `Error: ${result.error}`;
				progressData = progressData;
				
				processingFiles.delete(filename);
				processingFiles = processingFiles;
			}
		} catch (error) {
			progressData.status = 'error';
			progressData.currentStep = `Error: ${error.message}`;
			progressData = progressData;
			
			processingFiles.delete(filename);
			processingFiles = processingFiles;
		}
	}

	async function pollStatus(filename: string) {
		let pollCount = 0;
		const maxPolls = 150; // 5 minutes max (150 * 2s = 300s)
		
		const checkStatus = async () => {
			try {
				const response = await fetch(`${API_BASE}/status/${filename}`);
				const status = await response.json();

				pollCount++;
				
				// Update progress based on time elapsed
				const progressPercent = Math.min(90, (pollCount / maxPolls) * 100);
				progressData.progress = progressPercent;
				progressData.completedSteps = Math.floor(pollCount / 15);
				progressData.currentStep = `Processing audio... (${Math.floor(pollCount * 2 / 60)}:${(pollCount * 2 % 60).toString().padStart(2, '0')})`;
				progressData = progressData;

				if (status.status === 'completed') {
					progressData.progress = 100;
					progressData.status = 'completed';
					progressData.currentStep = 'Audio generation complete!';
					progressData = progressData;
					
					processingFiles.delete(filename);
					processingFiles = processingFiles;
					dispatch('filesChanged');
					
					// Auto-download after brief delay
					setTimeout(() => {
						downloadFile(filename);
						showProgress = false;
					}, 2000);
					
				} else if (status.status === 'error') {
					progressData.status = 'error';
					progressData.currentStep = `Generation failed: ${status.error}`;
					progressData = progressData;
					
					processingFiles.delete(filename);
					processingFiles = processingFiles;
					dispatch('filesChanged');
				} else if (pollCount < maxPolls) {
					// Continue polling
					setTimeout(checkStatus, 2000);
				} else {
					// Timeout
					progressData.status = 'error';
					progressData.currentStep = 'Generation timed out. Please try again.';
					progressData = progressData;
					
					processingFiles.delete(filename);
					processingFiles = processingFiles;
				}
			} catch (error) {
				console.error('Status check failed:', error);
				if (pollCount < maxPolls) {
					setTimeout(checkStatus, 2000);
				}
			}
		};

		checkStatus();
	}

	async function downloadFile(filename: string) {
		try {
			const response = await fetch(`${API_BASE}/download/${filename}`);
			if (response.ok) {
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = response.headers.get('Content-Disposition')?.split('filename=')[1] || 'audio.mp3';
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);

				// Refresh files after download
				setTimeout(() => dispatch('filesChanged'), 1000);
			} else {
				const error = await response.json();
				alert(`Download failed: ${error.error}`);
			}
		} catch (error) {
			alert(`Download failed: ${error.message}`);
		}
	}

	async function deleteFile(filename: string) {
		if (!confirm('Are you sure you want to delete this file?')) {
			return;
		}

		try {
			const response = await fetch(`${API_BASE}/delete/${filename}`, {
				method: 'POST'
			});

			const result = await response.json();

			if (result.success) {
				dispatch('filesChanged');
			} else {
				alert(`Delete failed: ${result.error}`);
			}
		} catch (error) {
			alert(`Delete failed: ${error.message}`);
		}
	}

	async function refreshFiles() {
		dispatch('filesChanged');
	}

	// API base URL - Use working Railway Flask backend
	const API_BASE = 'https://ai-voiceover-production.up.railway.app';
</script>

<div class="space-y-4">
	<!-- Header with refresh button -->
	<div class="flex items-center justify-between">
		<div class="text-sm text-gray-600">
			{files.length} file{files.length !== 1 ? 's' : ''} uploaded
		</div>
		<button
			on:click={refreshFiles}
			class="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
		>
			<RefreshCw class="w-4 h-4" />
			Refresh
		</button>
	</div>

	<!-- Files List -->
	<div class="space-y-3 max-h-96 overflow-y-auto">
		{#each files as file}
			{@const isProcessing = processingFiles.has(file.name) || file.status === 'processing'}
			{@const isCompleted = file.status === 'completed' || (typeof file.status === 'object' && file.status.status === 'completed')}
			{@const StatusIcon = getStatusIcon(isProcessing ? 'processing' : file.status)}
			
			<div class="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
				<!-- File Icon -->
				<div class="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
					<FileText class="w-5 h-5 text-gray-600" />
				</div>

				<!-- File Info -->
				<div class="flex-1 min-w-0">
					<div class="font-medium text-gray-900 truncate">
						{file.name.includes('_') ? file.name.split('_').slice(1).join('_') : file.name}
					</div>
					<div class="text-sm text-gray-500">
						{formatFileSize(file.size)} • Uploaded {file.uploaded}
					</div>
				</div>

				<!-- Status Badge -->
				<div class="flex items-center gap-2">
					<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium {getStatusColor(isProcessing ? 'processing' : file.status)}">
						<svelte:component 
							this={StatusIcon} 
							class="w-3 h-3 {isProcessing ? 'animate-spin' : ''}" 
						/>
						{#if isProcessing}
							Processing
						{:else if isCompleted}
							Ready
						{:else if file.status.startsWith && file.status.startsWith('error')}
							Error
						{:else}
							Ready
						{/if}
					</span>
				</div>

				<!-- Single Smart Action Button -->
				<div class="flex items-center gap-2 flex-shrink-0">
					{#if isCompleted}
						<!-- Download button -->
						<button
							on:click={() => downloadFile(file.name)}
							class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors shadow-sm"
						>
							<Download class="w-4 h-4" />
							Download MP3
						</button>
					{:else if isProcessing}
						<!-- Processing button -->
						<button
							disabled
							class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg cursor-not-allowed"
						>
							<Loader class="w-4 h-4 animate-spin" />
							Generating...
						</button>
					{:else}
						<!-- Generate button -->
						<button
							on:click={() => generateAudio(file.name)}
							class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
						>
							<Play class="w-4 h-4" />
							Generate Audio
						</button>
					{/if}

					<!-- Delete button (always available when not processing) -->
					{#if !isProcessing}
						<button
							on:click={() => deleteFile(file.name)}
							class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
							title="Delete file"
						>
							<Trash2 class="w-4 h-4" />
						</button>
					{/if}
				</div>
			</div>
		{:else}
			<div class="text-center py-12 text-gray-500">
				<FileText class="w-12 h-12 mx-auto mb-4 text-gray-300" />
				<h3 class="text-lg font-medium text-gray-900 mb-2">No files uploaded</h3>
				<p class="text-gray-600">Upload a CSV file to get started with audio generation.</p>
			</div>
		{/each}
	</div>
</div>

<!-- Progress Modal -->
<ProgressModal 
	bind:show={showProgress}
	progress={progressData.progress}
	status={progressData.status}
	currentStep={progressData.currentStep}
	totalSteps={progressData.totalSteps}
	completedSteps={progressData.completedSteps}
	estimatedTime={progressData.estimatedTime}
	fileName={progressData.fileName}
/>
