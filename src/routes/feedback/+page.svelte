<script lang="ts">
  import { onMount } from 'svelte';
  import { isNameReserved } from '$lib/nameValidator';
  import { Card, FormField, Input, Textarea, Button, IconButton, Dialog, SkipLink } from '$lib';

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
  }, 500);

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
  }, 500);

  const validateUrl = debounce(() => {
    const val = formUrl.trim();
    if (val === '') {
      formErrors.url = '';
      formValid.url = false;
    } else {
      formErrors.url = '';
      formValid.url = true;
    }
  }, 500);

  const validateMessage = debounce(() => {
    const val = formMessage.trim();
    if (val === '') {
      formErrors.message = '';
      formValid.message = false;
    } else {
      formErrors.message = '';
      formValid.message = true;
    }
  }, 500);

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

<SkipLink />

<nav
  class="fixed top-0 z-40 flex h-15 w-full items-center justify-between border-b border-border-subtle bg-surface-card/60 px-5 font-sans shadow-xs backdrop-blur-lg transition-colors duration-300"
  aria-label="Main navigation">
  <a href="/">
    <Button
      variant="secondary"
      size="sm">
      <i
        class="bi bi-arrow-left text-sm"
        aria-hidden="true"></i>
      Back to home
    </Button>
  </a>

  <div class="flex items-center gap-3 select-none">
    <div class="relative">
      <IconButton
        ariaLabel="Change theme"
        variant="default"
        size="sm"
        onclick={() => (themeDropdownOpen = !themeDropdownOpen)}
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
      </IconButton>

      {#if themeDropdownOpen}
        <button
          class="fixed inset-0 z-40 cursor-default"
          onclick={() => (themeDropdownOpen = false)}
          aria-label="Close theme menu"></button>
        <div
          class="absolute top-11 right-0 z-50 flex min-w-31 flex-col rounded-xl border border-border-subtle bg-surface-elevated py-1.5 shadow-lg">
          <button
            type="button"
            onclick={() => {
              applyTheme('auto');
              themeDropdownOpen = false;
            }}
            class="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-xs font-bold transition-colors hover:bg-surface-hover {(
              theme === 'auto'
            ) ?
              'text-accent'
            : 'text-text-primary'}">
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
            class="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-xs font-bold transition-colors hover:bg-surface-hover {(
              theme === 'light'
            ) ?
              'text-accent'
            : 'text-text-primary'}">
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
            class="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-xs font-bold transition-colors hover:bg-surface-hover {(
              theme === 'dark'
            ) ?
              'text-accent'
            : 'text-text-primary'}">
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

