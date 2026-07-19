<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';
  import { marked } from 'marked';

  let isCheckingAuth = $state(true);
  let title = $state('');
  let slug = $state('');
  let excerpt = $state('');
  let markdownContent = $state('# New Post\n\nWrite your markdown content here...');
  let published = $state(false);

  let isSubmitting = $state(false);
  let errorMessage = $state<string | null>(null);
  let activeTab = $state<'editor' | 'preview'>('editor');
  let previewHtml = $state('');

  let isEditMode = $state(false);
  let editId = $state<string | null>(null);
  let originalSlug = '';

  type Theme = 'auto' | 'dark' | 'light';
  let theme = $state<Theme>('auto');
  let themeDropdownOpen = $state(false);

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

  onMount(async () => {
    const saved = localStorage.getItem('theme') as Theme;
    theme = saved || 'auto';

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      window.location.href = '/admin/login';
      return;
    }
    isCheckingAuth = false;

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      editId = id;
      isEditMode = true;
      await loadPostForEdit(id);
    }
  });

  async function loadPostForEdit(id: string) {
    try {
      const { data: post, error } = await supabase.from('posts').select('*').eq('id', id).single();

      if (error || !post) {
        throw error || new Error('Post not found');
      }

      title = post.title;
      slug = post.slug;
      originalSlug = post.slug;
      excerpt = post.excerpt || '';
      published = post.published;

      const { data: fileData, error: fileError } = await supabase.storage
        .from('blog-posts')
        .download(post.storage_path);

      if (fileError) {
        throw fileError;
      }

      markdownContent = await fileData.text();
    } catch (err) {
      const error = err as Error;
      console.error('Error loading post for edit:', error);
      errorMessage = 'Failed to load post data: ' + error.message;
    }
  }

  $effect(() => {
    if (title && !isEditMode) {
      slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
  });

  $effect(() => {
    if (markdownContent) {
      Promise.resolve(marked.parse(markdownContent)).then(html => {
        previewHtml = html;
      });
    }
  });

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!title.trim() || !slug.trim() || !markdownContent.trim()) {
      errorMessage = 'Title, slug, and markdown content are required.';
      return;
    }

    isSubmitting = true;
    errorMessage = null;

    try {
      const fileName = `${slug}.md`;
      const storagePath = `${fileName}`;

      const mdBlob = new Blob([markdownContent], { type: 'text/markdown' });
      const mdFile = new File([mdBlob], fileName, { type: 'text/markdown' });

      if (isEditMode && editId) {
        const { error: uploadError } = await supabase.storage
          .from('blog-posts')
          .upload(storagePath, mdFile, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) {
          throw new Error(`Storage upload failed: ${uploadError.message}`);
        }

        const { error: dbError } = await supabase
          .from('posts')
          .update({
            title: title.trim(),
            slug: slug.trim(),
            excerpt: excerpt.trim() || null,
            published,
            storage_path: storagePath,
          })
          .eq('id', editId);

        if (dbError) {
          throw dbError;
        }

        if (originalSlug && originalSlug !== slug) {
          await supabase.storage.from('blog-posts').remove([`${originalSlug}.md`]);
        }
      } else {
        const { error: uploadError } = await supabase.storage
          .from('blog-posts')
          .upload(storagePath, mdFile, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) {
          throw new Error(`Storage upload failed: ${uploadError.message}`);
        }

        const { error: dbError } = await supabase.from('posts').insert({
          title: title.trim(),
          slug: slug.trim(),
          excerpt: excerpt.trim() || null,
          published,
          storage_path: storagePath,
        });

        if (dbError) {
          await supabase.storage.from('blog-posts').remove([storagePath]);
          throw dbError;
        }
      }

      window.location.href = '/admin';
    } catch (err) {
      const error = err as Error;
      console.error('Error saving post:', error);
      errorMessage = error.message || 'Failed to save blog post.';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<nav
  class="fixed top-0 z-40 flex h-15 w-full items-center justify-between border-b border-adwaita-border bg-adwaita-card/60 px-5 font-sans shadow-xs backdrop-blur-lg transition-colors duration-300">
  <a
    href="/admin"
    class="inline-flex h-9 items-center justify-center rounded-lg border border-adwaita-border bg-adwaita-card px-4 text-xs font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover">
    <i
      class="bi bi-arrow-left mr-2"
      aria-hidden="true"></i>
    Cancel
  </a>

  <div class="flex items-center gap-3">
    <span class="text-sm font-bold text-adwaita-subtitle"
      >{isEditMode ? 'Edit Post' : 'Write New Post'}</span>

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
  {#if isCheckingAuth}
    <div class="flex flex-1 flex-col items-center justify-center py-20 text-adwaita-subtitle">
      <svg
        class="mb-3 h-8 w-8 animate-spin text-adwaita-subtitle select-none"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24">
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      Verifying credentials...
    </div>
  {:else}
    <section class="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      {#if errorMessage}
        <div
          class="mb-6 rounded-lg border border-palette-coral/30 bg-palette-coral/10 p-3 text-sm font-semibold text-palette-coral">
          {errorMessage}
        </div>
      {/if}

      <form
        onsubmit={handleSubmit}
        class="flex flex-col gap-6">
        <div class="boxed-list bg-zinc-950/1 p-5 text-left">
          <h2 class="mb-4 text-sm font-bold text-adwaita-text">Post Settings</h2>
          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label
                for="post-title"
                class="w-20 shrink-0 text-xs font-bold text-adwaita-subtitle">Title</label>
              <input
                type="text"
                id="post-title"
                required
                placeholder="Getting Started with Rust"
                bind:value={title}
                class="w-full rounded-lg border border-adwaita-border bg-adwaita-bg px-3 py-2 text-sm text-adwaita-text transition-colors placeholder:text-adwaita-subtitle/70 focus:border-adwaita-accent" />
            </div>
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label
                for="post-slug"
                class="w-20 shrink-0 text-xs font-bold text-adwaita-subtitle">Slug</label>
              <input
                type="text"
                id="post-slug"
                required
                placeholder="getting-started-with-rust"
                bind:value={slug}
                class="w-full rounded-lg border border-adwaita-border bg-adwaita-bg px-3 py-2 text-sm text-adwaita-text transition-colors placeholder:text-adwaita-subtitle/70 focus:border-adwaita-accent" />
            </div>
            <div class="flex flex-col items-start gap-2">
              <label
                for="post-excerpt"
                class="mt-1 w-20 shrink-0 text-xs font-bold text-adwaita-subtitle">Excerpt</label>
              <textarea
                id="post-excerpt"
                rows="2"
                placeholder="Brief summary of the article..."
                bind:value={excerpt}
                class="w-full resize-none rounded-lg border border-adwaita-border bg-adwaita-bg px-3 py-1.5 text-sm text-adwaita-text transition-colors placeholder:text-adwaita-subtitle/70 focus:border-adwaita-accent"
              ></textarea>
            </div>
            <div class="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="post-publish"
                bind:checked={published}
                class="rounded border-adwaita-border text-adwaita-accent focus:ring-adwaita-accent" />
              <label
                for="post-publish"
                class="cursor-pointer text-xs font-bold text-adwaita-text select-none"
                >Publish immediately</label>
            </div>
          </div>
        </div>

        <div class="boxed-list flex min-h-100 flex-col overflow-hidden text-left">
          <div class="flex border-b border-adwaita-border bg-adwaita-hover/30 px-3 py-1">
            <button
              type="button"
              onclick={() => (activeTab = 'editor')}
              class="border-b-2 px-4 py-2 text-xs font-bold transition-colors {(
                activeTab === 'editor'
              ) ?
                'border-adwaita-accent text-adwaita-accent'
              : 'border-transparent text-adwaita-subtitle hover:text-adwaita-text'}">
              Markdown Editor
            </button>
            <button
              type="button"
              onclick={() => (activeTab = 'preview')}
              class="border-b-2 px-4 py-2 text-xs font-bold transition-colors {(
                activeTab === 'preview'
              ) ?
                'border-adwaita-accent text-adwaita-accent'
              : 'border-transparent text-adwaita-subtitle hover:text-adwaita-text'}">
              Live HTML Preview
            </button>
          </div>

          {#if activeTab === 'editor'}
            <textarea
              required
              aria-label="Markdown Content"
              bind:value={markdownContent}
              class="min-h-87.5 w-full flex-1 resize-y bg-adwaita-bg p-5 font-mono text-sm leading-relaxed text-adwaita-text focus:ring-2 focus:ring-adwaita-accent focus:ring-inset"
            ></textarea>
          {:else}
            <div class="prose-custom min-h-87.5 w-full overflow-y-auto bg-adwaita-bg p-6">
              {#if previewHtml}
                {@html previewHtml}
              {:else}
                <p class="text-adwaita-subtitle italic">Nothing to preview...</p>
              {/if}
            </div>
          {/if}
        </div>

        <div class="mt-4 mb-10 flex justify-end gap-3">
          <a
            href="/admin"
            class="inline-flex h-10 items-center justify-center rounded-lg border border-adwaita-border bg-adwaita-card px-5 text-sm font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover">
            Cancel
          </a>
          <button
            type="submit"
            disabled={isSubmitting}
            class="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-adwaita-accent px-6 text-sm font-semibold text-white transition-colors hover:bg-adwaita-accent-hover disabled:opacity-55">
            {isSubmitting ? 'Saving...'
            : isEditMode ? 'Save Changes'
            : 'Save Blog Post'}
          </button>
        </div>
      </form>
    </section>
  {/if}
</main>
