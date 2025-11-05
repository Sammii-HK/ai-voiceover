<script lang="ts">
	import { Check, Crown, Zap, Users, Star, ArrowLeft } from 'lucide-svelte';
	
	const plans = [
		{
			id: 'free',
			name: 'Free',
			price: '£0',
			period: '/month',
			description: 'Perfect for trying out the service',
			minutes: '10 minutes',
			popular: false,
			features: [
				'Up to 10 minutes of audio/month',
				'Basic Edge TTS voices (UK/US)',
				'5MB file limit',
				'Personal use only',
				'Standard processing'
			],
			cta: 'Get Started Free',
			color: 'gray'
		},
		{
			id: 'basic',
			name: 'Basic',
			price: '£7',
			period: '/month',
			priceAnnual: '£70/year',
			description: 'Great for students and casual learners',
			minutes: '60 minutes',
			popular: true,
			features: [
				'Up to 60 minutes of audio/month',
				'All Edge TTS + 3 OpenAI premium voices',
				'10MB file limit',
				'Personal & educational use',
				'Priority processing',
				'Email support'
			],
			cta: 'Start Basic Plan',
			color: 'indigo'
		},
		{
			id: 'pro',
			name: 'Pro',
			price: '£15',
			period: '/month',
			priceAnnual: '£150/year',
			description: 'For educators and content creators',
			minutes: '200 minutes',
			popular: false,
			features: [
				'Up to 200 minutes of audio/month',
				'All 6 OpenAI premium voices + Edge TTS',
				'25MB file limit',
				'Commercial use license included',
				'Priority processing',
				'Email support',
				'Usage analytics'
			],
			cta: 'Upgrade to Pro',
			color: 'purple'
		},
		{
			id: 'team',
			name: 'Team',
			price: '£35',
			period: '/month',
			priceAnnual: '£350/year',
			description: 'For teams and organizations',
			minutes: '500 minutes',
			popular: false,
			features: [
				'Up to 500 minutes of audio/month',
				'All premium voices + future releases',
				'50MB file limit',
				'Team dashboard (up to 5 users)',
				'Commercial use license',
				'Priority support',
				'Advanced usage analytics',
				'API access'
			],
			cta: 'Contact Sales',
			color: 'emerald'
		}
	];

	let billingCycle = 'monthly'; // 'monthly' or 'annual'
</script>

