<script lang="ts">
	import { onMount } from 'svelte';
	import { Upload, Mic, Sparkles, FileText, Download } from 'lucide-svelte';
	import FileUpload from '$lib/components/FileUpload.svelte';
	import VoiceSelector from '$lib/components/VoiceSelector.svelte';
	import FileManager from '$lib/components/FileManager.svelte';

	let files: any[] = [];
	let selectedVoice = { type: 'edge', voice: 'en-GB-LibbyNeural' };

	async function refreshFiles() {
		try {
			const response = await fetch('https://ai-voiceover-api.rss-reply.workers.dev/api/files');
			const data = await response.json();
			files = data.files || [];
		} catch (error) {
			console.error('Failed to refresh files:', error);
		}
	}

	onMount(() => {
		refreshFiles();
	});

	function handleFileUploaded() {
		refreshFiles();
	}

	function handleVoiceSelected(event: CustomEvent) {
		selectedVoice = event.detail;
	}
</script>

<svelte:head>
	<title>AI Voiceover Generator - Transform Study Materials to Audio</title>
	<meta name="description" content="Convert your CSV study materials into natural-sounding audio using advanced AI voices. Perfect for learning on the go." />
</svelte:head>

<div class="max-w-6xl mx-auto">
	<!-- Hero Section -->
	<header class="text-center mb-12">
		<div class="relative">
			<div class="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-3xl rounded-full"></div>
			<div class="relative">
				<div class="flex justify-center mb-6">
					<div class="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl">
						<Mic class="w-12 h-12 text-white" />
					</div>
				</div>
				<h1 class="text-4xl md:text-6xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
					AI Voiceover Generator
				</h1>
				<p class="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
					Transform your study materials into natural-sounding audio with cutting-edge AI voices. 
					Perfect for learning while commuting, exercising, or multitasking.
				</p>
			</div>
		</div>
	</header>

	<!-- Features Grid -->
	<div class="grid md:grid-cols-3 gap-6 mb-12">
		<div class="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
			<div class="p-3 bg-indigo-100 rounded-xl w-fit mb-4">
				<Upload class="w-6 h-6 text-indigo-600" />
			</div>
			<h3 class="text-xl font-semibold mb-2">Easy Upload</h3>
			<p class="text-gray-600">Drag & drop your CSV files with questions and answers. Supports multiple file formats.</p>
		</div>
		
		<div class="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
			<div class="p-3 bg-purple-100 rounded-xl w-fit mb-4">
				<Sparkles class="w-6 h-6 text-purple-600" />
			</div>
			<h3 class="text-xl font-semibold mb-2">Premium Voices</h3>
			<p class="text-gray-600">Choose from natural-sounding Edge TTS voices or premium OpenAI voices for the best quality.</p>
		</div>
		
		<div class="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
			<div class="p-3 bg-green-100 rounded-xl w-fit mb-4">
				<Download class="w-6 h-6 text-green-600" />
			</div>
			<h3 class="text-xl font-semibold mb-2">Instant Download</h3>
			<p class="text-gray-600">Get your audio files instantly. No storage, no tracking - just clean, temporary processing.</p>
		</div>
	</div>

	<!-- Main App Interface -->
	<div class="grid lg:grid-cols-2 gap-8">
		<!-- Left Column: Upload & Voice Selection -->
		<div class="space-y-6">
			<!-- File Upload -->
			<div class="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
				<h2 class="text-2xl font-semibold mb-4 flex items-center gap-3">
					<FileText class="w-6 h-6 text-indigo-600" />
					Upload Study Materials
				</h2>
				<FileUpload on:uploaded={handleFileUploaded} />
			</div>

			<!-- Voice Selection -->
			<div class="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
				<h2 class="text-2xl font-semibold mb-4 flex items-center gap-3">
					<Mic class="w-6 h-6 text-purple-600" />
					Choose Your Voice
				</h2>
				<VoiceSelector on:voiceSelected={handleVoiceSelected} />
			</div>
		</div>

		<!-- Right Column: File Management -->
		<div class="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
			<h2 class="text-2xl font-semibold mb-4 flex items-center gap-3">
				<FileText class="w-6 h-6 text-green-600" />
				File Management
			</h2>
			<FileManager {files} {selectedVoice} on:filesChanged={refreshFiles} />
		</div>
	</div>

	<!-- Requirements -->
	<div class="mt-12 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6">
		<h3 class="text-lg font-semibold mb-4 text-gray-800">CSV Requirements</h3>
		<div class="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
			<div class="flex items-start gap-2">
				<div class="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
				<span>Must have "Front" and "Back" columns</span>
			</div>
			<div class="flex items-start gap-2">
				<div class="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
				<span>Front = Questions, Back = Answers</span>
			</div>
			<div class="flex items-start gap-2">
				<div class="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
				<span>UTF-8 encoding recommended</span>
			</div>
			<div class="flex items-start gap-2">
				<div class="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
				<span>Maximum file size: 10MB</span>
			</div>
		</div>
	</div>
</div>
