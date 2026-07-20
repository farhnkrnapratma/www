<script lang="ts">
  import { onMount } from 'svelte';
  import { autoResize, ConfirmationDialog } from '$lib';
  import { isNameReserved } from '$lib/nameValidator';

  const name = 'Farhan Kurnia Pratama';
  const desc =
    'Security-focused Software Engineer with expertise in Linux/Unix, AI, and Open-Source Software, dedicated to building reliable, maintainable, and privacy-centric systems.';
  const footerNavItems = [
    { label: 'Home', url: '/' },
    { label: 'Projects', url: '/#projects' },
    { label: 'Blogs', url: '/#blogs' },
    { label: 'CV', url: '/#cv' },
    { label: 'Funding', url: '/#funding' },
    { label: 'Contacts', url: '/#contacts' },
  ];

  type Theme = 'auto' | 'dark' | 'light';
  let theme = $state<Theme>('auto');
  let themeDropdownOpen = $state(false);

  let formName = $state('');
  let formEmail = $state('');
  let formUrl = $state('');
  let formMessage = $state('');

  let formErrors = $state({ name: '', email: '', url: '', message: '' });
  let formValid = $state({ name: false, email: false, url: false, message: false });

  let showSubmitDialog = $state(false);
  let feedbackFormElement = $state<HTMLFormElement | null>(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function applyTheme(newTheme: Theme) {
    theme = newTheme;
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
      const isDark =
        newTheme === 'dark' ||
        (newTheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }

  onMount(() => {
    const saved = localStorage.getItem('theme') as Theme;
    theme = saved || 'auto';

    if (typeof document !== 'undefined' && document.referrer) {
      const refUrl = new URL(document.referrer);
      if (refUrl.origin === window.location.origin) {
        formUrl = refUrl.pathname;
      }
    }
  });

  function debounce<T extends unknown[]>(cb: (...args: T) => void, ms: number) {
    let timer: ReturnType<typeof setTimeout>;
    return (...args: T) => {
      clearTimeout(timer);
      timer = setTimeout(() => cb(...args), ms);
    };
  }

  const validateName = debounce(() => {
    const val = formName.trim();
    if (val === '') {
      formErrors.name = '';
      formValid.name = false;
    } else if (isNameReserved(val)) {
      formErrors.name = 'This name cannot be used. Please use another name.';
      formValid.name = false;
    } else {
      formErrors.name = '';
      formValid.name = true;
    }
  }, 300);

  const validateEmail = debounce(() => {
    const val = formEmail.trim();
    if (val === '') {
      formErrors.email = '';
      formValid.email = false;
    } else if (!emailRegex.test(val)) {
      formErrors.email = 'Please enter a valid email address.';
      formValid.email = false;
    } else {
      formErrors.email = '';
      formValid.email = true;
    }
  }, 300);

  const validateUrl = debounce(() => {
    const val = formUrl.trim();
    if (val === '') {
      formErrors.url = '';
      formValid.url = false;
    } else {
      formErrors.url = '';
      formValid.url = true;
    }
  }, 300);

  const validateMessage = debounce(() => {
    const val = formMessage.trim();
    if (val === '') {
      formErrors.message = '';
      formValid.message = false;
    } else {
      formErrors.message = '';
      formValid.message = true;
    }
  }, 300);

  function sanitizeInput(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  function validateForm(e: Event) {
    const nameErr = formName.trim() === '' ? 'Name is required.' : '';
    const emailErr = formEmail.trim() === '' ? 'Email is required.' : '';
    const urlErr = formUrl.trim() === '' ? 'URL/Page is required.' : '';
    const msgErr = formMessage.trim() === '' ? 'Message is required.' : '';

    const emailFormatErr =
      !emailErr && !emailRegex.test(formEmail.trim()) ? 'Please enter a valid email address.' : '';
    const nameReservedErr =
      !nameErr && isNameReserved(formName) ?
        'This name cannot be used. Please use another name.'
      : '';

    formErrors = {
      name: nameErr || nameReservedErr,
      email: emailErr || emailFormatErr,
      url: urlErr,
      message: msgErr,
    };

    if (formErrors.name) formValid.name = false;
    if (formErrors.email) formValid.email = false;
    if (formErrors.url) formValid.url = false;
    if (formErrors.message) formValid.message = false;

    e.preventDefault();

    if (!formErrors.name && !formErrors.email && !formErrors.url && !formErrors.message) {
      formName = sanitizeInput(formName.trim());
      formEmail = sanitizeInput(formEmail.trim());
      formUrl = sanitizeInput(formUrl.trim());
      formMessage = sanitizeInput(formMessage.trim());
      showSubmitDialog = true;
    }
  }

  function executeSubmit() {
    if (feedbackFormElement) {
      feedbackFormElement.submit();
    }
  }
</script>

<nav
  class="fixed top-0 z-40 flex h-15 w-full items-center justify-between border-b border-adwaita-border bg-adwaita-card/60 px-5 font-sans shadow-xs backdrop-blur-lg transition-colors duration-300">
  <a
    href="/"
    class="inline-flex h-9 items-center justify-center rounded-lg border border-adwaita-border bg-adwaita-card px-4 text-xs font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover">
    <i
      class="bi bi-arrow-left mr-2"
      aria-hidden="true"></i>
    Back to Home
  </a>

  <div class="flex items-center gap-3 select-none">
    <div class="relative">
      <button
        type="button"
        onclick={() => (themeDropdownOpen = !themeDropdownOpen)}
        class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-adwaita-border bg-adwaita-card text-sm text-adwaita-text transition-colors hover:bg-adwaita-hover"
        aria-label="Change theme"
        aria-haspopup="true"
        aria-expanded={themeDropdownOpen}>
        {#if theme === 'auto'}
          <i
            class="bi bi-circle-half"
            aria-hidden="true"></i>
        {:else}
          <i
            class="bi {theme === 'dark' ? 'bi-moon-stars-fill' : 'bi-sun-fill'}"
            aria-hidden="true"></i>
        {/if}
      </button>

      {#if themeDropdownOpen}
        <button
          class="fixed inset-0 z-40 cursor-default"
          onclick={() => (themeDropdownOpen = false)}
          aria-label="Close theme menu"></button>
        <div
          class="absolute top-11 right-0 z-50 flex min-w-31.25 flex-col rounded-xl border border-adwaita-border bg-adwaita-card py-1.5 shadow-lg">
          <button
            type="button"
            onclick={() => {
              applyTheme('auto');
              themeDropdownOpen = false;
            }}
            class="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-xs font-bold transition-colors hover:bg-adwaita-hover {(
              theme === 'auto'
            ) ?
              'text-adwaita-accent'
            : 'text-adwaita-text'}">
            <i
              class="bi bi-circle-half text-sm"
              aria-hidden="true"></i>
            Auto
          </button>
          <button
            type="button"
            onclick={() => {
              applyTheme('light');
              themeDropdownOpen = false;
            }}
            class="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-xs font-bold transition-colors hover:bg-adwaita-hover {(
              theme === 'light'
            ) ?
              'text-adwaita-accent'
            : 'text-adwaita-text'}">
            <i
              class="bi bi-sun-fill text-sm"
              aria-hidden="true"></i>
            Light
          </button>
          <button
            type="button"
            onclick={() => {
              applyTheme('dark');
              themeDropdownOpen = false;
            }}
            class="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-xs font-bold transition-colors hover:bg-adwaita-hover {(
              theme === 'dark'
            ) ?
              'text-adwaita-accent'
            : 'text-adwaita-text'}">
            <i
              class="bi bi-moon-stars-fill text-sm"
              aria-hidden="true"></i>
            Dark
          </button>
        </div>
      {/if}
    </div>
  </div>
