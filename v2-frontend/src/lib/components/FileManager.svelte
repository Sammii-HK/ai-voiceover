<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { FileText, Trash2, Download, Play, RefreshCw, Clock } from 'lucide-svelte';

	export let files: any[] = [];
	export let selectedVoice: { type: string; voice: string };

	const dispatch = createEventDispatcher();

	let processingFiles = new Set<string>();

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

			const response = await fetch(`/api/generate/${filename}`, {
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
				// Start polling for status
				pollStatus(filename);
			} else {
				alert(`Error: ${result.error}`);
				processingFiles.delete(filename);
				processingFiles = processingFiles;
			}
		} catch (error) {
			alert(`Error: ${error.message}`);
			processingFiles.delete(filename);
			processingFiles = processingFiles;
		}
	}

	async function pollStatus(filename: string) {
		const checkStatus = async () => {
			try {
				const response = await fetch(`/api/status/${filename}`);
				const status = await response.json();

				if (status.status === 'completed') {
					processingFiles.delete(filename);
					processingFiles = processingFiles;
					dispatch('filesChanged');
					
					// Auto-download
					setTimeout(() => downloadFile(filename), 1000);
				} else if (status.status === 'error') {
					processingFiles.delete(filename);
					processingFiles = processingFiles;
					alert(`Generation failed: ${status.error}`);
					dispatch('filesChanged');
				} else {
					// Continue polling
					setTimeout(checkStatus, 2000);
				}
			} catch (error) {
				console.error('Status check failed:', error);
				setTimeout(checkStatus, 2000);
			}
		};

		checkStatus();
	}

	async function downloadFile(filename: string) {
		try {
			const response = await fetch(`/api/download/${filename}`);
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
			const response = await fetch(`/api/delete/${filename}`, {
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

				<!-- Actions -->
				<div class="flex items-center gap-2 flex-shrink-0">
					{#if isCompleted}
						<button
							on:click={() => downloadFile(file.name)}
							class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
						>
							<Download class="w-4 h-4" />
							Download
						</button>
					{:else if !isProcessing}
						<button
							on:click={() => generateAudio(file.name)}
							class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
						>
							<Play class="w-4 h-4" />
							Generate
						</button>
					{:else}
						<button
							disabled
							class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed"
						>
							<RefreshCw class="w-4 h-4 animate-spin" />
							Processing
						</button>
					{/if}

					{#if !isProcessing}
						<button
							on:click={() => deleteFile(file.name)}
							class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
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