<svelte:head>
	<title>Pricing - AI Voiceover Generator</title>
	<meta name="description" content="Choose the perfect plan for your audio generation needs. From free to enterprise, we have options for every learner and educator." />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
	<div class="container mx-auto px-4 py-8">
		<!-- Back button -->
		<div class="mb-8">
			<a href="/" class="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors">
				<ArrowLeft class="w-4 h-4" />
				Back to App
			</a>
		</div>

		<!-- Header -->
		<div class="text-center mb-12">
			<h1 class="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
				Choose Your Plan
			</h1>
			<p class="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
				Transform your study materials into natural-sounding audio. 
				From students to educators, we have the perfect plan for your needs.
			</p>

			<!-- Billing cycle toggle -->
			<div class="inline-flex bg-gray-100 rounded-lg p-1 mb-8">
				<button 
					class="px-4 py-2 rounded-md font-medium transition-all {billingCycle === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}"
					on:click={() => billingCycle = 'monthly'}
				>
					Monthly
				</button>
				<button 
					class="px-4 py-2 rounded-md font-medium transition-all {billingCycle === 'annual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}"
					on:click={() => billingCycle = 'annual'}
				>
					Annual
					<span class="ml-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Save 15%</span>
				</button>
			</div>
		</div>

		<!-- Pricing cards -->
		<div class="grid lg:grid-cols-4 md:grid-cols-2 gap-6 max-w-7xl mx-auto mb-16">
			{#each plans as plan}
				{@const colorClasses = {
					gray: 'border-gray-200 hover:border-gray-300',
					indigo: 'border-indigo-500 shadow-lg ring-2 ring-indigo-200',
					purple: 'border-purple-500 hover:border-purple-600',
					emerald: 'border-emerald-500 hover:border-emerald-600'
				}}
				
				<div class="relative bg-white rounded-2xl p-6 border-2 transition-all duration-200 hover:shadow-lg {colorClasses[plan.color]}">
					
					{#if plan.popular}
						<div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
							<span class="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
								<Star class="w-3 h-3" />
								Most Popular
							</span>
						</div>
					{/if}

					<!-- Plan icon and name -->
					<div class="text-center mb-6">
						<div class="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br 
							{plan.color === 'indigo' ? 'from-indigo-500 to-purple-600' : 
							 plan.color === 'purple' ? 'from-purple-500 to-pink-600' :
							 plan.color === 'emerald' ? 'from-emerald-500 to-teal-600' :
							 'from-gray-400 to-gray-600'} 
							flex items-center justify-center">
							{#if plan.id === 'free'}
								<Zap class="w-6 h-6 text-white" />
							{:else if plan.id === 'team'}
								<Users class="w-6 h-6 text-white" />
							{:else}
								<Crown class="w-6 h-6 text-white" />
							{/if}
						</div>
						
						<h3 class="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
						<p class="text-sm text-gray-600 mb-4">{plan.description}</p>
						
						<!-- Pricing -->
						<div class="mb-2">
							{#if plan.id === 'free'}
								<span class="text-3xl font-bold text-gray-900">{plan.price}</span>
								<span class="text-gray-600">{plan.period}</span>
							{:else if billingCycle === 'annual' && plan.priceAnnual}
								<div>
									<span class="text-3xl font-bold text-gray-900">{plan.priceAnnual.split('/')[0]}</span>
									<span class="text-gray-600">/year</span>
									<div class="text-sm text-green-600 font-medium">Save 2+ months!</div>
								</div>
							{:else}
								<span class="text-3xl font-bold text-gray-900">{plan.price}</span>
								<span class="text-gray-600">{plan.period}</span>
							{/if}
						</div>
						
						<div class="text-sm font-medium text-indigo-600">{plan.minutes}</div>
					</div>

					<!-- Features -->
					<ul class="space-y-3 mb-8">
						{#each plan.features as feature}
							<li class="flex items-start gap-2">
								<Check class="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
								<span class="text-gray-700 text-sm">{feature}</span>
							</li>
						{/each}
					</ul>

					<!-- CTA Button -->
					<button
						class="w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200
							{plan.popular 
								? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg' 
								: plan.id === 'free'
								? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
								: 'bg-gray-900 text-white hover:bg-gray-800'
							}"
					>
						{plan.cta}
					</button>
				</div>
			{/each}
		</div>

		<!-- Pay-per-use section -->
		<div class="max-w-4xl mx-auto mb-16">
			<div class="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white text-center">
				<h3 class="text-2xl font-bold mb-4">Pay-per-Use Option</h3>
				<p class="text-indigo-100 mb-6 text-lg">
					No monthly commitment? Pay <strong>£0.15 per minute</strong> of generated audio.
					Perfect for occasional projects or testing premium voices.
				</p>
				<div class="grid md:grid-cols-3 gap-4 text-center">
					<div>
						<div class="text-2xl font-bold">£1.50</div>
						<div class="text-indigo-200">~10 minutes</div>
					</div>
					<div>
						<div class="text-2xl font-bold">£7.50</div>
						<div class="text-indigo-200">~50 minutes</div>
					</div>
					<div>
						<div class="text-2xl font-bold">£15</div>
						<div class="text-indigo-200">~100 minutes</div>
					</div>
				</div>
				<button class="mt-6 bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
					Buy Credits
				</button>
			</div>
		</div>

		<!-- FAQ / Features -->
		<div class="max-w-4xl mx-auto">
			<h2 class="text-2xl font-bold text-center mb-8 text-gray-900">What's Included</h2>
			
			<div class="grid md:grid-cols-2 gap-8">
				<div class="space-y-4">
					<h3 class="text-lg font-semibold text-gray-900">🎙️ Voice Quality</h3>
					<ul class="space-y-2 text-gray-600">
						<li>• <strong>Edge TTS:</strong> Natural UK/US voices (free tier)</li>
						<li>• <strong>OpenAI Premium:</strong> Ultra-realistic voices (paid tiers)</li>
						<li>• <strong>Multiple accents:</strong> British, American options</li>
						<li>• <strong>Optimized pacing:</strong> Perfect for study materials</li>
					</ul>
				</div>
				
				<div class="space-y-4">
					<h3 class="text-lg font-semibold text-gray-900">⚡ Technical Features</h3>
					<ul class="space-y-2 text-gray-600">
						<li>• <strong>Global edge deployment:</strong> Sub-50ms response times</li>
						<li>• <strong>No storage:</strong> Files processed and deleted instantly</li>
						<li>• <strong>CSV format:</strong> Front = Questions, Back = Answers</li>
						<li>• <strong>Batch processing:</strong> Multiple study sets at once</li>
					</ul>
				</div>
			</div>

			<!-- Enterprise -->
			<div class="mt-12 bg-gray-50 rounded-2xl p-8 text-center">
				<h3 class="text-2xl font-bold text-gray-900 mb-4">Enterprise & Custom Solutions</h3>
				<p class="text-gray-600 mb-6 max-w-2xl mx-auto">
					Need higher limits, custom voices, or white-label solutions? 
					We offer enterprise packages with unlimited usage, API access, and custom voice training.
				</p>
				<button class="bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors">
					Contact Sales
				</button>
			</div>

			<!-- Guarantee -->
			<div class="mt-12 text-center">
				<div class="inline-flex items-center gap-2 text-sm text-gray-600">
					<Check class="w-4 h-4 text-green-500" />
					<span>30-day money-back guarantee</span>
					<span class="mx-2">•</span>
					<Check class="w-4 h-4 text-green-500" />
					<span>Cancel anytime</span>
					<span class="mx-2">•</span>
					<Check class="w-4 h-4 text-green-500" />
					<span>Secure payments by Stripe</span>
				</div>
			</div>
		</div>
	</div>
</div>
