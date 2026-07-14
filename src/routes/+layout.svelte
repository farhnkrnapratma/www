<script lang="ts">
  import './layout.css';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { page } from '$app/state';

  const { children } = $props();

  type Theme = 'auto' | 'dark' | 'light';

  let showScrollTop = $state(false);

  const isPageWithFeedback = $derived(
    page.url.pathname === '/admin/login' ||
    !page.url.pathname.startsWith('/admin')
  );

  const postTitle = $derived(page.data.post?.title);
  const feedbackSubject = $derived(
    postTitle ? `Feedback on Post: ${postTitle}` : 'Feedback on portfolio website'
  );

  function applyTheme(newTheme: Theme) {
    if (typeof window !== 'undefined') {
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

  function handleScroll() {
    showScrollTop = window.scrollY > 300;
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onMount(() => {
    const saved = (localStorage.getItem('theme') as Theme) || 'auto';
    applyTheme(saved);

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      const current = (localStorage.getItem('theme') as Theme) || 'auto';
      if (current === 'auto') {
        applyTheme('auto');
      }
    };

    const storageListener = (e: StorageEvent) => {
      if (e.key === 'theme') {
        applyTheme((e.newValue as Theme) || 'auto');
      }
    };

    media.addEventListener('change', listener);
    window.addEventListener('storage', storageListener);
    window.addEventListener('scroll', handleScroll);

    return () => {
      media.removeEventListener('change', listener);
      window.removeEventListener('storage', storageListener);
      window.removeEventListener('scroll', handleScroll);
    };
  });
</script>

{@render children()}

{#if showScrollTop}
  <button
    transition:fade={{ duration: 150 }}
    class="fixed bottom-6 right-6 inline-flex h-10 w-10 sm:w-auto px-0 sm:px-4 items-center justify-center gap-2 rounded-lg border border-adwaita-border bg-adwaita-card text-xs sm:text-sm font-semibold text-adwaita-body shadow-lg transition-all hover:bg-adwaita-hover hover:text-adwaita-accent focus:outline-none select-none cursor-pointer z-50"
    onclick={scrollToTop}
    title="Scroll to Top">
    <i class="bi bi-arrow-up text-sm" aria-hidden="true"></i>
    <span class="hidden sm:inline">Scroll to top</span>
  </button>
{/if}

{#if isPageWithFeedback}
  <a
    href="mailto:contact@fkp.my.id?subject={encodeURIComponent(feedbackSubject)}"
    class="fixed bottom-6 left-6 inline-flex h-10 w-10 sm:w-auto px-0 sm:px-4 items-center justify-center gap-2 rounded-lg border border-adwaita-border bg-adwaita-card text-xs sm:text-sm font-semibold text-adwaita-body shadow-lg transition-all hover:bg-adwaita-hover hover:text-adwaita-accent focus:outline-none select-none cursor-pointer z-50"
    title="Give Feedback">
    <i class="bi bi-chat-left-text text-sm" aria-hidden="true"></i>
    <span class="hidden sm:inline">Feedback</span>
  </a>
{/if}
