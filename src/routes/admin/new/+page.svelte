<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';
  import { marked } from 'marked';
  import { autoResize, ConfirmationDialog } from '$lib';

  let isCheckingAuth = $state(true);
  let title = $state('');
  let slug = $derived(generateSlug(title));
  let excerpt = $state('');
  let markdownContent = $state('# New Post\n\nWrite your markdown content here...');

  let isSubmitting = $state(false);
  let errorMessage = $state<string | null>(null);
  let activeTab = $state<'editor' | 'preview'>('editor');
  let previewHtml = $state('');

  let isEditMode = $state(false);
  let editId = $state<string | null>(null);
  let originalSlug = '';

  let bannerFile = $state<File | null>(null);
  let bannerPreview = $state<string | null>(null);
  let bannerPath = $state<string | null>(null);
  let bannerError = $state<string | null>(null);

  let initialTitle = $state('');
  let initialExcerpt = $state('');
  let initialMarkdownContent = $state('');
  let initialBannerPath = $state('');

  const isDirty = $derived(
    title.trim() !== initialTitle.trim() ||
      excerpt.trim() !== initialExcerpt.trim() ||
      markdownContent.trim() !== initialMarkdownContent.trim() ||
      (bannerPath || '').trim() !== (initialBannerPath || '').trim() ||
      bannerFile !== null,
  );

  let titleError = $state('');
  let titleValid = $state(false);

  let showCancelDialog = $state(false);
  let showPublishDialog = $state(false);
  let showSaveDraftDialog = $state(false);

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

  const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
  let idleTimer: ReturnType<typeof setTimeout>;

  function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(async () => {
      await supabase.auth.signOut();
      window.location.href = '/admin/login';
    }, IDLE_TIMEOUT_MS);
  }

  const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'] as const;

  onMount(() => {
    const saved = localStorage.getItem('theme') as Theme;
    theme = saved || 'auto';

    (async () => {
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
      } else {
        initialTitle = '';
        initialExcerpt = '';
        initialMarkdownContent = '# New Post\n\nWrite your markdown content here...';
      }
    })();

    resetIdleTimer();
    ACTIVITY_EVENTS.forEach(evt => window.addEventListener(evt, resetIdleTimer, { passive: true }));

    return () => {
      clearTimeout(idleTimer);
      ACTIVITY_EVENTS.forEach(evt => window.removeEventListener(evt, resetIdleTimer));
    };
  });

  async function loadPostForEdit(id: string) {
    try {
      const { data: post, error } = await supabase.from('posts').select('*').eq('id', id).single();

      if (error || !post) {
        throw error || new Error('Post not found');
      }

      title = post.title;
      originalSlug = post.slug;
      excerpt = post.excerpt || '';

      const { data: fileData, error: fileError } = await supabase.storage
        .from('blog-posts')
        .download(post.storage_path);

      if (fileError) {
        throw fileError;
      }

      const fileText = await fileData.text();
      markdownContent = fileText;

      bannerPath = post.banner_path || null;
      initialBannerPath = post.banner_path || '';
      if (post.banner_path) {
        const { data: publicUrl } = supabase.storage
          .from('blog-posts')
          .getPublicUrl(post.banner_path);
        bannerPreview = publicUrl.publicUrl;
      } else {
        bannerPreview = null;
      }

      initialTitle = title;
      initialExcerpt = excerpt;
      initialMarkdownContent = markdownContent;
    } catch (err) {
      const error = err as Error;
      console.error('Error loading post for edit:', error);
      errorMessage = 'Failed to load post data: ' + error.message;
    }
  }

  function generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  $effect(() => {
    if (markdownContent) {
      Promise.resolve(marked.parse(markdownContent)).then(html => {
        previewHtml = html;
      });
    }
  });

  function debounce<T extends unknown[]>(cb: (...args: T) => void, ms: number) {
    let timer: ReturnType<typeof setTimeout>;
    return (...args: T) => {
      clearTimeout(timer);
      timer = setTimeout(() => cb(...args), ms);
    };
  }

  const validateTitleField = debounce(() => {
    if (title.trim() === '') {
      titleError = '';
      titleValid = false;
    } else if (title.trim().length > 60) {
      titleError = 'Title must be 60 characters or less.';
      titleValid = false;
    } else {
      titleError = '';
      titleValid = true;
    }
  }, 300);

  function validateImageDimensions(file: File): Promise<boolean> {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const valid = img.width === 1280 && img.height === 640;
        resolve(valid);
      };
      img.onerror = () => {
        resolve(false);
      };
      img.src = URL.createObjectURL(file);
    });
  }

  async function handleBannerChange(e: Event) {
    bannerError = null;
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.type !== 'image/png') {
      bannerError = 'Banner must be a PNG image.';
      input.value = '';
      return;
    }

    const isValidDimensions = await validateImageDimensions(file);
    if (!isValidDimensions) {
      bannerError = 'Banner dimensions must be exactly 1280x640 pixels.';
      input.value = '';
      return;
    }

    bannerFile = file;
    bannerPreview = URL.createObjectURL(file);
  }

  function validate() {
    const titleVal = title.trim();
    if (titleVal === '') {
      titleError = 'Title is required.';
      titleValid = false;
      return false;
    }
    if (titleVal.length > 60) {
      titleError = 'Title must be 60 characters or less.';
      titleValid = false;
      return false;
    }

    titleError = '';
    titleValid = true;
    return true;
  }

  function handleCancelClick() {
    if (isDirty) {
      showCancelDialog = true;
    } else {
      window.location.href = '/admin';
    }
  }

  function handleSaveClick(toBePublished: boolean) {
    if (!validate()) return;
    if (!markdownContent.trim()) {
      errorMessage = 'Markdown content is required.';
      return;
    }

    if (toBePublished) {
      showPublishDialog = true;
    } else {
      showSaveDraftDialog = true;
    }
  }

  async function executeSave(toBePublished: boolean) {
    isSubmitting = true;
    errorMessage = null;

    try {
      if (title.trim().length > 60) {
        throw new Error('Title exceeds backend maximum length of 60 characters.');
      }
      if (!/^[a-z-]*$/.test(slug)) {
        throw new Error('Slug contains invalid characters. Only a-z and - are allowed.');
      }

      const fileName = `${slug}.md`;
      const storagePath = `${fileName}`;

      const mdBlob = new Blob([markdownContent], { type: 'text/markdown' });
      const mdFile = new File([mdBlob], fileName, { type: 'text/markdown' });

      let finalBannerPath = bannerPath;

      if (bannerFile) {
        if (bannerFile.type !== 'image/png') {
          throw new Error('Backend Validation: Banner must be a PNG image.');
        }
        const bannerFileName = `banners/${slug}.png`;
        const { error: bannerUploadError } = await supabase.storage
          .from('blog-posts')
          .upload(bannerFileName, bannerFile, {
            cacheControl: '3600',
            upsert: true,
          });

        if (bannerUploadError) {
          throw new Error(`Banner upload failed: ${bannerUploadError.message}`);
        }
        finalBannerPath = bannerFileName;
      }

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
            published: toBePublished,
            storage_path: storagePath,
            banner_path: finalBannerPath,
          })
          .eq('id', editId);

        if (dbError) {
          throw dbError;
        }

        if (originalSlug && originalSlug !== slug) {
          await supabase.storage
            .from('blog-posts')
            .remove([`${originalSlug}.md`, `banners/${originalSlug}.png`]);
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
          published: toBePublished,
          storage_path: storagePath,
          banner_path: finalBannerPath,
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
  <button
    type="button"
    onclick={handleCancelClick}
    class="inline-flex h-9 items-center justify-center rounded-lg border border-adwaita-border bg-adwaita-card px-4 text-xs font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover">
    <i
      class="bi bi-arrow-left mr-2"
      aria-hidden="true"></i>
    Cancel
  </button>

  <div class="flex items-center gap-3">
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
        onsubmit={e => e.preventDefault()}
        class="flex flex-col gap-4">
        <div class="boxed-list flex flex-col gap-2.5 bg-zinc-950/1 p-5 text-left">
          <h2 class="text-sm font-bold text-adwaita-text select-none">Post Settings</h2>

          <div class="flex flex-col gap-2.5">
            <div class="flex flex-col gap-1">
              <div class="flex items-center justify-between">
                <label
                  for="post-title"
                  class="text-xs font-bold text-adwaita-subtitle">
                  Title <span class="text-adwaita-error">*</span>
                </label>
                {#if slug}
                  <div
                    class="flex items-center gap-1 font-sans text-[10px] text-adwaita-subtitle select-none">
                    <i class="bi bi-link-45deg text-xs text-adwaita-accent"></i>
                    <span>fkp.my.id/blog/</span><span
                      class="rounded-md bg-adwaita-accent/10 px-1.5 py-0.5 font-bold text-adwaita-accent"
                      >{slug}</span>
                  </div>
                {/if}
              </div>
              <input
                type="text"
                id="post-title"
                maxlength="60"
                required
                placeholder="Getting Started with Rust"
                bind:value={title}
                oninput={() => {
                  titleError = '';
                  titleValid = false;
                  validateTitleField();
                }}
                class="w-full rounded-lg border border-adwaita-border bg-adwaita-bg px-3 py-2 text-sm text-adwaita-text transition-colors placeholder:text-adwaita-subtitle/70"
                class:border-adwaita-error={titleError}
                class:input-valid={titleValid} />
              {#if titleError || titleValid}
                <div
                  id="post-title-fb"
                  aria-live="polite"
                  class="mt-1 text-xs leading-none font-medium">
                  {#if titleError}
                    <span class="flex items-center gap-1 text-adwaita-error">
                      <i class="bi bi-exclamation-circle-fill"></i>{titleError}
                    </span>
                  {:else if titleValid}
                    <span class="flex items-center gap-1 text-adwaita-accent">
                      <i class="bi bi-check-circle-fill"></i>Looks good
                    </span>
                  {/if}
                </div>
              {/if}
            </div>

            <div class="flex flex-col gap-1">
              <label
                for="post-excerpt"
                class="text-xs font-bold text-adwaita-subtitle">Excerpt</label>
              <textarea
                use:autoResize={excerpt}
                id="post-excerpt"
                rows="2"
                placeholder="Brief summary of the article..."
                bind:value={excerpt}
                class="w-full resize-none overflow-hidden rounded-lg border border-adwaita-border bg-adwaita-bg px-3 py-1.5 text-sm text-adwaita-text transition-colors placeholder:text-adwaita-subtitle/70 focus:border-adwaita-accent"
              ></textarea>
            </div>

            <div class="flex flex-col gap-1">
              <span class="text-xs font-bold text-adwaita-subtitle select-none"
                >Banner Image (PNG, 1280x640)</span>

              <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  type="file"
                  id="post-banner"
                  accept="image/png"
                  onchange={handleBannerChange}
                  class="block w-full text-xs text-adwaita-subtitle file:mr-4 file:cursor-pointer file:rounded-lg file:border file:border-adwaita-border file:bg-adwaita-card file:px-4 file:py-2 file:text-xs file:font-semibold file:text-adwaita-text hover:file:bg-adwaita-hover focus:outline-2 focus:outline-adwaita-accent" />

                {#if bannerPreview}
                  <div
                    class="relative max-w-[200px] shrink-0 overflow-hidden rounded-lg border border-adwaita-border">
                    <img
                      src={bannerPreview}
                      alt="Banner preview"
                      class="aspect-[2/1] w-full object-cover" />
                    <button
                      type="button"
                      onclick={() => {
                        bannerFile = null;
                        bannerPreview = null;
                        bannerPath = null;
                      }}
                      class="absolute top-1 right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/70 p-1 text-white hover:bg-black/90"
                      aria-label="Remove banner">
                      <i class="bi bi-x text-xs"></i>
                    </button>
                  </div>
                {/if}
              </div>

              {#if bannerError}
                <div
                  id="post-banner-fb"
                  aria-live="polite"
                  class="mt-1 text-xs leading-none font-medium">
                  <span
                    role="alert"
                    class="flex items-center gap-1 text-adwaita-error">
                    <i class="bi bi-exclamation-circle-fill"></i>{bannerError}
                  </span>
                </div>
              {/if}
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
              use:autoResize={markdownContent}
              required
              aria-label="Markdown Content"
              bind:value={markdownContent}
              class="min-h-87.5 w-full flex-1 resize-none overflow-hidden bg-adwaita-bg p-5 font-mono text-sm leading-relaxed text-adwaita-text focus:ring-2 focus:ring-adwaita-accent focus:ring-inset"
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

        <div class="mt-4 mb-10 flex justify-end gap-3 select-none">
          <button
            type="button"
            onclick={handleCancelClick}
            class="inline-flex h-10 items-center justify-center rounded-lg border border-adwaita-border bg-adwaita-card px-5 text-sm font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover">
            Cancel
          </button>

          <button
            type="button"
            onclick={() => handleSaveClick(false)}
            disabled={isSubmitting}
            class="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-adwaita-border bg-adwaita-card px-5 text-sm font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover disabled:opacity-55">
            Save as Draft
          </button>

          <button
            type="button"
            onclick={() => handleSaveClick(true)}
            disabled={isSubmitting}
            class="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-adwaita-accent px-6 text-sm font-semibold text-white transition-colors hover:bg-adwaita-accent-hover disabled:opacity-55">
            {isSubmitting ? 'Saving...' : 'Publish Blog'}
          </button>
        </div>
      </form>
    </section>
  {/if}
</main>

<ConfirmationDialog
  bind:isOpen={showCancelDialog}
  title="Discard Unsaved Changes?"
  message="You have unsaved edits on this blog post. Are you sure you want to discard them?"
  confirmLabel="Discard"
  isDestructive={true}
  onConfirm={() => (window.location.href = '/admin')} />

<ConfirmationDialog
  bind:isOpen={showPublishDialog}
  title="Publish Blog Post?"
  message="This will make this post immediately visible to readers. Do you want to publish?"
  confirmLabel="Publish"
  isDestructive={false}
  onConfirm={() => executeSave(true)} />

<ConfirmationDialog
  bind:isOpen={showSaveDraftDialog}
  title="Save as Draft?"
  message="This will save this post as a private draft. Do you want to proceed?"
  confirmLabel="Save Draft"
  isDestructive={false}
  onConfirm={() => executeSave(false)} />
