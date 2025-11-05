<script lang="ts">
	import { onMount } from 'svelte';
	import { Upload, Mic, Sparkles, FileText, Download, Play, Users, Clock, Shield, ArrowRight, Star, User } from 'lucide-svelte';
	import FileUpload from '$lib/components/FileUpload.svelte';
	import VoiceSelector from '$lib/components/VoiceSelector.svelte';
	import FileManager from '$lib/components/FileManager.svelte';
	import LoginModal from '$lib/components/LoginModal.svelte';

	let files: any[] = [];
	let selectedVoice = { type: 'edge', voice: 'en-GB-LibbyNeural' };
	let showApp = false;
	let showLogin = false;
	let currentUser: any = null;

	async function refreshFiles() {
		try {
			const response = await fetch('http://localhost:5000/files');
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

	function scrollToApp() {
		showApp = true;
		document.getElementById('app-section')?.scrollIntoView({ behavior: 'smooth' });
	}

	function handleAuthSuccess(event: CustomEvent) {
		currentUser = event.detail.user;
		console.log('Logged in as:', currentUser);
		
		if (currentUser.isAdmin) {
			console.log('🔑 Admin access granted!');
		}
	}

	function logout() {
		localStorage.removeItem('auth_token');
		currentUser = null;
	}

	// Check for existing auth token on load
	onMount(() => {
		const token = localStorage.getItem('auth_token');
		if (token) {
			// Verify token with API
			fetch('https://ai-voiceover-api.rss-reply.workers.dev/api/auth/me', {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			})
			.then(res => res.json())
			.then(data => {
				if (data.success) {
					currentUser = data.user;
				}
			})
			.catch(() => {
				localStorage.removeItem('auth_token');
			});
		}
		
		refreshFiles();
	});
</script>

<svelte:head>
	<title>AI Voiceover Generator - Turn Study Notes into Audio</title>
	<meta name="description" content="Convert CSV study materials into natural-sounding audio instantly. Perfect for learning on the go with premium AI voices." />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
	<!-- Hero Section -->
	<section class="relative overflow-hidden">
		<div class="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10"></div>
		<div class="relative container mx-auto px-4 py-20 text-center">
			<div class="max-w-4xl mx-auto">
				<h1 class="text-5xl md:text-7xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6 leading-tight">
					Turn your study notes into voiceovers — instantly
				</h1>
				
				<p class="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
					Upload a CSV and generate natural-sounding audio in seconds.<br>
					🎧 <strong>Study anywhere. Remember more.</strong>
				</p>
				
				<div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
					<button 
						on:click={scrollToApp}
						class="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
					>
						Get Started Free
						<ArrowRight class="w-5 h-5" />
					</button>
					<a 
						href="/pricing"
						class="px-8 py-4 border-2 border-indigo-600 text-indigo-600 text-lg font-semibold rounded-xl hover:bg-indigo-50 transition-all duration-200"
					>
						See Pricing
					</a>
				</div>
				
				
				<p class="text-sm text-gray-500">
					No account needed • Free voices included • Works on mobile
				</p>
			</div>
		</div>
	</section>

	<!-- How It Works -->
	<section class="py-20 bg-white/50">
		<div class="container mx-auto px-4">
			<div class="text-center mb-16">
				<h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
				<p class="text-xl text-gray-600">Three simple steps to transform your study materials</p>
			</div>
			
			<div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
				<div class="text-center">
					<div class="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
						<Upload class="w-10 h-10 text-white" />
					</div>
					<h3 class="text-xl font-semibold mb-3 text-gray-900">1. Upload your CSV</h3>
					<p class="text-gray-600 leading-relaxed">
						Front = questions, Back = answers. Drag & drop your study sets, flashcards, or course notes.
					</p>
				</div>
				
				<div class="text-center">
					<div class="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
						<Mic class="w-10 h-10 text-white" />
					</div>
					<h3 class="text-xl font-semibold mb-3 text-gray-900">2. Choose a voice</h3>
					<p class="text-gray-600 leading-relaxed">
						Select from free Edge TTS voices or premium OpenAI voices. UK, US accents available.
					</p>
				</div>
				
				<div class="text-center">
					<div class="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
						<Download class="w-10 h-10 text-white" />
					</div>
					<h3 class="text-xl font-semibold mb-3 text-gray-900">3. Download your audio</h3>
					<p class="text-gray-600 leading-relaxed">
						Get your MP3 instantly. Ready for study sessions, commutes, or offline learning.
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Why Different -->
	<section class="py-20">
		<div class="container mx-auto px-4">
			<div class="text-center mb-16">
				<h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
					Not just text-to-speech — your study companion
				</h2>
				<p class="text-xl text-gray-600">Built specifically for learning, not generic content</p>
			</div>
			
			<div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
				<div class="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
					<div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4">
						<FileText class="w-6 h-6 text-white" />
					</div>
					<h3 class="text-lg font-semibold mb-2 text-gray-900">🎓 Built for learning</h3>
					<p class="text-gray-600 text-sm">Convert study sets, flashcards, or course notes to audio effortlessly</p>
				</div>
				
				<div class="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
					<div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4">
						<Clock class="w-6 h-6 text-white" />
					</div>
					<h3 class="text-lg font-semibold mb-2 text-gray-900">⚡ Fast & private</h3>
					<p class="text-gray-600 text-sm">No storage, no tracking — instant download and complete privacy</p>
				</div>
				
				<div class="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
					<div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4">
						<Sparkles class="w-6 h-6 text-white" />
					</div>
					<h3 class="text-lg font-semibold mb-2 text-gray-900">🎙️ Premium voices</h3>
					<p class="text-gray-600 text-sm">Access high-quality, natural-sounding OpenAI and Edge TTS voices</p>
				</div>
				
				<div class="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
					<div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mb-4">
						<Users class="w-6 h-6 text-white" />
					</div>
					<h3 class="text-lg font-semibold mb-2 text-gray-900">🧠 Study smarter</h3>
					<p class="text-gray-600 text-sm">Reinforce learning while commuting, exercising, or going offline</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Feature Highlights -->
	<section class="py-20 bg-white/50">
		<div class="container mx-auto px-4">
			<div class="text-center mb-16">
				<h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Everything You Need</h2>
				<p class="text-xl text-gray-600">Powerful features designed for effective learning</p>
			</div>
			
			<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
				<div class="flex items-start gap-4">
					<div class="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
						<Upload class="w-5 h-5 text-indigo-600" />
					</div>
					<div>
						<h3 class="font-semibold text-gray-900 mb-2">Batch conversion from CSV</h3>
						<p class="text-gray-600 text-sm">Upload hundreds of Q&A pairs at once. Perfect for comprehensive study sets.</p>
					</div>
				</div>
				
				<div class="flex items-start gap-4">
					<div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
						<Sparkles class="w-5 h-5 text-purple-600" />
					</div>
					<div>
						<h3 class="font-semibold text-gray-900 mb-2">Premium voice library</h3>
						<p class="text-gray-600 text-sm">OpenAI's natural voices plus Microsoft Edge TTS. UK and US accents.</p>
					</div>
				</div>
				
				<div class="flex items-start gap-4">
					<div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
						<Download class="w-5 h-5 text-green-600" />
					</div>
					<div>
						<h3 class="font-semibold text-gray-900 mb-2">Download as MP3 instantly</h3>
						<p class="text-gray-600 text-sm">High-quality audio files ready for any device. No waiting, no queues.</p>
					</div>
				</div>
				
				<div class="flex items-start gap-4">
					<div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
						<Star class="w-5 h-5 text-blue-600" />
					</div>
					<div>
						<h3 class="font-semibold text-gray-900 mb-2">Free plan available</h3>
						<p class="text-gray-600 text-sm">Start with 10 minutes of free audio generation. No credit card required.</p>
					</div>
				</div>
				
				<div class="flex items-start gap-4">
					<div class="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
						<Clock class="w-5 h-5 text-yellow-600" />
					</div>
					<div>
						<h3 class="font-semibold text-gray-900 mb-2">Pay-as-you-go options</h3>
						<p class="text-gray-600 text-sm">Monthly plans or overage billing. Only pay for what you actually use.</p>
					</div>
				</div>
				
				<div class="flex items-start gap-4">
					<div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
						<Shield class="w-5 h-5 text-red-600" />
					</div>
					<div>
						<h3 class="font-semibold text-gray-900 mb-2">No setup required</h3>
						<p class="text-gray-600 text-sm">Works instantly in your browser. No downloads, no complex software.</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Pricing Preview -->
	<section class="py-20 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
		<div class="container mx-auto px-4 text-center">
			<h2 class="text-3xl md:text-4xl font-bold mb-4">Simple, Fair Pricing</h2>
			<p class="text-xl text-indigo-100 mb-12 max-w-2xl mx-auto">
				Start free, upgrade when you need more. No hidden fees, no surprises.
			</p>
			
			<div class="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
				<div class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
					<div class="text-2xl font-bold mb-2">Free</div>
					<div class="text-indigo-200 mb-4">10 minutes/month</div>
					<div class="text-sm text-indigo-100">Perfect for trying out</div>
				</div>
				
				<div class="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30 relative">
					<div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
						<span class="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold">
							MOST POPULAR
						</span>
					</div>
					<div class="text-2xl font-bold mb-2">£9/month</div>
					<div class="text-indigo-200 mb-4">100 minutes/month</div>
					<div class="text-sm text-indigo-100">Great for students</div>
				</div>
				
				<div class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
					<div class="text-2xl font-bold mb-2">£19/month</div>
					<div class="text-indigo-200 mb-4">300 minutes/month</div>
					<div class="text-sm text-indigo-100">For educators & creators</div>
				</div>
			</div>
			
			<div class="text-center">
				<a 
					href="/pricing"
					class="inline-flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
				>
					View Full Pricing
					<ArrowRight class="w-4 h-4" />
				</a>
			</div>
			
			<p class="text-sm text-indigo-200 mt-4">
				Save 15% with annual billing • Cancel anytime
			</p>
		</div>
	</section>

	<!-- Social Proof / Testimonials -->
	<section class="py-20">
		<div class="container mx-auto px-4">
			<div class="text-center mb-16">
				<h2 class="text-3xl font-bold text-gray-900 mb-4">Loved by Students & Educators</h2>
				<p class="text-gray-600">Early user feedback from our beta testing</p>
			</div>
			
			<div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
				<div class="bg-white rounded-2xl p-6 shadow-lg">
					<div class="flex items-center gap-1 mb-4">
						{#each Array(5) as _}
							<Star class="w-4 h-4 text-yellow-400 fill-current" />
						{/each}
					</div>
					<p class="text-gray-700 mb-4 italic">
						"It saves me hours each week — I can revise hands-free while walking to uni."
					</p>
					<div class="text-sm text-gray-600">
						<strong>Emma</strong>, Nursing Student
					</div>
				</div>
				
				<div class="bg-white rounded-2xl p-6 shadow-lg">
					<div class="flex items-center gap-1 mb-4">
						{#each Array(5) as _}
							<Star class="w-4 h-4 text-yellow-400 fill-current" />
						{/each}
					</div>
					<p class="text-gray-700 mb-4 italic">
						"The voice quality is incredible. My students love the audio study guides I create."
					</p>
					<div class="text-sm text-gray-600">
						<strong>Dr. James</strong>, University Lecturer
					</div>
				</div>
				
				<div class="bg-white rounded-2xl p-6 shadow-lg">
					<div class="flex items-center gap-1 mb-4">
						{#each Array(5) as _}
							<Star class="w-4 h-4 text-yellow-400 fill-current" />
						{/each}
					</div>
					<p class="text-gray-700 mb-4 italic">
						"So much faster than recording myself. The premium voices sound completely natural."
					</p>
					<div class="text-sm text-gray-600">
						<strong>Sarah</strong>, Online Course Creator
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- FAQ -->
	<section class="py-20 bg-white/50">
		<div class="container mx-auto px-4">
			<div class="text-center mb-16">
				<h2 class="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
			</div>
			
			<div class="max-w-3xl mx-auto space-y-6">
				<div class="bg-white rounded-xl p-6 shadow-sm">
					<h3 class="font-semibold text-gray-900 mb-2">How many files can I convert on the free plan?</h3>
					<p class="text-gray-600">The free plan includes 10 minutes of audio generation per month. This typically covers 20-30 study cards, depending on length.</p>
				</div>
				
				<div class="bg-white rounded-xl p-6 shadow-sm">
					<h3 class="font-semibold text-gray-900 mb-2">Can I use the audio commercially?</h3>
					<p class="text-gray-600">Pro plans include commercial use licenses. Free and Basic plans are for personal/educational use only.</p>
				</div>
				
				<div class="bg-white rounded-xl p-6 shadow-sm">
					<h3 class="font-semibold text-gray-900 mb-2">What happens if I go over my monthly minutes?</h3>
					<p class="text-gray-600">You can purchase additional minutes at discounted overage rates: £0.15/min (Free), £0.12/min (Basic), £0.10/min (Pro).</p>
				</div>
				
				<div class="bg-white rounded-xl p-6 shadow-sm">
					<h3 class="font-semibold text-gray-900 mb-2">What voices are included?</h3>
					<p class="text-gray-600">Free: Edge TTS voices (UK/US). Paid: All Edge TTS plus 6 premium OpenAI voices with natural intonation.</p>
				</div>
			</div>
		</div>
	</section>

	<!-- CTA Footer -->
	<section class="py-20 bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
		<div class="container mx-auto px-4 text-center">
			<h2 class="text-3xl md:text-4xl font-bold mb-4">
				Start turning your notes into audio today
			</h2>
			<p class="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
				Join thousands of students and educators who study smarter with AI-generated audio.
			</p>
			
			<button 
				on:click={scrollToApp}
				class="px-8 py-4 bg-white text-indigo-600 text-lg font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-lg"
			>
				Get Started Free — no signup needed
			</button>
			
			<div class="mt-12 flex justify-center space-x-8 text-sm text-indigo-200">
				<a href="/privacy" class="hover:text-white transition-colors">Privacy Policy</a>
				<a href="/terms" class="hover:text-white transition-colors">Terms</a>
				<a href="/contact" class="hover:text-white transition-colors">Contact</a>
				<a href="https://twitter.com/your-handle" class="hover:text-white transition-colors">Twitter</a>
			</div>
		</div>
	</section>

	<!-- App Section -->
	<section id="app-section" class="py-20 {showApp ? 'block' : 'hidden'}">
		<div class="container mx-auto px-4">
			<div class="text-center mb-12">
				<h2 class="text-3xl font-bold text-gray-900 mb-4">Try It Now</h2>
				<p class="text-gray-600">Upload a CSV file and generate your first audio in seconds</p>
			</div>
			
			<div class="max-w-6xl mx-auto">
				<div class="grid lg:grid-cols-2 gap-8">
					<!-- Left Column: Upload & Voice Selection -->
					<div class="space-y-6">
						<!-- File Upload -->
						<div class="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
							<h3 class="text-2xl font-semibold mb-4 flex items-center gap-3">
								<FileText class="w-6 h-6 text-indigo-600" />
								Upload Study Materials
							</h3>
							<FileUpload on:uploaded={handleFileUploaded} />
						</div>

						<!-- Voice Selection -->
						<div class="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
							<h3 class="text-2xl font-semibold mb-4 flex items-center gap-3">
								<Mic class="w-6 h-6 text-purple-600" />
								Choose Your Voice
							</h3>
							<VoiceSelector on:voiceSelected={handleVoiceSelected} />
						</div>
					</div>

					<!-- Right Column: File Management -->
					<div class="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
						<h3 class="text-2xl font-semibold mb-4 flex items-center gap-3">
							<FileText class="w-6 h-6 text-green-600" />
							File Management
						</h3>
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
		</div>
	</section>
</div>

<!-- Login Modal -->
<LoginModal bind:show={showLogin} on:authSuccess={handleAuthSuccess} />