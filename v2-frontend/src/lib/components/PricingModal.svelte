<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { X, Check, Crown, Zap, CreditCard } from 'lucide-svelte';

	export let show = false;
	
	const dispatch = createEventDispatcher();

	const plans = {
		free: {
			name: 'Free',
			price: '$0',
			period: '/month',
			generations: '3 generations',
			features: [
				'Basic Edge TTS voices',
				'5MB file limit',
				'Standard processing'
			],
			cta: 'Current Plan',
			popular: false
		},
		premium: {
			name: 'Premium',
			price: '$9.99',
			period: '/month',
			generations: 'Unlimited',
			features: [
				'All OpenAI premium voices',
				'10MB file limit',
				'Priority processing',
				'Advanced voice options',
				'Email support'
			],
			cta: 'Upgrade Now',
			popular: true
		},
		payperuse: {
			name: 'Pay-per-Use',
			price: '$0.02',
			period: '/generation',
			generations: 'Pay as you go',
			features: [
				'All voice options',
				'No monthly commitment',
				'Perfect for occasional use',
				'Same quality as Premium'
			],
			cta: 'Buy Credits',
			popular: false
		}
	};

	function selectPlan(planId: string) {
		dispatch('planSelected', { plan: planId });
		show = false;
	}

	function closeModal() {
		show = false;
	}
</script>

{#if show}
	<!-- Modal backdrop -->
	<div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-auto">
			<!-- Header -->
			<div class="p-6 border-b border-gray-200">
				<div class="flex items-center justify-between">
					<div>
						<h2 class="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
						<p class="text-gray-600 mt-1">Upgrade for premium voices and unlimited generations</p>
					</div>
					<button 
						on:click={closeModal}
						class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
					>
						<X class="w-5 h-5 text-gray-500" />
					</button>
				</div>
			</div>

			<!-- Pricing cards -->
			<div class="p-6">
				<div class="grid md:grid-cols-3 gap-6">
					{#each Object.entries(plans) as [planId, plan]}
						<div class="relative bg-white border-2 rounded-xl p-6 transition-all duration-200 hover:shadow-lg
							{plan.popular ? 'border-indigo-500 shadow-lg' : 'border-gray-200 hover:border-indigo-300'}">
							
							{#if plan.popular}
								<div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
									<span class="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
										Most Popular
									</span>
								</div>
							{/if}

							<!-- Plan header -->
							<div class="text-center mb-6">
								<div class="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br {plan.popular ? 'from-indigo-500 to-purple-600' : 'from-gray-400 to-gray-600'} flex items-center justify-center">
									{#if planId === 'premium'}
										<Crown class="w-6 h-6 text-white" />
									{:else if planId === 'payperuse'}
										<CreditCard class="w-6 h-6 text-white" />
									{:else}
										<Zap class="w-6 h-6 text-white" />
									{/if}
								</div>
								
								<h3 class="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
								<div class="mb-2">
									<span class="text-3xl font-bold text-gray-900">{plan.price}</span>
									<span class="text-gray-600">{plan.period}</span>
								</div>
								<p class="text-sm text-gray-600">{plan.generations}</p>
							</div>

							<!-- Features -->
							<ul class="space-y-3 mb-6">
								{#each plan.features as feature}
									<li class="flex items-start gap-2">
										<Check class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
										<span class="text-gray-700 text-sm">{feature}</span>
									</li>
								{/each}
							</ul>

							<!-- CTA Button -->
							<button
								on:click={() => selectPlan(planId)}
								disabled={planId === 'free'}
								class="w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200
									{plan.popular 
										? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg' 
										: planId === 'free'
										? 'bg-gray-100 text-gray-500 cursor-not-allowed'
										: 'bg-gray-900 text-white hover:bg-gray-800'
									}"
							>
								{plan.cta}
							</button>
						</div>
					{/each}
				</div>

				<!-- Additional info -->
				<div class="mt-8 text-center text-sm text-gray-600">
					<p>✅ Secure payments powered by Stripe</p>
					<p>✅ Cancel anytime • No hidden fees • 30-day money-back guarantee</p>
				</div>
			</div>
		</div>
	</div>
{/if}