<main
  id="main-content"
  class="flex min-h-[calc(100vh-3.75rem)] flex-col pt-15 font-sans">
  <section class="relative z-10 mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-12">
    <div
      class="pointer-events-none absolute top-12.5 left-[50%] z-0 h-80 w-[320px] translate-x-[-50%] rounded-full bg-accent/10 blur-[80px]">
    </div>

    <div class="relative z-10 text-center select-none">
      <h1 class="text-3xl font-bold tracking-tight text-text-primary md:text-4xl lg:text-5xl">
        Your feedback matters
      </h1>
      <p class="mx-auto mt-4 max-w-xl text-base leading-relaxed text-text-secondary">
        Your valuable feedback helps improve the quality of articles and ensures the website's
        technical systems run reliably. Please let us know if you spot any issues.
      </p>
    </div>

    <Card
      variant="glass"
      class="relative z-10 p-5 select-none">
      <div class="flex flex-col gap-3">
        <h2 class="text-sm font-bold text-text-primary">Feedback categories</h2>
        <ul class="flex flex-col gap-2.5 text-xs text-text-secondary">
          <li class="flex items-start gap-2">
            <i
              class="bi bi-check-circle-fill mt-0.5 text-accent"
              aria-hidden="true"></i>
            <span
              ><strong>Writing errors:</strong> Grammatical mistakes, typos, spelling, or poor phrasing.</span>
          </li>
          <li class="flex items-start gap-2">
            <i
              class="bi bi-check-circle-fill mt-0.5 text-accent"
              aria-hidden="true"></i>
            <span
              ><strong>Technical inaccuracies:</strong> Code snippets that don't compile, wrong command
              usages, or faulty explanation logic.</span>
          </li>
          <li class="flex items-start gap-2">
            <i
              class="bi bi-check-circle-fill mt-0.5 text-accent"
              aria-hidden="true"></i>
            <span
              ><strong>Outdated information:</strong> Deprecated package API calls, tools that are no
              longer active, or outdated tutorial steps.</span>
          </li>
          <li class="flex items-start gap-2">
            <i
              class="bi bi-check-circle-fill mt-0.5 text-accent"
              aria-hidden="true"></i>
            <span
              ><strong>Broken links:</strong> 404 links, invalid references, or missing static download
              files.</span>
          </li>
          <li class="flex items-start gap-2">
            <i
              class="bi bi-check-circle-fill mt-0.5 text-accent"
              aria-hidden="true"></i>
            <span
              ><strong>Website issues:</strong> UI layout bugs, visual display mistakes, broken styling,
              accessibility complaints, or slow loading times.</span>
          </li>
        </ul>
      </div>
    </Card>

    <form
      bind:this={feedbackFormElement}
      novalidate
      action="https://formsubmit.co/contact@fkp.my.id"
      method="POST"
      onsubmit={validateForm}
      class="relative z-10 flex w-full flex-col gap-3 rounded-2xl border border-border-subtle bg-surface-card/60 p-6 text-left shadow-xs backdrop-blur-lg transition-colors duration-300"
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
        <h2 class="text-sm font-bold text-text-primary">Report an issue</h2>
        <p class="mt-0.5 text-xs text-text-muted">
          Complete the fields below to submit your feedback directly.
        </p>
      </div>

      <FormField
        id="form-name"
        label="Name"
        required
        error={formErrors.name}
        valid={formValid.name}>
        <Input
          type="text"
          id="form-name"
          name="name"
          aria-required="true"
          autocomplete="name"
          placeholder="Your name"
          bind:value={formName}
          error={!!formErrors.name}
          valid={formValid.name}
          oninput={() => {
            formErrors.name = '';
            formValid.name = false;
            validateName();
          }} />
      </FormField>

      <FormField
        id="form-email"
        label="Email"
        required
        error={formErrors.email}
        valid={formValid.email}>
        <Input
          type="email"
          id="form-email"
          name="email"
          aria-required="true"
          autocomplete="email"
          placeholder="your@email.com"
          bind:value={formEmail}
          error={!!formErrors.email}
          valid={formValid.email}
          oninput={() => {
            formErrors.email = '';
            formValid.email = false;
            validateEmail();
          }} />
      </FormField>

      <FormField
        id="form-url"
        label="Which URL/page contains the issue?"
        required
        error={formErrors.url}
        valid={formValid.url}>
        <Input
          type="text"
          id="form-url"
          name="url"
          aria-required="true"
          placeholder="Enter page path or full URL (e.g. Home, Blog, or link)"
          bind:value={formUrl}
          error={!!formErrors.url}
          valid={formValid.url}
          oninput={() => {
            formErrors.url = '';
            formValid.url = false;
            validateUrl();
          }} />
      </FormField>

      <FormField
        id="form-message"
        label="Message"
        required
        error={formErrors.message}
        valid={formValid.message}
        counter="{1000 - formMessage.length} left">
        <Textarea
          id="form-message"
          name="message"
          rows={4}
          maxlength={1000}
          placeholder="Describe the issue in detail…"
          bind:value={formMessage}
          error={!!formErrors.message}
          valid={formValid.message}
          oninput={() => {
            formErrors.message = '';
            formValid.message = false;
            validateMessage();
          }} />
      </FormField>

      <div class="mt-2 flex justify-end select-none">
        <Button
          type="submit"
          variant="primary"
          size="md">
          Submit feedback
        </Button>
      </div>
    </form>
  </section>

  <footer
    class="relative z-10 mx-auto mt-auto w-full border-t border-border-subtle px-6 pt-16 pb-12 font-sans text-xs text-text-muted md:w-[80%] lg:w-[50%]">
    <div class="grid grid-cols-1 gap-8 pb-10 md:grid-cols-12">
      <div class="flex flex-col gap-4 md:col-span-7">
        <div>
          <h3 class="text-base font-bold text-text-primary">{name}</h3>
          <p class="mt-2 max-w-md text-xs leading-relaxed text-text-secondary">
            {desc}
          </p>
        </div>

        <div class="flex items-center gap-3">
          <a
            href="https://github.com/farhnkrnapratma"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle bg-surface-card text-text-secondary transition-colors hover:bg-surface-hover hover:text-accent"
            aria-label="GitHub (opens in a new tab)">
            <i
              class="bi bi-github text-base leading-none"
              aria-hidden="true"></i>
          </a>
          <a
            href="https://linkedin.com/in/farhnkrnapratma"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle bg-surface-card text-text-secondary transition-colors hover:bg-surface-hover hover:text-accent"
            aria-label="LinkedIn (opens in a new tab)">
            <i
              class="bi bi-linkedin text-base leading-none"
              aria-hidden="true"></i>
          </a>
          <a
            href="https://x.com/farhnkrnapratma"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle bg-surface-card text-text-secondary transition-colors hover:bg-surface-hover hover:text-accent"
            aria-label="X (opens in a new tab)">
            <i
              class="bi bi-twitter-x text-base leading-none"
              aria-hidden="true"></i>
          </a>
          <a
            href="https://instagram.com/farhnkrnapratma"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle bg-surface-card text-text-secondary transition-colors hover:bg-surface-hover hover:text-accent"
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
                class="cursor-pointer text-left font-medium transition-colors hover:text-accent">
                {item.label}
              </a>
            </li>
          {/each}
        </ul>
      </div>
    </div>

    <div
      class="flex flex-col items-center justify-between gap-4 border-t border-border-subtle pt-6 select-none sm:flex-row">
      <p>&copy; {new Date().getFullYear()} {name}. All rights reserved.</p>
      <div class="flex items-center gap-4 text-[11px] text-text-muted">
        <a
          href="/atom.xml"
          class="inline-flex items-center gap-1 transition-colors hover:text-[#f26522]">
          <i
            class="bi bi-rss-fill"
            aria-hidden="true"></i> RSS feed
        </a>
        <a
          href="/sitemap.xml"
          class="transition-colors hover:text-accent">Sitemap</a>
      </div>
    </div>
  </footer>
</main>

<Dialog
  bind:isOpen={showSubmitDialog}
  title="Submit feedback?"
  description="Are you sure you want to submit this feedback report?"
  onClose={() => (showSubmitDialog = false)}>
  {#snippet footer()}
    <Button
      variant="secondary"
      size="md"
      onclick={() => (showSubmitDialog = false)}>
      Cancel
    </Button>
    <Button
      variant="primary"
      size="md"
      onclick={executeSubmit}>
      Submit feedback
    </Button>
  {/snippet}
</Dialog>
