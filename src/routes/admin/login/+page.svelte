<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';

  let email = $state('');
  let password = $state('');
  let isSubmitting = $state(false);
  let errorMessage = $state<string | null>(null);
  let showPassword = $state(false);
  let errors = $state({ email: '', password: '' });
  let valid = $state({ email: false, password: false });

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

  function debounce<T extends unknown[]>(cb: (...args: T) => void, ms: number) {
    let timer: ReturnType<typeof setTimeout>;
    return (...args: T) => {
      clearTimeout(timer);
      timer = setTimeout(() => cb(...args), ms);
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateEmailField = debounce(() => {
    if (email.trim() === '') {
      errors.email = '';
      valid.email = false;
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
      valid.email = false;
    } else {
      errors.email = '';
      valid.email = true;
    }
  }, 300);

  const validatePasswordField = debounce(() => {
    if (password.trim() === '') {
      errors.password = '';
      valid.password = false;
    } else {
      errors.password = '';
      valid.password = true;
    }
  }, 300);

  function validate() {
    const emailErr = email.trim() === '' ? 'Email is required.' : '';
    const emailFormatErr =
      !emailErr && !emailRegex.test(email.trim()) ? 'Please enter a valid email address.' : '';
    const passwordErr = password.trim() === '' ? 'Password is required.' : '';

    errors = { email: emailErr || emailFormatErr, password: passwordErr };
    if (errors.email) valid.email = false;
    if (errors.password) valid.password = false;

    return !errors.email && !errors.password;
  }

  async function handleLogin(e: SubmitEvent) {
    e.preventDefault();
    if (!validate()) return;

    isSubmitting = true;
    errorMessage = null;

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: sanitizeInput(email.trim()),
        password: password.trim(),
      });

      if (error) throw error;
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

      <form novalidate onsubmit={handleLogin} class="flex flex-col gap-4">
        <!-- Email -->
        <div class="flex flex-col gap-1.5">
          <label for="login-email" class="text-xs font-bold text-adwaita-label select-none">
            Email <span aria-hidden="true" class="text-adwaita-error">*</span
            ><span class="sr-only">(required)</span>
          </label>
          <input
            type="email"
            id="login-email"
            placeholder="Enter your email address"
            bind:value={email}
            oninput={() => { errors.email = ''; valid.email = false; validateEmailField(); }}
            aria-required="true"
            aria-invalid={!!errors.email}
            aria-describedby="login-email-fb"
            class="w-full rounded-lg border border-adwaita-border bg-adwaita-bg px-3 py-2 text-sm text-adwaita-text transition-colors"
            class:border-adwaita-error={errors.email}
            class:input-valid={valid.email} />
          <!-- Fixed-height feedback area — never shifts layout -->
          <div id="login-email-fb" aria-live="polite" class="h-4 text-xs font-medium leading-none">
            {#if errors.email}
              <span class="flex items-center gap-1 text-adwaita-error">
                <i class="bi bi-exclamation-circle-fill"></i>{errors.email}
              </span>
            {:else if valid.email}
              <span class="flex items-center gap-1 text-adwaita-accent">
                <i class="bi bi-check-circle-fill"></i>Looks good
              </span>
            {/if}
          </div>
        </div>

        <!-- Password -->
        <div class="flex flex-col gap-1.5">
          <label for="login-pass" class="text-xs font-bold text-adwaita-label select-none">
            Password <span aria-hidden="true" class="text-adwaita-error">*</span
            ><span class="sr-only">(required)</span>
          </label>
          <div class="relative flex items-center">
            <input
              type={showPassword ? 'text' : 'password'}
              id="login-pass"
              placeholder="••••••••"
              bind:value={password}
              oninput={() => { errors.password = ''; valid.password = false; validatePasswordField(); }}
              aria-required="true"
              aria-invalid={!!errors.password}
              aria-describedby="login-pass-fb"
              class="w-full rounded-lg border border-adwaita-border bg-adwaita-bg py-2 pr-10 pl-3 text-sm text-adwaita-text transition-colors"
              class:border-adwaita-error={errors.password}
              class:input-valid={valid.password} />
            <button
              type="button"
              onclick={() => (showPassword = !showPassword)}
              class="absolute right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-adwaita-label transition-colors select-none hover:text-adwaita-text"
              aria-label={showPassword ? 'Hide password' : 'Show password'}>
              <span class="material-symbols-rounded text-base">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
          <!-- Fixed-height feedback area -->
          <div id="login-pass-fb" aria-live="polite" class="h-4 text-xs font-medium leading-none">
            {#if errors.password}
              <span class="flex items-center gap-1 text-adwaita-error">
                <i class="bi bi-exclamation-circle-fill"></i>{errors.password}
              </span>
            {:else if valid.password}
              <span class="flex items-center gap-1 text-adwaita-accent">
                <i class="bi bi-check-circle-fill"></i>Looks good
              </span>
            {/if}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          class="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-adwaita-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors select-none hover:bg-adwaita-accent-hover disabled:opacity-55">
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>

    <div class="mt-4 text-center select-none">
      <a href="/" class="text-xs font-semibold text-adwaita-subtitle hover:underline">
        Back to Home
      </a>
    </div>
  </div>

  <footer class="w-full px-6 py-8 text-center text-xs text-adwaita-subtitle/75 select-none font-sans">
    <p>&copy; {new Date().getFullYear()} Farhan Kurnia Pratama. All rights reserved</p>
  </footer>
</main>
