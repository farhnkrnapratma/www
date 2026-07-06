<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';

	let email = $state('');
	let password = $state('');
	let isSubmitting = $state(false);
	let errorMessage = $state<string | null>(null);

	onMount(async () => {
		// If user is already logged in, redirect to admin dashboard
		const { data } = await supabase.auth.getSession();
		if (data.session) {
			window.location.href = '/admin';
		}
	});

	async function handleLogin(e: SubmitEvent) {
		e.preventDefault();
		if (!email.trim() || !password.trim()) return;

		isSubmitting = true;
		errorMessage = null;

		try {
			const { error } = await supabase.auth.signInWithPassword({
				email: email.trim(),
				password: password.trim()
			});

			if (error) {
				throw error;
			}

			// Redirect to admin dashboard
			window.location.href = '/admin';
		} catch (err: any) {
			console.error('Login failed:', err);
			errorMessage = err.message || 'Invalid email or password.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div
	class="fixed top-0 left-0 z-50 flex h-8 w-full items-center justify-center border-b border-amber-200 bg-amber-100/75 text-xs font-bold text-amber-800 backdrop-blur-md transition-colors duration-300 dark:border-amber-900/30 dark:bg-amber-950/45 dark:text-amber-300 select-none"
>
	<i class="bi bi-exclamation-triangle-fill" style="margin-right: 6px;" aria-hidden="true"></i>
	Development Preview
</div>

<main class="pt-[92px] font-sans flex items-center justify-center min-h-[calc(100vh-5.75rem)]">
	<div class="w-full max-w-sm px-6">
		<div class="boxed-list p-6 bg-zinc-950/[0.01]">
			<div class="text-center mb-6">
				<h1 class="text-xl font-bold text-adwaita-text">CMS Admin Login</h1>
				<p class="text-xs text-adwaita-subtitle mt-1">Sign in to manage your blog posts</p>
			</div>

			{#if errorMessage}
				<div
					class="p-3 mb-4 rounded-lg text-xs font-semibold bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30"
				>
					{errorMessage}
				</div>
			{/if}

			<form onsubmit={handleLogin} class="flex flex-col gap-4">
				<div class="flex flex-col gap-1.5">
					<label for="login-email" class="text-xs font-bold text-adwaita-subtitle"
						>Email Address</label
					>
					<input
						type="email"
						id="login-email"
						required
						placeholder="admin@email.com"
						bind:value={email}
						class="w-full px-3 py-2 text-sm bg-adwaita-bg border border-adwaita-border rounded-lg text-adwaita-text placeholder:text-adwaita-subtitle/70 focus:outline-none focus:border-adwaita-blue transition-colors"
					/>
				</div>
				<div class="flex flex-col gap-1.5">
					<label for="login-pass" class="text-xs font-bold text-adwaita-subtitle">Password</label>
					<input
						type="password"
						id="login-pass"
						required
						placeholder="••••••••"
						bind:value={password}
						class="w-full px-3 py-2 text-sm bg-adwaita-bg border border-adwaita-border rounded-lg text-adwaita-text placeholder:text-adwaita-subtitle/70 focus:outline-none focus:border-adwaita-blue transition-colors"
					/>
				</div>

				<button
					type="submit"
					disabled={isSubmitting}
					class="w-full inline-flex items-center justify-center gap-2 cursor-pointer rounded-lg bg-adwaita-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#009c8f] focus:outline-none disabled:opacity-55"
				>
					{#if isSubmitting}
						<i class="bi bi-hourglass-split text-xs animate-spin" aria-hidden="true"></i>
						Signing in...
					{:else}
						<i class="bi bi-box-arrow-in-right text-sm" aria-hidden="true"></i>
						Sign In
					{/if}
				</button>
			</form>
		</div>

		<div class="text-center mt-4">
			<a href="/" class="text-xs font-semibold text-adwaita-subtitle hover:underline">
				Back to Home
			</a>
		</div>
	</div>
</main>
