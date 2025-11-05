<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Upload, FileText, X } from 'lucide-svelte';

	const dispatch = createEventDispatcher();

	let dragOver = false;
	let uploading = false;
	let uploadStatus = '';
	let fileInput: HTMLInputElement;

	async function uploadFile(file: File) {
		const formData = new FormData();
		formData.append('file', file);

		uploading = true;
		uploadStatus = 'Uploading...';

		try {
			const response = await fetch('https://ai-voiceover-production.up.railway.app/upload', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (result.success) {
				uploadStatus = `✅ ${result.original_name} uploaded successfully!`;
				dispatch('uploaded', result);
				
				// Clear status after 3 seconds
				setTimeout(() => {
					uploadStatus = '';
				}, 3000);
			} else {
				uploadStatus = `❌ ${result.error}`;
			}
		} catch (error) {
			uploadStatus = `❌ Upload failed: ${error.message}`;
		} finally {
			uploading = false;
		}
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		dragOver = false;

		const files = event.dataTransfer?.files;
		if (files && files.length > 0) {
			uploadFile(files[0]);
		}
	}

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target.files;
		if (files && files.length > 0) {
			uploadFile(files[0]);
		}
		// Clear the input
		target.value = '';
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		dragOver = true;
	}

	function handleDragLeave() {
		dragOver = false;
	}
</script>

<div class="space-y-4">
	<!-- Upload Area -->
	<div
		class="relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer
			{dragOver ? 'border-indigo-500 bg-indigo-50 scale-105' : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50'}"
		on:drop={handleDrop}
		on:dragover={handleDragOver}
		on:dragleave={handleDragLeave}
		on:click={() => fileInput.click()}
		role="button"
		tabindex="0"
		on:keydown={(e) => e.key === 'Enter' && fileInput.click()}
	>
		<input
			bind:this={fileInput}
			type="file"
			accept=".csv"
			class="hidden"
			on:change={handleFileSelect}
		/>

		<div class="space-y-4">
			<div class="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
				{#if uploading}
					<div class="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full"></div>
				{:else}
					<Upload class="w-8 h-8 text-white" />
				{/if}
			</div>

			<div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">
					{uploading ? 'Uploading...' : 'Upload Your CSV File'}
				</h3>
				<p class="text-gray-600">
					Drag & drop your study set CSV here, or click to browse
				</p>
			</div>

			{#if !uploading}
				<button
					type="button"
					class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
				>
					<FileText class="w-4 h-4" />
					Choose File
				</button>
			{/if}
		</div>
	</div>

	<!-- Upload Status -->
	{#if uploadStatus}
		<div class="p-4 rounded-lg {uploadStatus.includes('❌') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}">
			<div class="flex items-center justify-between">
				<span class="font-medium">{uploadStatus}</span>
				{#if !uploading}
					<button
						on:click={() => uploadStatus = ''}
						class="text-current opacity-50 hover:opacity-100"
					>
						<X class="w-4 h-4" />
					</button>
				{/if}
			</div>
		</div>
	{/if}
</div>
