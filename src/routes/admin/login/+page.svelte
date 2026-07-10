<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';

  let email = $state('');
  let password = $state('');
  let isSubmitting = $state(false);
  let errorMessage = $state<string | null>(null);
  let showPassword = $state(false);

  onMount(async () => {
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
        password: password.trim(),
      });

      if (error) {
        throw error;
      }

      window.location.href = '/admin';
    } catch (err) {
      const error = err as Error;
      console.error('Login failed:', error);
      errorMessage = error.message || 'Invalid email or password.';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<main class="pt-15 font-sans flex flex-col items-center min-h-[calc(100vh-3.75rem)] justify-center">
  <div class="w-full max-w-sm px-6 flex-1 flex flex-col justify-center py-10">
    <div class="p-6 bg-adwaita-card/45 border border-adwaita-border rounded-2xl shadow-xs backdrop-blur-lg transition-colors duration-300">
      <div class="text-center mb-6 select-none flex flex-col items-center">
        <div class="flex items-center gap-2">
          <span class="material-symbols-rounded text-adwaita-blue text-2xl select-none">code</span>
          <h1 class="text-xl font-bold text-adwaita-text">Console</h1>
        </div>
        <p class="text-xs text-adwaita-subtitle mt-1">Sign in to manage your blog posts</p>
      </div>

      {#if errorMessage}
        <div
          class="p-3 mb-4 rounded-lg text-xs font-semibold bg-palette-coral/10 text-palette-coral border border-palette-coral/30">
          {errorMessage}
        </div>
      {/if}

      <form
        onsubmit={handleLogin}
        class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label
            for="login-email"
            class="text-xs font-bold text-adwaita-subtitle select-none">Email</label>
          <input
            type="email"
            id="login-email"
            required
            placeholder="admin@email.com"
            bind:value={email}
            class="w-full px-3 py-2 text-sm bg-adwaita-bg border border-adwaita-border rounded-lg text-adwaita-text focus:outline-none focus:border-adwaita-blue transition-colors" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label
            for="login-pass"
            class="text-xs font-bold text-adwaita-subtitle select-none">Password</label>
          <div class="relative flex items-center">
            <input
              type={showPassword ? 'text' : 'password'}
              id="login-pass"
              required
              placeholder="••••••••"
              bind:value={password}
              class="w-full pl-3 pr-10 py-2 text-sm bg-adwaita-bg border border-adwaita-border rounded-lg text-adwaita-text focus:outline-none focus:border-adwaita-blue transition-colors" />
            <button
              type="button"
              onclick={() => showPassword = !showPassword}
              class="absolute right-3 text-adwaita-subtitle hover:text-adwaita-text transition-colors flex items-center justify-center cursor-pointer select-none"
              aria-label={showPassword ? 'Hide password' : 'Show password'}>
              <span class="material-symbols-rounded text-base">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          class="w-full inline-flex items-center justify-center gap-2 cursor-pointer rounded-lg bg-adwaita-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-adwaita-blue-hover focus:outline-none disabled:opacity-55 select-none">
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>

    <div class="text-center mt-4 select-none">
      <a
        href="/"
        class="text-xs font-semibold text-adwaita-subtitle hover:underline">
        Back to Home
      </a>
    </div>
  </div>

  <footer
    class="w-full px-6 py-8 text-center text-xs text-adwaita-subtitle/75 select-none">
    <p>&copy; {new Date().getFullYear()} Farhan Kurnia Pratama. All rights reserved</p>
  </footer>
</main>
