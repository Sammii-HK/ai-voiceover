<script lang="ts">
	import { onMount } from 'svelte';
	import { Upload, Mic, Sparkles, FileText, Download, Play, Users, Clock, Shield, ArrowRight, Star, User, BookOpen, GraduationCap, Video, Headphones } from 'lucide-svelte';
	import FileUpload from '$lib/components/FileUpload.svelte';
	import VoiceSelector from '$lib/components/VoiceSelector.svelte';
	import FileManager from '$lib/components/FileManager.svelte';
	import LoginModal from '$lib/components/LoginModal.svelte';
	import InFeedAd from '$lib/components/InFeedAd.svelte';
	import RelaxedAd from '$lib/components/RelaxedAd.svelte';

	let files: any[] = [];
	let selectedVoice = { type: 'edge', voice: 'en-GB-LibbyNeural' };
	let showLogin = false;
	let currentUser: any = null;

	async function refreshFiles() {
		try {
			const response = await fetch('https://ai-voiceover-production.up.railway.app/api/files');
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

	<!-- Ad between sections (free users only) -->
	<InFeedAd adSlot="3715510611" userPlan={currentUser?.plan || 'free'} isAdmin={currentUser?.isAdmin || false} />

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
						<h3 class="font-semibold text-gray-900 mb-2">Simple monthly plans</h3>
						<p class="text-gray-600 text-sm">Clear pricing with no hidden fees. Upgrade or cancel anytime.</p>
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

	<!-- Ad before pricing (free users only) -->
	<InFeedAd adSlot="4981201262" adFormat="fluid" userPlan={currentUser?.plan || 'free'} isAdmin={currentUser?.isAdmin || false} />

	<!-- Pricing Preview -->
	<section class="py-20 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
		<div class="container mx-auto px-4 text-center">
			<h2 class="text-3xl md:text-4xl font-bold mb-4">Simple, Fair Pricing</h2>
			<p class="text-xl text-indigo-100 mb-12 max-w-2xl mx-auto">
				Start free, upgrade for premium voices and more minutes. Simple, transparent pricing.
			</p>
			
			<div class="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
				<div class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
					<div class="text-2xl font-bold mb-2">Free</div>
					<div class="text-indigo-200 mb-4">Unlimited* with ads</div>
					<div class="text-sm text-indigo-100">One at a time</div>
				</div>
				
				<div class="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30 relative">
					<div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
						<span class="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold">
							MOST POPULAR
						</span>
					</div>
					<div class="text-2xl font-bold mb-2">£9/month</div>
					<div class="text-indigo-200 mb-4">100 min + premium voices</div>
					<div class="text-sm text-indigo-100">Ad-free, 3 simultaneous</div>
				</div>
				
				<div class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
					<div class="text-2xl font-bold mb-2">£19/month</div>
					<div class="text-indigo-200 mb-4">300 min + commercial license</div>
					<div class="text-sm text-indigo-100">Teams, priority support</div>
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
	<section class="py-20">
		<div class="container mx-auto px-4">
			<div class="text-center mb-16">
				<h2 class="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
				<p class="text-xl text-gray-600">Everything you need to know about AI Voiceover Generator</p>
			</div>
			
			<div class="max-w-3xl mx-auto space-y-6">
				<div class="bg-white rounded-xl p-6 shadow-sm">
					<h3 class="font-semibold text-gray-900 mb-2">How many files can I convert on the free plan?</h3>
					<p class="text-gray-600">The free plan includes 10 minutes of audio generation per month. This typically covers 20-30 study cards, depending on length. You can generate unlimited files, but total audio time is limited to 10 minutes per month.</p>
				</div>
				
				<div class="bg-white rounded-xl p-6 shadow-sm">
					<h3 class="font-semibold text-gray-900 mb-2">Can I use the audio commercially?</h3>
					<p class="text-gray-600">Pro and Team plans include commercial use licenses. Free and Basic plans are for personal/educational use only. Commercial use includes selling products, courses, or any revenue-generating activity.</p>
				</div>
				
				<div class="bg-white rounded-xl p-6 shadow-sm">
					<h3 class="font-semibold text-gray-900 mb-2">What happens if I go over my monthly minutes?</h3>
					<p class="text-gray-600">Simply upgrade to the next plan for more minutes and better value. All plans include generous allowances for typical usage. Overage charges may apply on some plans - check your plan details for specifics.</p>
				</div>
				
				<div class="bg-white rounded-xl p-6 shadow-sm">
					<h3 class="font-semibold text-gray-900 mb-2">What voices are included?</h3>
					<p class="text-gray-600">Free: Edge TTS voices (UK/US accents). Paid: All Edge TTS plus 6 premium OpenAI voices with natural intonation and expression. Premium voices offer more realistic speech patterns and better pronunciation.</p>
				</div>

				<div class="bg-white rounded-xl p-6 shadow-sm">
					<h3 class="font-semibold text-gray-900 mb-2">What file formats do you support?</h3>
					<p class="text-gray-600">We accept CSV files with "Front" and "Back" columns. The output is always MP3 format, which is compatible with all devices and media players. CSV files should be UTF-8 encoded for best results.</p>
				</div>

				<div class="bg-white rounded-xl p-6 shadow-sm">
					<h3 class="font-semibold text-gray-900 mb-2">Is my data secure and private?</h3>
					<p class="text-gray-600">Yes, absolutely. We process your CSV files and immediately delete them after audio generation. We never store your content permanently. All data transmission is encrypted via HTTPS, and payment processing is handled securely by Stripe.</p>
				</div>

				<div class="bg-white rounded-xl p-6 shadow-sm">
					<h3 class="font-semibold text-gray-900 mb-2">Can I cancel my subscription anytime?</h3>
					<p class="text-gray-600">Yes, you can cancel your subscription at any time through your account settings. Your subscription will remain active until the end of your current billing period, and you'll continue to have access to all features until then.</p>
				</div>

				<div class="bg-white rounded-xl p-6 shadow-sm">
					<h3 class="font-semibold text-gray-900 mb-2">Do I need an account to use the service?</h3>
					<p class="text-gray-600">No account is required for basic functionality on the free plan. However, creating an account allows you to track your usage, access paid plans, and manage your subscription. Account creation is quick and free.</p>
				</div>

				<div class="bg-white rounded-xl p-6 shadow-sm">
					<h3 class="font-semibold text-gray-900 mb-2">How long does it take to generate audio?</h3>
					<p class="text-gray-600">Audio generation is typically instant or takes just a few seconds, depending on the length of your content. There are no queues or waiting times. Paid plans include priority processing for even faster results.</p>
				</div>

				<div class="bg-white rounded-xl p-6 shadow-sm">
					<h3 class="font-semibold text-gray-900 mb-2">Can I use this for languages other than English?</h3>
					<p class="text-gray-600">Currently, we support English voices with UK and US accents. We're working on adding support for additional languages. If you need a specific language, please contact us to let us know your requirements.</p>
				</div>
			</div>
		</div>
	</section>

	<!-- About Section -->
	<section class="py-20 bg-white/50">
		<div class="container mx-auto px-4">
			<div class="max-w-4xl mx-auto">
				<div class="text-center mb-12">
					<h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">About AI Voiceover Generator</h2>
					<p class="text-xl text-gray-600">Making learning more accessible through AI-powered audio</p>
				</div>
				
				<div class="bg-white rounded-2xl p-8 shadow-lg space-y-6">
					<div>
						<h3 class="text-xl font-semibold text-gray-900 mb-3">Our Mission</h3>
						<p class="text-gray-600">
							AI Voiceover Generator was created to help students and educators transform study materials into audio format effortlessly. We believe that learning should be flexible and accessible, allowing you to study anywhere, anytime.
						</p>
					</div>

					<div>
						<h3 class="text-xl font-semibold text-gray-900 mb-3">Why We Built This</h3>
						<p class="text-gray-600 mb-3">
							Traditional text-to-speech tools are generic and not optimized for educational content. We saw a need for a service specifically designed for study materials - one that understands the Q&A format of flashcards and study sets.
						</p>
						<p class="text-gray-600">
							Our platform combines the power of AI voice synthesis with an understanding of how students actually learn, creating audio that's perfect for active recall and spaced repetition techniques.
						</p>
					</div>

					<div>
						<h3 class="text-xl font-semibold text-gray-900 mb-3">Privacy & Security</h3>
						<p class="text-gray-600">
							Your privacy is paramount. We process your files and delete them immediately - we never store your content. All processing happens securely, and we use industry-standard encryption to protect your data. Learn more in our <a href="/privacy" class="text-indigo-600 hover:text-indigo-800">Privacy Policy</a>.
						</p>
					</div>

					<div>
						<h3 class="text-xl font-semibold text-gray-900 mb-3">Technology</h3>
						<p class="text-gray-600">
							We use cutting-edge AI voice synthesis technology from OpenAI and Microsoft Edge TTS to deliver natural-sounding audio. Our platform is built for speed and reliability, ensuring your audio is ready when you need it.
						</p>
					</div>
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

	<!-- How to Use Guide -->
	<section class="py-20 bg-white/50">
		<div class="container mx-auto px-4">
			<div class="text-center mb-16">
				<h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How to Use AI Voiceover Generator</h2>
				<p class="text-xl text-gray-600">A step-by-step guide to creating your first audio study guide</p>
			</div>
			
			<div class="max-w-4xl mx-auto space-y-8">
				<div class="bg-white rounded-2xl p-8 shadow-lg">
					<div class="flex items-start gap-6">
						<div class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-xl">
							1
						</div>
						<div>
							<h3 class="text-xl font-semibold text-gray-900 mb-3">Prepare Your CSV File</h3>
							<p class="text-gray-600 mb-3">
								Create a CSV file with two columns: "Front" and "Back". The Front column should contain your questions or prompts, and the Back column should contain the answers or explanations.
							</p>
							<p class="text-gray-600 text-sm bg-indigo-50 p-3 rounded-lg">
								<strong>Example:</strong> Front = "What is photosynthesis?", Back = "Photosynthesis is the process by which plants convert light energy into chemical energy."
							</p>
						</div>
					</div>
				</div>

				<div class="bg-white rounded-2xl p-8 shadow-lg">
					<div class="flex items-start gap-6">
						<div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-xl">
							2
						</div>
						<div>
							<h3 class="text-xl font-semibold text-gray-900 mb-3">Upload Your File</h3>
							<p class="text-gray-600 mb-3">
								Drag and drop your CSV file into the upload area, or click to browse and select it. The file will be processed immediately. Maximum file size is 5MB for free users, up to 50MB for Pro users.
							</p>
							<p class="text-gray-600 text-sm">
								Your file is processed securely and deleted immediately after audio generation. We never store your content.
							</p>
						</div>
					</div>
				</div>

				<div class="bg-white rounded-2xl p-8 shadow-lg">
					<div class="flex items-start gap-6">
						<div class="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-xl">
							3
						</div>
						<div>
							<h3 class="text-xl font-semibold text-gray-900 mb-3">Select Your Voice</h3>
							<p class="text-gray-600 mb-3">
								Choose from our library of voices. Free users can access Microsoft Edge TTS voices (UK and US accents). Paid users get access to premium OpenAI voices with more natural intonation and expression.
							</p>
							<p class="text-gray-600 text-sm">
								You can preview voices before generating to find the perfect match for your content.
							</p>
						</div>
					</div>
				</div>

				<div class="bg-white rounded-2xl p-8 shadow-lg">
					<div class="flex items-start gap-6">
						<div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-xl">
							4
						</div>
						<div>
							<h3 class="text-xl font-semibold text-gray-900 mb-3">Generate and Download</h3>
							<p class="text-gray-600 mb-3">
								Click the generate button and wait a few seconds. Your audio file will be ready as an MP3 that you can download immediately. The audio alternates between questions and answers, perfect for active recall practice.
							</p>
							<p class="text-gray-600 text-sm">
								Files are ready instantly - no waiting in queues or processing delays.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Use Cases -->
	<section class="py-20">
		<div class="container mx-auto px-4">
			<div class="text-center mb-16">
				<h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Perfect For</h2>
				<p class="text-xl text-gray-600">Who can benefit from AI Voiceover Generator</p>
			</div>
			
			<div class="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
				<div class="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
					<div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
						<GraduationCap class="w-8 h-8 text-white" />
					</div>
					<h3 class="text-xl font-semibold text-gray-900 mb-3 text-center">Students</h3>
					<p class="text-gray-600 text-center mb-4">
						Transform your flashcards and study notes into audio you can listen to while commuting, exercising, or doing other activities. Perfect for active recall and spaced repetition.
					</p>
					<ul class="text-sm text-gray-600 space-y-2">
						<li class="flex items-start gap-2">
							<span class="text-indigo-600 mt-1">•</span>
							<span>Review while walking to class</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="text-indigo-600 mt-1">•</span>
							<span>Study during commutes</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="text-indigo-600 mt-1">•</span>
							<span>Reinforce learning hands-free</span>
						</li>
					</ul>
				</div>

				<div class="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
					<div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
						<BookOpen class="w-8 h-8 text-white" />
					</div>
					<h3 class="text-xl font-semibold text-gray-900 mb-3 text-center">Educators</h3>
					<p class="text-gray-600 text-center mb-4">
						Create audio study guides and supplementary materials for your students. Help them learn more effectively with audio versions of course content.
					</p>
					<ul class="text-sm text-gray-600 space-y-2">
						<li class="flex items-start gap-2">
							<span class="text-indigo-600 mt-1">•</span>
							<span>Create audio study guides</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="text-indigo-600 mt-1">•</span>
							<span>Provide accessible learning materials</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="text-indigo-600 mt-1">•</span>
							<span>Support diverse learning styles</span>
						</li>
					</ul>
				</div>

				<div class="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
					<div class="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
						<Video class="w-8 h-8 text-white" />
					</div>
					<h3 class="text-xl font-semibold text-gray-900 mb-3 text-center">Content Creators</h3>
					<p class="text-gray-600 text-center mb-4">
						Generate professional voiceovers for online courses, tutorials, and educational content. Save time and money compared to hiring voice actors.
					</p>
					<ul class="text-sm text-gray-600 space-y-2">
						<li class="flex items-start gap-2">
							<span class="text-indigo-600 mt-1">•</span>
							<span>Create course narrations</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="text-indigo-600 mt-1">•</span>
							<span>Produce educational videos</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="text-indigo-600 mt-1">•</span>
							<span>Commercial license included (Pro+)</span>
						</li>
					</ul>
				</div>
			</div>
		</div>
	</section>

	<!-- App Section -->
	<section id="app-section" class="py-20 bg-white/50">
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

	<!-- Relaxed ad at bottom (free users only) -->
	<RelaxedAd userPlan={currentUser?.plan || 'free'} isAdmin={currentUser?.isAdmin || false} />
</div>

<!-- Login Modal -->
<LoginModal bind:show={showLogin} on:authSuccess={handleAuthSuccess} />