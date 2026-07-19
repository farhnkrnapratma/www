<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';

  let email = $state('');
  let password = $state('');
  let isSubmitting = $state(false);
  let errorMessage = $state<string | null>(null);
  let showPassword = $state(false);
  let errors = $state({ email: '', password: '' });

  onMount(async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      window.location.href = '/admin';
    }
  });

  function sanitizeInput(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  function validate() {
    const emailErr = email.trim() === '' ? 'Email is required.' : '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailFormatErr =
      !emailErr && !emailRegex.test(email.trim()) ? 'Please enter a valid email address.' : '';
    const passwordErr = password.trim() === '' ? 'Password is required.' : '';

    errors = {
      email: emailErr || emailFormatErr,
      password: passwordErr,
    };

    return !errors.email && !errors.password;
  }

  async function handleLogin(e: SubmitEvent) {
    e.preventDefault();
    errors = { email: '', password: '' };
    if (!validate()) return;

    isSubmitting = true;
    errorMessage = null;

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: sanitizeInput(email.trim()),
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

<main class="flex min-h-[calc(100vh-3.75rem)] flex-col items-center justify-center pt-15 font-sans">
  <div class="flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-10">
    <div
      class="rounded-2xl border border-adwaita-border bg-adwaita-card/45 p-6 shadow-xs backdrop-blur-lg transition-colors duration-300">
      <div class="mb-6 flex flex-col items-center text-center select-none">
        <div class="flex items-center gap-2">
          <span class="material-symbols-rounded text-2xl text-adwaita-accent select-none"
            >code</span>
          <h1 class="text-xl font-bold text-adwaita-text">Console</h1>
        </div>
        <p class="mt-1 text-xs text-adwaita-subtitle">Sign in to manage your blog posts</p>
      </div>

      {#if errorMessage}
        <div
          class="mb-4 rounded-lg border border-palette-coral/30 bg-palette-coral/10 p-3 text-xs font-semibold text-palette-coral">
          {errorMessage}
        </div>
      {/if}

      <form
        novalidate
        onsubmit={handleLogin}
        class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label
            for="login-email"
            class="text-xs font-bold text-adwaita-label select-none">
            Email <span
              aria-hidden="true"
              class="text-adwaita-error">*</span
            ><span class="sr-only">(required)</span>
          </label>
          <input
            type="email"
            id="login-email"
            placeholder="admin@email.com"
            bind:value={email}
            oninput={() => (errors.email = '')}
            aria-required="true"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'login-email-error' : ''}
            class="w-full rounded-lg border border-adwaita-border bg-adwaita-bg px-3 py-2 text-sm text-adwaita-text transition-colors"
            class:border-adwaita-error={errors.email} />
          {#if errors.email}
            <p
              id="login-email-error"
              role="alert"
              class="mt-1 text-xs font-medium text-adwaita-error">
              {errors.email}
            </p>
          {/if}
        </div>
        <div class="flex flex-col gap-1.5">
          <label
            for="login-pass"
            class="text-xs font-bold text-adwaita-label select-none">
            Password <span
              aria-hidden="true"
              class="text-adwaita-error">*</span
            ><span class="sr-only">(required)</span>
          </label>
          <div class="relative flex items-center">
            <input
              type={showPassword ? 'text' : 'password'}
              id="login-pass"
              placeholder="••••••••"
              bind:value={password}
              oninput={() => (errors.password = '')}
              aria-required="true"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'login-pass-error' : ''}
              class="w-full rounded-lg border border-adwaita-border bg-adwaita-bg py-2 pr-10 pl-3 text-sm text-adwaita-text transition-colors"
              class:border-adwaita-error={errors.password} />
            <button
              type="button"
              onclick={() => (showPassword = !showPassword)}
              class="absolute right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-adwaita-label transition-colors select-none hover:text-adwaita-text focus:outline-2 focus:outline-adwaita-accent"
              aria-label={showPassword ? 'Hide password' : 'Show password'}>
              <span class="material-symbols-rounded text-base">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
          {#if errors.password}
            <p
              id="login-pass-error"
              role="alert"
              class="mt-1 text-xs font-medium text-adwaita-error">
              {errors.password}
            </p>
          {/if}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          class="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-adwaita-focus px-5 py-2.5 text-sm font-semibold text-white transition-colors select-none hover:bg-adwaita-focus/90 disabled:opacity-55">
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>

    <div class="mt-4 text-center select-none">
      <a
        href="/"
        class="text-xs font-semibold text-adwaita-subtitle hover:underline">
        Back to Home
      </a>
    </div>
  </div>

  <footer class="w-full px-6 py-8 text-center text-xs text-adwaita-subtitle/75 select-none">
    <p>&copy; {new Date().getFullYear()} Farhan Kurnia Pratama. All rights reserved</p>
  </footer>
</main>
