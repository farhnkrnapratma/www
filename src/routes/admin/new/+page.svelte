<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { onMount, tick } from 'svelte';
  import { marked } from 'marked';
  import hljs from 'highlight.js';
  import { autoResize, ConfirmationDialog } from '$lib';

  let isCheckingAuth = $state(true);
  let title = $state('');
  let slug = $derived(generateSlug(title));
  let excerpt = $state('');
  let markdownContent = $state('# New Post\n\nWrite your markdown content here...');

  let isDark = $state(false);

  function resizeExcerptTextarea(el: HTMLTextAreaElement) {
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }

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

  let excerptError = $state('');
  let excerptValid = $state(false);

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
      const isDarkVal =
        newTheme === 'dark' ||
        (newTheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      isDark = isDarkVal;
      if (isDarkVal) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }

  $effect(() => {
    if (typeof window !== 'undefined') {
      isDark = document.documentElement.classList.contains('dark');
      const observer = new MutationObserver(() => {
        isDark = document.documentElement.classList.contains('dark');
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      return () => observer.disconnect();
    }
  });

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

      
      const key = id ? `autosave_edit_${id}` : 'autosave_new';
      const savedDraft = localStorage.getItem(key);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          title = parsed.title || title;
          excerpt = parsed.excerpt || excerpt;
          markdownContent = parsed.markdownContent || markdownContent;
        } catch (e) {
          console.error('Failed to parse autosave draft', e);
        }
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

  
  $effect(() => {
    if (activeTab === 'preview' && previewHtml) {
      tick().then(() => {
        const blocks = document.querySelectorAll('.prose-custom pre code');
        blocks.forEach((block) => {
          hljs.highlightElement(block as HTMLElement);
        });
      });
    }
  });

  const highlightedMarkdown = $derived(
    hljs.highlight(markdownContent || '', { language: 'markdown' }).value + (markdownContent.endsWith('\n') ? '\n ' : '')
  );

  let excerptTextareaElement = $state<HTMLTextAreaElement | null>(null);

  $effect(() => {
    if (excerpt !== undefined && excerptTextareaElement) {
      excerptTextareaElement.style.height = 'auto';
      excerptTextareaElement.style.height = `${excerptTextareaElement.scrollHeight}px`;
    }
  });

  let markdownTextareaElement = $state<HTMLTextAreaElement | null>(null);

  $effect(() => {
    if (markdownContent !== undefined && markdownTextareaElement) {
      markdownTextareaElement.style.height = 'auto';
      markdownTextareaElement.style.height = `${markdownTextareaElement.scrollHeight}px`;
    }
  });

  $effect(() => {
    if (markdownTextareaElement) {
      textareaElement = markdownTextareaElement;
    }
  });

  let preElement = $state<HTMLElement | null>(null);
  let textareaElement = $state<HTMLTextAreaElement | null>(null);

  let indentMode = $state<'spaces' | 'tabs'>('spaces');
  let indentSize = $state(4);
  let lineWrapMode = $state<'soft' | 'none'>('soft');

  let indentModeDropdownOpen = $state(false);
  let indentSizeDropdownOpen = $state(false);
  let wrapModeDropdownOpen = $state(false);

  let currentLine = $state(1);
  let currentColumn = $state(1);

  let imageFileInput = $state<HTMLInputElement | null>(null);

  let lineCount = $derived(markdownContent.split('\n').length);

  let lineEnding = $derived(markdownContent.includes('\r\n') ? 'CRLF' : 'LF');

  function updateCursorPosition() {
    if (!textareaElement) return;
    const textBeforeCursor = markdownContent.substring(0, textareaElement.selectionStart);
    const lines = textBeforeCursor.split('\n');
    currentLine = lines.length;
    currentColumn = lines[lines.length - 1].length + 1;
  }

  function handleTextareaKeyDown(e: KeyboardEvent) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const indentStr = indentMode === 'spaces' ? ' '.repeat(indentSize) : '\t';
      markdownContent = markdownContent.substring(0, start) + indentStr + markdownContent.substring(end);
      tick().then(() => {
        target.selectionStart = target.selectionEnd = start + indentStr.length;
        syncScroll();
        updateCursorPosition();
      });
    }
  }

  function insertMarkdown(prefix: string, suffix: string = '') {
    if (!textareaElement) return;
    const start = textareaElement.selectionStart;
    const end = textareaElement.selectionEnd;
    const selectedText = markdownContent.substring(start, end);
    const replacement = prefix + selectedText + suffix;
    markdownContent = markdownContent.substring(0, start) + replacement + markdownContent.substring(end);
    tick().then(() => {
      textareaElement!.focus();
      textareaElement!.selectionStart = start + prefix.length;
      textareaElement!.selectionEnd = start + prefix.length + selectedText.length;
      syncScroll();
      updateCursorPosition();
    });
  }

  async function handleImageUpload(e: Event) {
    const target = e.target as HTMLInputElement;
    const files = target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const allowedTypes = ['image/png', 'image/webp', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      errorMessage = 'Supported image formats are PNG, WebP, JPEG, JPG.';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      errorMessage = 'Image size must be 5MB or less.';
      return;
    }
    isSubmitting = true;
    errorMessage = null;
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `images/${slug || 'post'}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('blog-posts')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true
        });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from('blog-posts')
        .getPublicUrl(path);
      insertMarkdown(`![${file.name.replace(/\.[^/.]+$/, "")}](${urlData.publicUrl})`);
    } catch (err) {
      const error = err as Error;
      errorMessage = error.message || 'Failed to upload image.';
    } finally {
      isSubmitting = false;
      target.value = '';
    }
  }

  function syncScroll() {
    if (textareaElement && preElement) {
      preElement.scrollTop = textareaElement.scrollTop;
      preElement.scrollLeft = textareaElement.scrollLeft;
    }
  }

  let autoSaveStatus = $state<'saving' | 'saved' | 'idle'>('idle');
  let autoSaveTimer: ReturnType<typeof setTimeout>;

  $effect(() => {
    if (markdownContent && !isCheckingAuth) {
      autoSaveStatus = 'saving';
      clearTimeout(autoSaveTimer);
      autoSaveTimer = setTimeout(() => {
        const key = editId ? `autosave_edit_${editId}` : 'autosave_new';
        const data = {
          title,
          excerpt,
          markdownContent,
          timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(data));
        autoSaveStatus = 'saved';
        setTimeout(() => {
          if (autoSaveStatus === 'saved') autoSaveStatus = 'idle';
        }, 1500);
      }, 500);
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
  }, 500);

  const validateExcerptField = debounce(() => {
    const val = excerpt.trim();
    if (val === '') {
      excerptError = '';
      excerptValid = false;
    } else if (val.length > 250) {
      excerptError = 'Excerpt must be 250 characters or less.';
      excerptValid = false;
    } else {
      excerptError = '';
      excerptValid = true;
    }
  }, 500);

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

    const excerptVal = excerpt.trim();
    if (excerptVal === '') {
      errorMessage = 'Excerpt is required.';
      return false;
    }
    if (excerptVal.length > 250) {
      errorMessage = 'Excerpt must be 250 characters or less.';
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

      const key = editId ? `autosave_edit_${editId}` : 'autosave_new';
      localStorage.removeItem(key);
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

<svelte:head>
  {#if isDark}
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css" />
  {:else}
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css" />
  {/if}
</svelte:head>

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
        <div class="rounded-2xl border border-adwaita-border bg-adwaita-card/45 p-6 shadow-xs backdrop-blur-lg transition-colors duration-300 text-left">
          <h2 class="text-base font-bold text-adwaita-text select-none mb-4">
            {isEditMode ? 'Edit blog detail' : 'Write blog detail'}
          </h2>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <div class="lg:col-span-5 flex flex-col gap-2">
              <label for="post-banner" class="text-xs font-bold text-adwaita-subtitle select-none">
                Banner image
              </label>
              
              <div class="relative w-full aspect-[2/1] rounded-lg overflow-hidden border border-adwaita-border bg-adwaita-bg flex items-center justify-center select-none group">
                {#if bannerPreview}
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    class="w-full h-full object-cover" />
                  <button
                    type="button"
                    onclick={() => {
                      bannerFile = null;
                      bannerPreview = null;
                      bannerPath = null;
                    }}
                    class="absolute top-2 right-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/70 p-1 text-white hover:bg-black/90 transition-all"
                    aria-label="Remove banner">
                    <i class="bi bi-x text-lg"></i>
                  </button>
                {:else}
                  <div class="flex flex-col items-center gap-2 text-adwaita-subtitle/65">
                    <i class="bi bi-image text-3xl"></i>
                    <span class="text-[10px]">No banner uploaded</span>
                  </div>
                {/if}
              </div>

              <input
                type="file"
                id="post-banner"
                accept="image/png"
                onchange={handleBannerChange}
                class="mt-2 block w-full text-xs text-adwaita-subtitle file:mr-4 file:cursor-pointer file:rounded-lg file:border file:border-adwaita-border file:bg-adwaita-card file:px-4 file:py-2 file:text-xs file:font-semibold file:text-adwaita-text hover:file:bg-adwaita-hover focus:outline-2 focus:outline-adwaita-accent" />
              
              <span class="text-[10px] text-adwaita-subtitle/75 leading-normal">
                PNG, exactly 1280×640 pixels.
              </span>

              {#if bannerError}
                <div id="post-banner-fb" aria-live="polite" class="mt-1 text-xs leading-none font-medium">
                  <span role="alert" class="flex items-center gap-1 text-adwaita-error">
                    <i class="bi bi-exclamation-circle-fill"></i>{bannerError}
                  </span>
                </div>
              {/if}
            </div>

            
            <div class="lg:col-span-7 flex flex-col gap-4">
              <div class="flex flex-col gap-1">
                <div class="flex items-center justify-between min-h-[20px]">
                  <label for="post-title" class="text-xs font-bold text-adwaita-subtitle">
                    Title <span class="text-adwaita-error">*</span>
                  </label>
                  {#if slug}
                    <div class="flex items-center gap-1 font-sans text-xs text-adwaita-subtitle select-none leading-none">
                      <i class="bi bi-link-45deg text-sm text-adwaita-accent"></i>
                      <span>fkp.my.id/blog/</span><span class="font-bold text-adwaita-accent">{slug}</span>
                    </div>
                  {/if}
                </div>
                
                <div class="relative">
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
                    class="w-full rounded-lg border border-adwaita-border bg-adwaita-bg pl-3 pr-16 py-2 text-sm text-adwaita-text transition-colors placeholder:text-adwaita-subtitle/70 focus:outline-none focus:ring-1 focus:ring-adwaita-accent"
                    class:border-adwaita-error={titleError}
                    class:input-valid={titleValid} />
                  <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-adwaita-subtitle/50 font-mono pointer-events-none select-none">
                    {title.length}/60
                  </span>
                </div>

                <div class="flex items-center justify-between min-h-[16px]">
                  {#if titleError || titleValid}
                    <div id="post-title-fb" aria-live="polite" class="text-xs leading-none font-medium">
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
                  {:else}
                    <div></div>
                  {/if}
                </div>
              </div>

              <div class="flex flex-col gap-1">
                <div class="flex items-center justify-between">
                  <label for="post-excerpt" class="text-xs font-bold text-adwaita-subtitle">
                    Excerpt <span class="text-adwaita-error">*</span>
                  </label>
                </div>
                <div class="relative">
                  <textarea
                    use:autoResize={excerpt}
                    bind:this={excerptTextareaElement}
                    id="post-excerpt"
                    rows="3"
                    maxlength="250"
                    required
                    placeholder="Brief summary of the article (max 250 characters)..."
                    bind:value={excerpt}
                    oninput={() => {
                      excerptError = '';
                      excerptValid = false;
                      validateExcerptField();
                    }}
                    class="no-scrollbar w-full resize-none overflow-hidden rounded-lg border border-adwaita-border bg-adwaita-bg pl-3 pr-14 py-1.5 text-sm text-adwaita-text transition-colors placeholder:text-adwaita-subtitle/70 focus:outline-none focus:ring-1 focus:ring-adwaita-accent"
                    class:border-adwaita-error={excerptError}
                    class:input-valid={excerptValid}
                    style="overflow: hidden; resize: none;"
                  ></textarea>
                  <span class="absolute right-2.5 bottom-2 text-[10px] font-mono pointer-events-none select-none {excerptError ? 'text-adwaita-error' : 'text-adwaita-subtitle/50'}">
                    {excerpt.length}/250
                  </span>
                </div>

                <div class="flex items-center justify-between mt-1 min-h-[16px]">
                  {#if excerptError || excerptValid}
                    <div id="post-excerpt-fb" aria-live="polite" class="text-xs leading-none font-medium">
                      {#if excerptError}
                        <span class="flex items-center gap-1 text-adwaita-error">
                          <i class="bi bi-exclamation-circle-fill"></i>{excerptError}
                        </span>
                      {:else if excerptValid}
                        <span class="flex items-center gap-1 text-adwaita-accent">
                          <i class="bi bi-check-circle-fill"></i>Looks good
                        </span>
                      {/if}
                    </div>
                  {:else}
                    <div></div>
                  {/if}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="boxed-list flex flex-col overflow-hidden text-left">
          
          <div class="flex border-b border-adwaita-border bg-adwaita-card/10 px-4 py-2.5 items-center select-none">
            <div class="inline-flex rounded-lg border border-adwaita-border bg-adwaita-switcher-bg p-1 gap-0.5">
              <button
                type="button"
                onclick={() => (activeTab = 'editor')}
                class="px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer {(
                  activeTab === 'editor'
                ) ?
                  'bg-adwaita-switcher-active text-adwaita-text shadow-xs border border-adwaita-border/10'
                : 'text-adwaita-subtitle hover:text-adwaita-text hover:bg-adwaita-hover/30'}">
                Edit
              </button>
              <button
                type="button"
                onclick={() => (activeTab = 'preview')}
                class="px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer {(
                  activeTab === 'preview'
                ) ?
                  'bg-adwaita-switcher-active text-adwaita-text shadow-xs border border-adwaita-border/10'
                : 'text-adwaita-subtitle hover:text-adwaita-text hover:bg-adwaita-hover/30'}">
                Preview
              </button>
            </div>

            
            <div class="ml-auto flex items-center gap-2 select-none">
              <div class="text-xs text-adwaita-subtitle font-medium pr-1.5 flex items-center">
                {#if autoSaveStatus === 'saving'}
                  <span class="inline-flex items-center gap-1.5">
                    <svg class="animate-spin h-3.5 w-3.5 text-adwaita-subtitle" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                {:else}
                  <span class="inline-flex items-center gap-1.5">
                    <span class="material-symbols-rounded text-[13px] text-adwaita-subtitle">cloud_done</span>
                    Saved
                  </span>
                {/if}
              </div>

              {#if activeTab === 'editor'}
                
                <div class="relative">
                  <button
                    type="button"
                    onclick={() => {
                      indentModeDropdownOpen = !indentModeDropdownOpen;
                      indentSizeDropdownOpen = false;
                      wrapModeDropdownOpen = false;
                    }}
                    class="px-4 py-1.5 text-xs font-semibold rounded-md border border-adwaita-border bg-adwaita-card text-adwaita-subtitle hover:text-adwaita-text hover:bg-adwaita-hover transition-colors cursor-pointer flex items-center gap-1.5 h-7.5"
                    aria-haspopup="true"
                    aria-expanded={indentModeDropdownOpen}>
                    {indentMode === 'spaces' ? 'Spaces' : 'Tabs'}
                    <i class="bi bi-chevron-down text-[9px]"></i>
                  </button>
                  {#if indentModeDropdownOpen}
                    <button class="fixed inset-0 z-40 cursor-default" onclick={() => (indentModeDropdownOpen = false)} aria-label="Close menu"></button>
                    <div class="absolute top-8.5 right-0 z-50 flex min-w-[120px] flex-col rounded-lg border border-adwaita-border bg-adwaita-card py-1 shadow-lg text-xs">
                      <button
                        type="button"
                        onclick={() => {
                          indentMode = 'spaces';
                          indentModeDropdownOpen = false;
                        }}
                        class="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs text-adwaita-text hover:bg-adwaita-hover transition-colors cursor-pointer">
                        <span>Spaces</span>
                        {#if indentMode === 'spaces'}
                          <i class="bi bi-check text-adwaita-accent"></i>
                        {/if}
                      </button>
                      <button
                        type="button"
                        onclick={() => {
                          indentMode = 'tabs';
                          indentModeDropdownOpen = false;
                        }}
                        class="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs text-adwaita-text hover:bg-adwaita-hover transition-colors cursor-pointer">
                        <span>Tabs</span>
                        {#if indentMode === 'tabs'}
                          <i class="bi bi-check text-adwaita-accent"></i>
                        {/if}
                      </button>
                    </div>
                  {/if}
                </div>

                
                <div class="relative">
                  <button
                    type="button"
                    onclick={() => {
                      indentSizeDropdownOpen = !indentSizeDropdownOpen;
                      indentModeDropdownOpen = false;
                      wrapModeDropdownOpen = false;
                    }}
                    class="px-4 py-1.5 text-xs font-semibold rounded-md border border-adwaita-border bg-adwaita-card text-adwaita-subtitle hover:text-adwaita-text hover:bg-adwaita-hover transition-colors cursor-pointer flex items-center gap-1.5 h-7.5"
                    aria-haspopup="true"
                    aria-expanded={indentSizeDropdownOpen}>
                    {indentSize}
                    <i class="bi bi-chevron-down text-[9px]"></i>
                  </button>
                  {#if indentSizeDropdownOpen}
                    <button class="fixed inset-0 z-40 cursor-default" onclick={() => (indentSizeDropdownOpen = false)} aria-label="Close menu"></button>
                    <div class="absolute top-8.5 right-0 z-50 flex min-w-[80px] flex-col rounded-lg border border-adwaita-border bg-adwaita-card py-1 shadow-lg text-xs">
                      {#each [2, 4, 8] as size}
                        <button
                          type="button"
                          onclick={() => {
                            indentSize = size;
                            indentSizeDropdownOpen = false;
                          }}
                          class="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs text-adwaita-text hover:bg-adwaita-hover transition-colors cursor-pointer">
                          <span>{size}</span>
                          {#if indentSize === size}
                            <i class="bi bi-check text-adwaita-accent"></i>
                          {/if}
                        </button>
                      {/each}
                    </div>
                  {/if}
                </div>

                
                <div class="relative">
                  <button
                    type="button"
                    onclick={() => {
                      wrapModeDropdownOpen = !wrapModeDropdownOpen;
                      indentModeDropdownOpen = false;
                      indentSizeDropdownOpen = false;
                    }}
                    class="px-4 py-1.5 text-xs font-semibold rounded-md border border-adwaita-border bg-adwaita-card text-adwaita-subtitle hover:text-adwaita-text hover:bg-adwaita-hover transition-colors cursor-pointer flex items-center gap-1.5 h-7.5"
                    aria-haspopup="true"
                    aria-expanded={wrapModeDropdownOpen}>
                    {lineWrapMode === 'soft' ? 'Soft wrap' : 'No wrap'}
                    <i class="bi bi-chevron-down text-[9px]"></i>
                  </button>
                  {#if wrapModeDropdownOpen}
                    <button class="fixed inset-0 z-40 cursor-default" onclick={() => (wrapModeDropdownOpen = false)} aria-label="Close menu"></button>
                    <div class="absolute top-8.5 right-0 z-50 flex min-w-[120px] flex-col rounded-lg border border-adwaita-border bg-adwaita-card py-1 shadow-lg text-xs">
                      <button
                        type="button"
                        onclick={() => {
                          lineWrapMode = 'soft';
                          wrapModeDropdownOpen = false;
                        }}
                        class="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs text-adwaita-text hover:bg-adwaita-hover transition-colors cursor-pointer">
                        <span>Soft wrap</span>
                        {#if lineWrapMode === 'soft'}
                          <i class="bi bi-check text-adwaita-accent"></i>
                        {/if}
                      </button>
                      <button
                        type="button"
                        onclick={() => {
                          lineWrapMode = 'none';
                          wrapModeDropdownOpen = false;
                        }}
                        class="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs text-adwaita-text hover:bg-adwaita-hover transition-colors cursor-pointer">
                        <span>No wrap</span>
                        {#if lineWrapMode === 'none'}
                          <i class="bi bi-check text-adwaita-accent"></i>
                        {/if}
                      </button>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>
          </div>

          
          <div class="bg-adwaita-bg">
            {#if activeTab === 'editor'}
              <div class="flex flex-row items-stretch w-full overflow-hidden">
                <div class="editor-line-numbers select-none font-mono pt-[20px] pb-[20px] border-r border-adwaita-border/20 bg-adwaita-card/10 select-none">
                  {#each Array(lineCount) as _, i}
                    <div class="line-num-item h-6 leading-[24px] text-right text-[15px] transition-colors pr-3.5 pl-4 {currentLine === i + 1 ? 'text-adwaita-accent bg-adwaita-accent/10 font-bold border-r-2 border-adwaita-accent -mr-[1px]' : 'text-adwaita-subtitle/40'}">
                      {i + 1}
                    </div>
                  {/each}
                </div>

                <div class="relative flex-1 overflow-hidden">
                  <pre
                    bind:this={preElement}
                    class="editor-pre no-scrollbar pointer-events-none absolute inset-0 text-adwaita-text select-none bg-transparent !font-mono !text-[14px] !leading-[24px] !pt-[20px] !pb-[20px] !pr-[20px] !pl-[16px] !m-0 !border-0 !box-border !w-full !overflow-y-hidden {lineWrapMode === 'soft' ? 'whitespace-pre-wrap! break-normal! break-words! overflow-x-hidden!' : 'whitespace-pre! break-normal! overflow-x-auto!'}"
                  ><code class="!font-mono !text-[14px] !leading-[24px] !p-0 !m-0 !block !bg-transparent whitespace-inherit! break-inherit! overflow-wrap-inherit! language-markdown">{@html highlightedMarkdown}</code></pre>

                  <textarea
                    bind:this={markdownTextareaElement}
                    required
                    aria-label="Markdown Content"
                    bind:value={markdownContent}
                    onscroll={syncScroll}
                    oninput={() => { syncScroll(); updateCursorPosition(); }}
                    onclick={updateCursorPosition}
                    onkeyup={updateCursorPosition}
                    onfocus={updateCursorPosition}
                    onkeydown={handleTextareaKeyDown}
                    class="editor-textarea relative w-full bg-transparent text-transparent caret-adwaita-text focus:outline-none focus:ring-0 focus:border-transparent! focus:shadow-none! focus:outline-none! !font-mono !text-[14px] !leading-[24px] !pt-[20px] !pb-[20px] !pr-[20px] !pl-[16px] !m-0 !border-0 !box-border !w-full !overflow-y-hidden {lineWrapMode === 'soft' ? 'whitespace-pre-wrap! break-normal! break-words! overflow-x-hidden!' : 'whitespace-pre! break-normal! overflow-x-auto!'}"
                    style="resize: none;"
                  ></textarea>
                </div>
              </div>
            {:else}
              <div class="prose-custom w-full bg-adwaita-bg p-6">
                {#if previewHtml}
                  {@html previewHtml}
                {:else}
                  <p class="text-adwaita-subtitle italic">Nothing to preview...</p>
                {/if}
              </div>
            {/if}
          </div>

          
          {#if activeTab === 'editor'}
            <div class="flex flex-wrap items-center justify-between border-t border-adwaita-border bg-adwaita-card/10 px-3 py-1.5 select-none text-xs text-adwaita-subtitle">
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  onclick={() => insertMarkdown('# ')}
                  title="H1 Header"
                  class="flex h-7 w-7 items-center justify-center rounded-md hover:bg-adwaita-hover/30 hover:text-adwaita-text transition-colors cursor-pointer">
                  <span class="material-symbols-rounded text-base">format_h1</span>
                </button>
                <button
                  type="button"
                  onclick={() => insertMarkdown('## ')}
                  title="H2 Header"
                  class="flex h-7 w-7 items-center justify-center rounded-md hover:bg-adwaita-hover/30 hover:text-adwaita-text transition-colors cursor-pointer">
                  <span class="material-symbols-rounded text-base">format_h2</span>
                </button>
                <button
                  type="button"
                  onclick={() => insertMarkdown('### ')}
                  title="H3 Header"
                  class="flex h-7 w-7 items-center justify-center rounded-md hover:bg-adwaita-hover/30 hover:text-adwaita-text transition-colors cursor-pointer">
                  <span class="material-symbols-rounded text-base">format_h3</span>
                </button>
                <div class="h-4 w-px bg-adwaita-border mx-1"></div>
                <button
                  type="button"
                  onclick={() => insertMarkdown('**', '**')}
                  title="Bold"
                  class="flex h-7 w-7 items-center justify-center rounded-md hover:bg-adwaita-hover/30 hover:text-adwaita-text transition-colors cursor-pointer">
                  <span class="material-symbols-rounded text-base">format_bold</span>
                </button>
                <button
                  type="button"
                  onclick={() => insertMarkdown('*', '*')}
                  title="Italic"
                  class="flex h-7 w-7 items-center justify-center rounded-md hover:bg-adwaita-hover/30 hover:text-adwaita-text transition-colors cursor-pointer">
                  <span class="material-symbols-rounded text-base">format_italic</span>
                </button>
                <button
                  type="button"
                  onclick={() => insertMarkdown('<u>', '</u>')}
                  title="Underline"
                  class="flex h-7 w-7 items-center justify-center rounded-md hover:bg-adwaita-hover/30 hover:text-adwaita-text transition-colors cursor-pointer">
                  <span class="material-symbols-rounded text-base">format_underlined</span>
                </button>
                <button
                  type="button"
                  onclick={() => insertMarkdown('~~', '~~')}
                  title="Strikethrough"
                  class="flex h-7 w-7 items-center justify-center rounded-md hover:bg-adwaita-hover/30 hover:text-adwaita-text transition-colors cursor-pointer">
                  <span class="material-symbols-rounded text-base">format_strikethrough</span>
                </button>
                <div class="h-4 w-px bg-adwaita-border mx-1"></div>
                <button
                  type="button"
                  onclick={() => imageFileInput?.click()}
                  title="Insert Image"
                  class="flex h-7 w-7 items-center justify-center rounded-md hover:bg-adwaita-hover/30 hover:text-adwaita-text transition-colors cursor-pointer">
                  <span class="material-symbols-rounded text-base">add_photo_alternate</span>
                </button>
                <input
                  type="file"
                  bind:this={imageFileInput}
                  accept="image/png, image/webp, image/jpeg, image/jpg"
                  onchange={handleImageUpload}
                  class="hidden" />
                <button
                  type="button"
                  onclick={() => insertMarkdown('1. ')}
                  title="Numbered List"
                  class="flex h-7 w-7 items-center justify-center rounded-md hover:bg-adwaita-hover/30 hover:text-adwaita-text transition-colors cursor-pointer">
                  <span class="material-symbols-rounded text-base">format_list_numbered</span>
                </button>
                <button
                  type="button"
                  onclick={() => insertMarkdown('- ')}
                  title="Bulleted List"
                  class="flex h-7 w-7 items-center justify-center rounded-md hover:bg-adwaita-hover/30 hover:text-adwaita-text transition-colors cursor-pointer">
                  <span class="material-symbols-rounded text-base">format_list_bulleted</span>
                </button>
                <button
                  type="button"
                  onclick={() => insertMarkdown('```\n', '\n```')}
                  title="Code Block"
                  class="flex h-7 w-7 items-center justify-center rounded-md hover:bg-adwaita-hover/30 hover:text-adwaita-text transition-colors cursor-pointer">
                  <span class="material-symbols-rounded text-base">code_blocks</span>
                </button>
              </div>

              <div class="flex items-center gap-4 text-[11px] font-mono select-none">
                <span class="text-[12.5px] font-semibold tracking-wide">{currentLine}:{currentColumn}</span>
                <span class="flex items-center gap-1 text-[12.5px] font-semibold tracking-wide">
                  <span class="material-symbols-rounded text-[14px]">space_bar</span>
                  {indentSize}
                </span>
                <span class="text-[12.5px] font-semibold tracking-wide">UTF-8</span>
                <span class="text-[12.5px] font-semibold tracking-wide">{lineEnding}</span>
                <span class="relative group cursor-help flex items-center">
                  <span class="material-symbols-rounded text-[16px]">markdown</span>
                  <span class="absolute bottom-full mb-1.5 right-0 hidden group-hover:block bg-adwaita-card text-adwaita-text text-[10px] px-2 py-1 rounded-md border border-adwaita-border whitespace-nowrap shadow-md font-sans">
                    Styling with Markdown is supported
                  </span>
                </span>
              </div>
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

<style>
  .editor-textarea,
  .editor-pre,
  .editor-pre code,
  .editor-pre :global(span),
  .line-num-item {
    font-family: var(--font-mono) !important;
    font-size: 14.5px !important;
    line-height: 24px !important;
    letter-spacing: normal !important;
    font-variant-ligatures: none !important;
    font-feature-settings: normal !important;
  }

  .editor-textarea,
  .editor-pre {
    word-break: normal !important;
    word-wrap: break-word !important;
    overflow-wrap: break-word !important;
  }

  .editor-textarea {
    border: 0 !important;
    margin: 0 !important;
    outline: none !important;
    box-sizing: border-box !important;
  }

  .line-num-item {
    height: 24px !important;
    display: block !important;
  }

  .prose-custom > :global(*:first-child) {
    margin-top: 0 !important;
  }
</style>


