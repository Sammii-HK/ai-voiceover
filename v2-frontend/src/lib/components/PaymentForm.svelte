<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { loadStripe } from '@stripe/stripe-js';
	import { CreditCard, Lock, X } from 'lucide-svelte';

	export let show = false;
	export let clientSecret = '';
	export let amount = 0;
	export let description = '';

	const dispatch = createEventDispatcher();

	let stripe: any = null;
	let elements: any = null;
	let cardElement: any = null;
	let processing = false;
	let error = '';
	let cardContainer: HTMLElement;

	const STRIPE_PUBLIC_KEY = 'pk_test_your_publishable_key_here'; // Replace with your key

	onMount(async () => {
		if (typeof window !== 'undefined') {
			stripe = await loadStripe(STRIPE_PUBLIC_KEY);
		}
	});

	$: if (show && stripe && !elements && cardContainer) {
		setupStripeElements();
	}

	function setupStripeElements() {
		elements = stripe.elements({
			appearance: {
				theme: 'stripe',
				variables: {
					colorPrimary: '#6366f1',
					colorBackground: '#ffffff',
					colorText: '#374151',
					colorDanger: '#ef4444',
					fontFamily: 'system-ui, sans-serif',
					borderRadius: '8px'
				}
			}
		});

		cardElement = elements.create('payment', {
			layout: 'tabs'
		});

		cardElement.mount(cardContainer);

		cardElement.on('change', (event: any) => {
			error = event.error ? event.error.message : '';
		});
	}

	async function handleSubmit() {
		if (!stripe || !elements || !clientSecret) {
			error = 'Payment system not ready';
			return;
		}

		processing = true;
		error = '';

		try {
			const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
				elements,
				confirmParams: {
					return_url: window.location.origin + '/payment/success'
				},
				redirect: 'if_required'
			});

			if (stripeError) {
				error = stripeError.message;
			} else if (paymentIntent && paymentIntent.status === 'succeeded') {
				dispatch('paymentSuccess', {
					paymentIntent: paymentIntent.id,
					amount
				});
				show = false;
			}
		} catch (e) {
			error = 'Payment failed. Please try again.';
		} finally {
			processing = false;
		}
	}

	function closeModal() {
		show = false;
		error = '';
	}
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
							<CreditCard class="w-5 h-5 text-white" />
						</div>
						<div>
							<h3 class="text-lg font-semibold text-gray-900">Complete Payment</h3>
							<p class="text-sm text-gray-600">{description}</p>
						</div>
					</div>
					<button 
						on:click={closeModal}
						class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
					>
						<X class="w-5 h-5 text-gray-500" />
					</button>
				</div>
			</div>

			<!-- Payment form -->
			<form on:submit|preventDefault={handleSubmit} class="p-6">
				<!-- Amount display -->
				<div class="mb-6 p-4 bg-gray-50 rounded-lg">
					<div class="flex items-center justify-between">
						<span class="text-gray-700">Total Amount:</span>
						<span class="text-xl font-bold text-gray-900">
							${(amount / 100).toFixed(2)}
						</span>
					</div>
				</div>

				<!-- Stripe Elements -->
				<div class="mb-6">
					<label class="block text-sm font-medium text-gray-700 mb-2">
						Payment Information
					</label>
					<div bind:this={cardContainer} class="border border-gray-300 rounded-lg p-3"></div>
				</div>

				<!-- Error display -->
				{#if error}
					<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
						<p class="text-red-700 text-sm">{error}</p>
					</div>
				{/if}

				<!-- Security notice -->
				<div class="mb-6 flex items-center gap-2 text-sm text-gray-600">
					<Lock class="w-4 h-4" />
					<span>Secured by Stripe. Your payment information is encrypted.</span>
				</div>

				<!-- Submit button -->
				<button
					type="submit"
					disabled={processing || !clientSecret}
					class="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold
						hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed
						transition-all duration-200 flex items-center justify-center gap-2"
				>
					{#if processing}
						<div class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
						Processing...
					{:else}
						<Lock class="w-4 h-4" />
						Pay ${(amount / 100).toFixed(2)}
					{/if}
				</button>

				<!-- Cancel button -->
				<button
					type="button"
					on:click={closeModal}
					disabled={processing}
					class="w-full mt-3 py-2 px-4 text-gray-600 hover:text-gray-800 transition-colors"
				>
					Cancel
				</button>
			</form>
		</div>
	</div>
{/if}