</nav>

<main class="flex min-h-[calc(100vh-3.75rem)] flex-col pt-15 font-sans">
  <section class="relative z-10 mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-12">
    <div
      class="pointer-events-none absolute top-12.5 left-[50%] z-0 h-80 w-[320px] translate-x-[-50%] rounded-full bg-adwaita-accent/10 blur-[80px]">
    </div>

    <div class="relative z-10 text-center select-none">
      <h1 class="text-3xl font-bold tracking-tight text-adwaita-text md:text-4xl lg:text-5xl">
        Your Feedback Matters
      </h1>
      <p class="mx-auto mt-4 max-w-xl text-base leading-relaxed text-adwaita-subtitle/90">
        Your valuable feedback helps improve the quality of articles and ensures the website's
        technical systems run reliably. Please let us know if you spot any issues.
      </p>
    </div>

    <div class="boxed-list relative z-10 bg-zinc-950/1 text-left select-none">
      <div class="flex flex-col gap-3 p-5">
        <h2 class="text-sm font-bold text-adwaita-text">Feedback Categories</h2>
        <ul class="flex flex-col gap-2.5 text-xs text-adwaita-subtitle/95">
          <li class="flex items-start gap-2">
            <i
              class="bi bi-check-circle-fill mt-0.5 text-adwaita-accent"
              aria-hidden="true"></i>
            <span
              ><strong>Writing errors:</strong> Grammatical mistakes, typos, spelling, or poor phrasing.</span>
          </li>
          <li class="flex items-start gap-2">
            <i
              class="bi bi-check-circle-fill mt-0.5 text-adwaita-accent"
              aria-hidden="true"></i>
            <span
              ><strong>Technical inaccuracies:</strong> Code snippets that don't compile, wrong command
              usages, or faulty explanation logic.</span>
          </li>
          <li class="flex items-start gap-2">
            <i
              class="bi bi-check-circle-fill mt-0.5 text-adwaita-accent"
              aria-hidden="true"></i>
            <span
              ><strong>Outdated information:</strong> Deprecated package API calls, tools that are no
              longer active, or outdated tutorial steps.</span>
          </li>
          <li class="flex items-start gap-2">
            <i
              class="bi bi-check-circle-fill mt-0.5 text-adwaita-accent"
              aria-hidden="true"></i>
            <span
              ><strong>Broken links:</strong> 404 links, invalid references, or missing static download
              files.</span>
          </li>
          <li class="flex items-start gap-2">
            <i
              class="bi bi-check-circle-fill mt-0.5 text-adwaita-accent"
              aria-hidden="true"></i>
            <span
              ><strong>Website issues:</strong> UI layout bugs, visual display mistakes, broken styling,
              accessibility complaints, or slow loading times.</span>
          </li>
        </ul>
      </div>
    </div>

    <form
      bind:this={feedbackFormElement}
      novalidate
      action="https://formsubmit.co/contact@fkp.my.id"
      method="POST"
      onsubmit={validateForm}
      class="relative z-10 flex w-full flex-col gap-2 rounded-2xl border border-adwaita-border bg-adwaita-card/45 p-5 text-left shadow-xs backdrop-blur-lg transition-colors duration-300"
      autocomplete="off">
      <input
        type="hidden"
        name="_subject"
        value="New feedback report from website!" />
      <input
        type="hidden"
        name="_template"
        value="table" />
      <input
        type="hidden"
        name="_captcha"
        value="true" />
      <input
        type="hidden"
        name="_url"
        value="https://fkp.my.id/feedback" />

      <div class="mb-2 select-none">
        <h2 class="text-sm font-bold text-adwaita-text">Report an Issue</h2>
        <p class="mt-0.5 text-xs text-adwaita-label">
          Complete the fields below to submit your feedback directly.
        </p>
      </div>

      <div class="flex flex-col gap-1">
        <label
          for="form-name"
          class="text-xs font-bold text-adwaita-label select-none">
          Name <span
            aria-hidden="true"
            class="text-adwaita-error">*</span
          ><span class="sr-only">(required)</span>
        </label>
        <div class="w-full">
          <input
            type="text"
            id="form-name"
            name="name"
            aria-required="true"
            autocomplete="name"
            aria-invalid={!!formErrors.name}
            aria-describedby="form-name-fb"
            placeholder="Enter your name"
            bind:value={formName}
            oninput={() => {
              formErrors.name = '';
              formValid.name = false;
              validateName();
            }}
            class="w-full rounded-lg border border-adwaita-border bg-adwaita-bg px-3 py-1.5 text-sm text-adwaita-text transition-colors placeholder:text-adwaita-label/70"
            class:border-adwaita-error={formErrors.name}
            class:input-valid={formValid.name} />
          <div
            id="form-name-fb"
            aria-live="polite"
            class="mt-0.5 h-4 text-[11px] leading-none font-medium">
            {#if formErrors.name}
              <span
                role="alert"
                class="flex items-center gap-1 text-adwaita-error">
                <i class="bi bi-exclamation-circle-fill"></i>{formErrors.name}
              </span>
            {:else if formValid.name}
              <span class="flex items-center gap-1 text-adwaita-accent">
                <i class="bi bi-check-circle-fill"></i>Looks good
              </span>
            {/if}
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-1">
        <label
          for="form-email"
          class="text-xs font-bold text-adwaita-label select-none">
          Email <span
            aria-hidden="true"
            class="text-adwaita-error">*</span
          ><span class="sr-only">(required)</span>
        </label>
        <div class="w-full">
          <input
            type="email"
            id="form-email"
            name="email"
            aria-required="true"
            aria-invalid={!!formErrors.email}
            aria-describedby="form-email-fb"
            placeholder="Enter your email"
            autocomplete="email"
            bind:value={formEmail}
            oninput={() => {
              formErrors.email = '';
              formValid.email = false;
              validateEmail();
            }}
            class="w-full rounded-lg border border-adwaita-border bg-adwaita-bg px-3 py-1.5 text-sm text-adwaita-text transition-colors placeholder:text-adwaita-label/70"
            class:border-adwaita-error={formErrors.email}
            class:input-valid={formValid.email} />
          <div
            id="form-email-fb"
            aria-live="polite"
            class="mt-0.5 h-4 text-[11px] leading-none font-medium">
            {#if formErrors.email}
              <span
                role="alert"
                class="flex items-center gap-1 text-adwaita-error">
                <i class="bi bi-exclamation-circle-fill"></i>{formErrors.email}
              </span>
            {:else if formValid.email}
              <span class="flex items-center gap-1 text-adwaita-accent">
                <i class="bi bi-check-circle-fill"></i>Looks good
              </span>
            {/if}
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-1">
        <label
          for="form-url"
          class="text-xs font-bold text-adwaita-label select-none">
          Which URL/page contains the issue? <span
            aria-hidden="true"
            class="text-adwaita-error">*</span
          ><span class="sr-only">(required)</span>
        </label>
        <div class="w-full">
          <input
            type="text"
            id="form-url"
            name="url"
            aria-required="true"
            aria-invalid={!!formErrors.url}
            aria-describedby="form-url-fb"
            placeholder="/blog/some-article-slug"
            bind:value={formUrl}
            oninput={() => {
              formErrors.url = '';
              formValid.url = false;
              validateUrl();
            }}
            class="w-full rounded-lg border border-adwaita-border bg-adwaita-bg px-3 py-1.5 text-sm text-adwaita-text transition-colors placeholder:text-adwaita-label/70"
            class:border-adwaita-error={formErrors.url}
            class:input-valid={formValid.url} />
          <div
            id="form-url-fb"
            aria-live="polite"
            class="mt-0.5 h-4 text-[11px] leading-none font-medium">
            {#if formErrors.url}
              <span
                role="alert"
                class="flex items-center gap-1 text-adwaita-error">
                <i class="bi bi-exclamation-circle-fill"></i>{formErrors.url}
              </span>
            {:else if formValid.url}
              <span class="flex items-center gap-1 text-adwaita-accent">
                <i class="bi bi-check-circle-fill"></i>Looks good
              </span>
            {/if}
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-1">
        <label
          for="form-message"
          class="text-xs font-bold text-adwaita-label select-none">
          Message <span
            aria-hidden="true"
            class="text-adwaita-error">*</span
          ><span class="sr-only">(required)</span>
        </label>
        <div class="relative w-full">
          <textarea
            use:autoResize={formMessage}
            id="form-message"
            name="message"
            rows="4"
            placeholder="Describe the issue in detail..."
            maxlength="1000"
            bind:value={formMessage}
            oninput={() => {
              formErrors.message = '';
              formValid.message = false;
              validateMessage();
            }}
            aria-required="true"
            aria-invalid={!!formErrors.message}
            aria-describedby="form-msg-count form-message-fb"
            class="no-scrollbar w-full resize-none overflow-hidden rounded-lg border border-adwaita-border bg-adwaita-bg px-3 py-1.5 pr-16 text-sm text-adwaita-text transition-colors placeholder:text-adwaita-label/70"
            class:border-adwaita-error={formErrors.message}
            class:input-valid={formValid.message}></textarea>
          <div
            class="pointer-events-none absolute right-3 bottom-2.5 z-10 font-mono text-[10px] text-adwaita-label select-none"
            id="form-msg-count"
            aria-live="polite">
            {formMessage.length}/1000
          </div>
        </div>
        <div
          id="form-message-fb"
          aria-live="polite"
          class="mt-0.5 h-4 text-[11px] leading-none font-medium">
          {#if formErrors.message}
            <span
              role="alert"
              class="flex items-center gap-1 text-adwaita-error">
              <i class="bi bi-exclamation-circle-fill"></i>{formErrors.message}
            </span>
          {:else if formValid.message}
            <span class="flex items-center gap-1 text-adwaita-accent">
              <i class="bi bi-check-circle-fill"></i>Looks good
            </span>
          {/if}
        </div>
      </div>

      <div class="mt-2 flex justify-end select-none">
        <button
          type="submit"
          class="inline-flex cursor-pointer items-center justify-center rounded-lg bg-adwaita-accent px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-adwaita-accent-hover">
          Submit Feedback
        </button>
      </div>
    </form>
  </section>

  <footer
    class="relative z-10 mx-auto mt-auto w-full border-t border-adwaita-border px-6 pt-16 pb-12 font-sans text-xs text-adwaita-subtitle/75 md:w-[80%] lg:w-[50%]">
    <div class="grid grid-cols-1 gap-8 pb-10 md:grid-cols-12">
      <div class="flex flex-col gap-4 md:col-span-7">
        <div>
          <h3 class="text-base font-bold text-adwaita-text">{name}</h3>
          <p class="mt-2 max-w-md text-xs leading-relaxed text-adwaita-subtitle">
            {desc}
          </p>
        </div>

        <div class="flex items-center gap-3">
          <a
            href="https://github.com/farhnkrnapratma"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-adwaita-border bg-adwaita-card text-adwaita-subtitle transition-colors hover:bg-adwaita-hover hover:text-adwaita-accent"
            aria-label="GitHub (opens in a new tab)">
            <i
              class="bi bi-github text-base leading-none"
              aria-hidden="true"></i>
          </a>
          <a
            href="https://linkedin.com/in/farhnkrnapratma"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-adwaita-border bg-adwaita-card text-adwaita-subtitle transition-colors hover:bg-adwaita-hover hover:text-adwaita-accent"
            aria-label="LinkedIn (opens in a new tab)">
            <i
              class="bi bi-linkedin text-base leading-none"
              aria-hidden="true"></i>
          </a>
          <a
            href="https://x.com/farhnkrnapratma"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-adwaita-border bg-adwaita-card text-adwaita-subtitle transition-colors hover:bg-adwaita-hover hover:text-adwaita-accent"
            aria-label="X (opens in a new tab)">
            <i
              class="bi bi-twitter-x text-base leading-none"
              aria-hidden="true"></i>
          </a>
          <a
            href="https://instagram.com/farhnkrnapratma"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-adwaita-border bg-adwaita-card text-adwaita-subtitle transition-colors hover:bg-adwaita-hover hover:text-adwaita-accent"
            aria-label="Instagram (opens in a new tab)">
            <i
              class="bi bi-instagram text-base leading-none"
              aria-hidden="true"></i>
          </a>
        </div>
      </div>

      <div class="flex flex-col pt-1 md:col-span-5 md:pt-8">
        <ul class="grid grid-cols-2 gap-x-4 gap-y-2">
          {#each footerNavItems as item (item.url)}
            <li>
              <a
                href={item.url}
                class="cursor-pointer text-left font-medium transition-colors hover:text-adwaita-accent">
                {item.label}
              </a>
            </li>
          {/each}
        </ul>
      </div>
    </div>

    <div
      class="flex flex-col items-center justify-between gap-4 border-t border-adwaita-border pt-6 select-none sm:flex-row">
      <p>&copy; {new Date().getFullYear()} {name}. All rights reserved</p>
      <div class="flex items-center gap-4 text-[11px] text-adwaita-subtitle">
        <a
          href="/atom.xml"
          class="inline-flex items-center gap-1 transition-colors hover:text-[#f26522]">
          <i
            class="bi bi-rss-fill"
            aria-hidden="true"></i> RSS Feed
        </a>
        <a
          href="/sitemap.xml"
          class="transition-colors hover:text-adwaita-accent">Sitemap</a>
      </div>
    </div>
  </footer>
</main>

<ConfirmationDialog
  bind:isOpen={showSubmitDialog}
  title="Submit Feedback?"
  message="Are you sure you want to submit this feedback report?"
  confirmLabel="Submit"
  isDestructive={false}
  onConfirm={executeSubmit} />
