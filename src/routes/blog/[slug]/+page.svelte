<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import type { PageProps } from './$types';
  import hljs from 'highlight.js';
  import { isNameReserved } from '$lib/nameValidator';
  import { autoResize, ConfirmationDialog, SpotlightSearch } from '$lib';
  import { page } from '$app/state';
  import { supabase } from '$lib/supabase';

  let { data }: PageProps = $props();
  const post = $derived(data.post);
  const html = $derived(data.html);

  let showCopySuccess = $state(false);

  function copyToClipboard() {
    if (typeof window === 'undefined') return;
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        showCopySuccess = true;
        setTimeout(() => {
          showCopySuccess = false;
        }, 2000);
      })
      .catch(err => {
        console.error(err);
      });
  }

  let toastMessage = $state('');
  let showToast = $state(false);

  function triggerToast(message: string) {
    toastMessage = message;
    showToast = true;
    setTimeout(() => {
      showToast = false;
    }, 2000);
  }

  function getPrettyLanguage(className: string): string {
    if (!className) return 'Code';
    const match = className.match(/language-(\S+)/);
    if (!match) return 'Code';
    const lang = match[1].toLowerCase();
    const map: Record<string, string> = {
      js: 'JavaScript',
      javascript: 'JavaScript',
      ts: 'TypeScript',
      typescript: 'TypeScript',
      html: 'HTML',
      css: 'CSS',
      rust: 'Rust',
      rs: 'Rust',
      python: 'Python',
      py: 'Python',
      bash: 'Bash',
      sh: 'Shell',
      shell: 'Shell',
      json: 'JSON',
      yaml: 'YAML',
      yml: 'YAML',
      xml: 'XML',
      md: 'Markdown',
      markdown: 'Markdown',
      go: 'Go',
      golang: 'Go',
      cpp: 'C++',
      c: 'C',
      csharp: 'C#',
      cs: 'C#',
      sql: 'SQL',
      dockerfile: 'Docker',
      docker: 'Docker'
    };
    return map[lang] || lang.charAt(0).toUpperCase() + lang.slice(1);
  }

  function setupCodeHeaderBars() {
    const container = document.querySelector('.prose-custom');
    if (!container) return;
    const preBlocks = container.querySelectorAll('pre');
    preBlocks.forEach((el) => {
      const pre = el as HTMLElement;
      if (pre.previousElementSibling?.classList.contains('code-header-bar')) return;

      const codeElement = pre.querySelector('code');
      const langClass = codeElement?.className || '';
      const prettyLang = getPrettyLanguage(langClass);

      const headerBar = document.createElement('div');
      headerBar.className = 'code-header-bar flex items-center justify-between bg-adwaita-bg/95 border border-adwaita-border rounded-t-lg px-4 py-1 text-xs text-adwaita-subtitle font-semibold select-none mt-6';
      
      const leftSpan = document.createElement('span');
      leftSpan.className = 'text-[12.5px] font-sans font-bold uppercase tracking-wider text-adwaita-subtitle leading-none';
      leftSpan.innerText = prettyLang;
      headerBar.appendChild(leftSpan);

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'flex h-5 w-5 items-center justify-center rounded-md border border-adwaita-border/30 hover:bg-adwaita-hover/30 hover:text-adwaita-text transition-colors cursor-pointer text-adwaita-subtitle leading-none';
      copyBtn.innerHTML = '<span class="material-symbols-rounded text-[10.5px] font-bold leading-none" style="font-variation-settings: \'wght\' 800;">content_copy</span>';
      
      copyBtn.addEventListener('click', () => {
        if (!codeElement) return;
        const codeText = codeElement.innerText || codeElement.textContent || '';
        navigator.clipboard.writeText(codeText).then(() => {
          copyBtn.innerHTML = '<span class="material-symbols-rounded text-[10.5px] font-bold leading-none text-palette-green" style="font-variation-settings: \'wght\' 800;">check_small</span>';
          triggerToast('Code copied to clipboard!');
          setTimeout(() => {
            copyBtn.innerHTML = '<span class="material-symbols-rounded text-[10.5px] font-bold leading-none" style="font-variation-settings: \'wght\' 800;">content_copy</span>';
          }, 2000);
        }).catch(err => {
          console.error('Failed to copy code: ', err);
        });
      });

      headerBar.appendChild(copyBtn);

      pre.style.marginTop = '0px';
      pre.style.borderTopLeftRadius = '0px';
      pre.style.borderTopRightRadius = '0px';
      pre.style.borderTopWidth = '0px';
      pre.style.paddingTop = '10px';

      pre.parentNode?.insertBefore(headerBar, pre);
    });
  }

  interface BlogComment {
    id: string;
    post_id: string;
    parent_id: string | null;
    author_name: string;
    content: string;
    is_anonymous?: boolean;
    is_approved: boolean;
    created_at: string;
  }

  interface FlatComment extends BlogComment {
    children: FlatComment[];
    reply_to_author?: string | null;
  }

  let currentPostId = $state<string | null>(null);
  let addedComments = $state<BlogComment[]>([]);
  $effect(() => {
    if (currentPostId !== data.post.id) {
      currentPostId = data.post.id;
      addedComments = [];
    }
  });
  const comments = $derived([...data.comments, ...addedComments]);
  let isDark = $state(false);

  let bannerPublicUrl = $state('');
  $effect(() => {
    if (data.post.banner_path) {
      const { data: res } = supabase.storage.from('blog-posts').getPublicUrl(data.post.banner_path);
      bannerPublicUrl = res.publicUrl;
    } else {
      bannerPublicUrl = '';
    }
  });

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

  const headings = $derived(data.headings || []);
  let activeHeadingId = $state('');

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
  let helpfulnessFeedback = $state<'yes' | 'no' | null>(null);
  let showYesFeedbackDialog = $state(false);
  let showNoFeedbackDialog = $state(false);
  let viewCount = $state<number | null>(null);

  function handleHelpfulness(value: 'yes' | 'no') {
    helpfulnessFeedback = value;
    if (value === 'yes') {
      showYesFeedbackDialog = true;
    } else {
      showNoFeedbackDialog = true;
    }
  }

  $effect(() => {
    void html;
    let headingObserver: IntersectionObserver | null = null;

    tick().then(() => {
      const container = document.querySelector('.prose-custom');
      if (container) {
        setupCodeHeaderBars();
        const elements = container.querySelectorAll('h2, h3');
        if (elements.length === 0) return;

        elements.forEach(el => {
          el.classList.add('group', 'flex', 'items-center', 'scroll-mt-20');

          const existingAnchor = el.querySelector('.anchor-link');
          if (existingAnchor) {
            existingAnchor.remove();
          }

          const anchor = document.createElement('a');
          anchor.href = `#${el.id}`;
          anchor.className =
            'anchor-link opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-adwaita-accent text-sm leading-none';
          anchor.innerHTML = '<i class="bi bi-link-45deg" aria-hidden="true"></i>';
          anchor.onclick = e => {
            e.preventDefault();
            const target = document.getElementById(el.id);
            if (target) {
              target.scrollIntoView({ behavior: 'smooth', block: 'start' });
              history.pushState(null, '', `#${el.id}`);
              activeHeadingId = el.id;
            }
          };
          el.appendChild(anchor);
        });

        headingObserver = new IntersectionObserver(
          entries => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                activeHeadingId = entry.target.id;
              }
            });
          },
          {
            root: null,
            rootMargin: '0px 0px -70% 0px',
            threshold: 0.1,
          },
        );

        elements.forEach(el => headingObserver?.observe(el));
      }
    });

    return () => {
      if (headingObserver) {
        headingObserver.disconnect();
      }
    };
  });

  onMount(() => {
    const saved = localStorage.getItem('theme') as Theme;
    theme = saved || 'auto';
    isDark = document.documentElement.classList.contains('dark');

    const observer = new MutationObserver(() => {
      isDark = document.documentElement.classList.contains('dark');
      const currentSaved = localStorage.getItem('theme') as Theme;
      if (currentSaved) {
        theme = currentSaved;
      }
      setTimeout(() => {
        hljs.highlightAll();
      }, 50);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    hljs.highlightAll();

    (async () => {
      try {
        await fetch('/api/views', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post_id: post.id }),
        });
        const res = await fetch(`/api/views?post_id=${encodeURIComponent(post.id)}`);
        const data = await res.json();
        viewCount = data.views ?? null;
      } catch {
        viewCount = null;
      }
    })();

    return () => {
      observer.disconnect();
    };
  });

  let authorName = $state('');
  let isAnonymous = $state(false);
  let commentContent = $state('');
  let replyTo = $state<BlogComment | null>(null);
  let isSubmitting = $state(false);
  let feedbackMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);
  const commentTree = $derived(buildCommentTree(comments));

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function formatReadTime(readTime?: string | null) {
    return (readTime || '1 min read').replace(/\s*read\s*/gi, '');
  }

  function buildCommentTree(items: BlogComment[]): FlatComment[] {
    const commentMap = new SvelteMap<string, FlatComment>();
    for (const item of items) {
      commentMap.set(item.id, { ...item, children: [] });
    }

    const roots: FlatComment[] = [];

    for (const item of items) {
      const node = commentMap.get(item.id)!;
      if (item.parent_id && commentMap.has(item.parent_id)) {
        const parentNode = commentMap.get(item.parent_id)!;
        node.reply_to_author = getCommentAuthor(parentNode);
        parentNode.children.push(node);
      } else {
        roots.push(node);
      }
    }

    const sortFn = (a: FlatComment, b: FlatComment) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime();

    roots.sort(sortFn);

    for (const node of commentMap.values()) {
      node.children.sort(sortFn);
    }

    return roots;
  }

  function getCommentAuthor(comment: BlogComment) {
    return comment.is_anonymous ? 'Anonymous' : comment.author_name;
  }

  function getCommentIcon(comment: BlogComment) {
    if (comment.author_name === 'Admin') return 'crown';
    return comment.is_anonymous ? 'domino_mask' : 'person';
  }

  function cancelReply() {
    replyTo = null;
    commentContent = '';
    feedbackMessage = null;
    errors = { authorName: '', commentContent: '' };
  }

  function trunkAction(node: HTMLElement) {
    if (typeof window === 'undefined') return;

    function update() {
      const parentAvatar = node.querySelector(
        ':scope > .comment-row-wrapper .parent-avatar',
      ) as HTMLElement;
      const lastAvatar = node.querySelector(
        ':scope > .replies-container > .child-wrapper:last-child > div > .comment-row-wrapper .last-reply-avatar',
      ) as HTMLElement;
      const trunkLine = node.querySelector(':scope > .trunk-line-single') as HTMLElement;
      if (parentAvatar && lastAvatar && trunkLine) {
        const parentRect = parentAvatar.getBoundingClientRect();
        const lastRect = lastAvatar.getBoundingClientRect();
        const nodeRect = node.getBoundingClientRect();

        const parentCenterY = parentRect.top + parentRect.height / 2 - nodeRect.top;
        const lastCenterY = lastRect.top + lastRect.height / 2 - nodeRect.top;

        trunkLine.style.top = `${parentCenterY}px`;
        trunkLine.style.height = `${lastCenterY - parentCenterY - 8}px`;
      }
    }

    setTimeout(update, 0);

    const observer = new ResizeObserver(() => {
      update();
    });
    observer.observe(node);

    return {
      destroy() {
        observer.disconnect();
      },
    };
  }

  let errors = $state({ authorName: '', commentContent: '' });
  let valid = $state({ authorName: false, commentContent: false });

  function debounce<T extends unknown[]>(cb: (...args: T) => void, ms: number) {
    let timer: ReturnType<typeof setTimeout>;
    return (...args: T) => {
      clearTimeout(timer);
      timer = setTimeout(() => cb(...args), ms);
    };
  }

  const validateAuthorName = debounce(() => {
    if (isAnonymous) {
      valid.authorName = false;
      return;
    }
    if (authorName.trim() === '') {
      errors.authorName = '';
      valid.authorName = false;
    } else if (isNameReserved(authorName)) {
      errors.authorName = 'This name cannot be used. Please use another name.';
      valid.authorName = false;
    } else {
      errors.authorName = '';
      valid.authorName = true;
    }
  }, 500);

  const validateCommentContent = debounce(() => {
    if (commentContent.trim() === '') {
      errors.commentContent = '';
      valid.commentContent = false;
    } else {
      errors.commentContent = '';
      valid.commentContent = true;
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

  function validate() {
    const nameErr = !isAnonymous && authorName.trim() === '' ? 'Name is required.' : '';
    const msgErr = commentContent.trim() === '' ? 'Message is required.' : '';
    const nameReservedErr =
      !isAnonymous && !nameErr && isNameReserved(authorName) ?
        'This name cannot be used. Please use another name.'
      : '';

    errors = {
      authorName: nameErr || nameReservedErr,
      commentContent: msgErr,
    };
    if (errors.authorName) valid.authorName = false;
    if (errors.commentContent) valid.commentContent = false;

    return !errors.authorName && !errors.commentContent;
  }

  async function handleSubmit(e: SubmitEvent, parentId: string | null = null) {
    e.preventDefault();
    errors = { authorName: '', commentContent: '' };
    if (!validate()) return;

    isSubmitting = true;
    feedbackMessage = null;

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: post.id,
          parentId,
          authorName: isAnonymous ? '' : sanitizeInput(authorName.trim()),
          isAnonymous,
          content: sanitizeInput(commentContent.trim()),
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || 'Failed to submit comment');
      }

      if (result.is_approved) {
        addedComments = [...addedComments, result.comment];
        feedbackMessage = {
          type: 'success',
          text: parentId ? 'Your reply has been posted.' : 'Your comment has been posted.',
        };
        commentContent = '';
        replyTo = null;
      } else {
        feedbackMessage = {
          type: 'error',
          text: 'Your comment was blocked by AI content moderation (flagged as inappropriate).',
        };
      }
    } catch (err) {
      const error = err as Error;
      feedbackMessage = {
        type: 'error',
        text: error.message || 'An error occurred while posting your comment.',
      };
    } finally {
      isSubmitting = false;
    }
  }
</script>

<svelte:head>
  <title>{post.title} | Farhan Kurnia Pratama</title>
  <meta
    name="description"
    content={post.excerpt || 'Read this article on my blog.'} />

  <meta
    property="og:type"
    content="article" />
  <meta
    property="og:url"
    content={'https://fkp.my.id/blog/' + post.slug} />
  <meta
    property="og:title"
    content={post.title} />
  <meta
    property="og:description"
    content={post.excerpt || 'Read this article on my blog.'} />
  {#if bannerPublicUrl}
    <meta
      property="og:image"
      content={bannerPublicUrl} />
  {/if}

  <meta
    property="twitter:card"
    content="summary_large_image" />
  <meta
    property="twitter:url"
    content={'https://fkp.my.id/blog/' + post.slug} />
  <meta
    property="twitter:title"
    content={post.title} />
  <meta
    property="twitter:description"
    content={post.excerpt || 'Read this article on my blog.'} />
  {#if bannerPublicUrl}
    <meta
      property="twitter:image"
      content={bannerPublicUrl} />
  {/if}

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
  class="fixed top-0 z-40 flex h-15 w-full items-center justify-between border-b border-adwaita-border bg-adwaita-card/60 px-3 font-sans shadow-xs backdrop-blur-lg transition-colors duration-300 sm:px-5">
  <a
    href="/#blogs"
    class="inline-flex h-9 items-center justify-center rounded-lg border border-adwaita-border bg-adwaita-card px-4 text-xs font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover">
    <i
      class="bi bi-arrow-left mr-2"
      aria-hidden="true"></i>
    Back to Blog
  </a>
  <div class="flex items-center gap-2">
    <SpotlightSearch />
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
  <div class="relative mx-auto w-full max-w-7xl px-6 pt-10 pb-16 xl:grid xl:grid-cols-12 xl:gap-8">
    <article
      class="mx-auto flex w-full flex-col pt-4 md:w-[80%] lg:w-[50%] xl:col-span-6 xl:col-start-4 xl:mx-0 xl:w-auto">
      <header class="mb-8 border-b border-adwaita-border pb-6">
        <h1
          class="text-4xl leading-tight font-extrabold tracking-tight text-adwaita-text md:text-5xl">
          {post.title}
        </h1>
        {#if post.excerpt}
          <p class="mt-3 text-base leading-relaxed text-adwaita-subtitle">
            {post.excerpt}
          </p>
        {/if}
        <div
          class="mt-4 flex items-center gap-x-2.5 font-sans text-[11px] font-semibold text-adwaita-subtitle select-none whitespace-nowrap overflow-x-auto no-scrollbar w-full">
          <span class="inline-flex items-center gap-1 leading-none">
            <span
              class="material-symbols-rounded inline-block text-[10px] font-thin leading-none"
              style="font-variation-settings: 'wght' 100; transform: scale(0.72); transform-origin: center;"
              aria-hidden="true">calendar_clock</span>
            {formatDate(post.created_at)}
          </span>
          <span class="inline-flex items-center gap-1 leading-none">
            <span
              class="material-symbols-rounded inline-block text-[10px] font-thin leading-none"
              style="font-variation-settings: 'wght' 100; transform: scale(0.72); transform-origin: center;"
              aria-hidden="true">av_timer</span>
            {formatReadTime(post.read_time)}
          </span>
          <span class="inline-flex items-center gap-1 leading-none">
            <span
              class="material-symbols-rounded inline-block text-[10px] font-thin leading-none"
              style="font-variation-settings: 'wght' 100; transform: scale(0.72); transform-origin: center;"
              aria-hidden="true">forum</span>
            {comments.length}
          </span>
          {#if viewCount !== null}
            <span class="inline-flex items-center gap-1 leading-none">
              <span
                class="material-symbols-rounded inline-block text-[10px] font-thin leading-none"
                style="font-variation-settings: 'wght' 100; transform: scale(0.72); transform-origin: center;"
                aria-hidden="true">visibility</span>
              {viewCount}
            </span>
          {/if}
        </div>
      </header>

      <div class="prose-custom w-full">
        {@html html}
      </div>

      <div
        class="mt-10 flex flex-col items-center justify-between gap-4 border-t border-adwaita-border pt-8 select-none sm:flex-row">
        <div>
          <h3 class="text-sm font-bold text-adwaita-text">Was this article helpful?</h3>
          <p class="mt-0.5 text-xs text-adwaita-subtitle">
            Help us improve by letting us know your thoughts.
          </p>
        </div>
        <div class="flex items-center gap-3">
          {#if helpfulnessFeedback === null}
            <button
              type="button"
              onclick={() => handleHelpfulness('yes')}
              class="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-adwaita-border bg-adwaita-card px-4 text-xs font-bold text-adwaita-text transition-colors hover:bg-adwaita-hover focus:outline-2 focus:outline-adwaita-accent"
              aria-label="Yes, this article was helpful">
              <i class="bi bi-hand-thumbs-up text-sm"></i>
              Yes
            </button>

            <button
              type="button"
              onclick={() => handleHelpfulness('no')}
              class="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-adwaita-border bg-adwaita-card px-4 text-xs font-bold text-adwaita-text transition-colors hover:bg-adwaita-hover focus:outline-2 focus:outline-adwaita-accent"
              aria-label="No, this article was not helpful">
              <i class="bi bi-hand-thumbs-down text-sm"></i>
              No
            </button>
          {:else if helpfulnessFeedback === 'yes'}
            <span
              class="flex animate-pulse items-center gap-1.5 text-xs font-bold text-adwaita-accent">
              <i class="bi bi-heart-fill"></i> Thank you for your feedback!
            </span>
          {:else}
            <span class="flex items-center gap-1.5 text-xs font-bold text-adwaita-subtitle">
              <i class="bi bi-emoji-neutral"></i> Redirecting to feedback...
            </span>
          {/if}
        </div>
      </div>

      <div class="mt-12 border-t border-adwaita-border pt-8 select-none">
        <h3 class="mb-4 text-sm font-bold tracking-tight text-adwaita-text">Share this Blog</h3>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <button
            onclick={copyToClipboard}
            class="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-adwaita-border bg-adwaita-card px-4 text-xs font-semibold text-adwaita-text transition-colors select-none hover:bg-adwaita-hover hover:text-adwaita-accent"
            aria-label="Copy link to clipboard"
            title="Copy Link">
            <i
              class="bi {showCopySuccess ? 'bi-check2 text-palette-green' : 'bi-link-45deg'}"
              aria-hidden="true"></i>
            <span class="hidden sm:inline">{showCopySuccess ? 'Copied!' : 'Copy'}</span>
          </button>
          <a
            href="https://twitter.com/intent/tweet?url={encodeURIComponent(
              page.url.href,
            )}&text={encodeURIComponent(post.title)}"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-adwaita-border bg-adwaita-card px-4 text-xs font-semibold text-adwaita-text transition-colors select-none hover:bg-adwaita-hover hover:text-adwaita-accent"
            aria-label="Share on X (opens in a new tab)"
            title="Share on X">
            <i
              class="bi bi-twitter-x"
              aria-hidden="true"></i>
            <span class="hidden sm:inline">X</span>
          </a>
          <a
            href="https://www.facebook.com/sharer/sharer.php?u={encodeURIComponent(page.url.href)}"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-adwaita-border bg-adwaita-card px-4 text-xs font-semibold text-adwaita-text transition-colors select-none hover:bg-adwaita-hover hover:text-adwaita-accent"
            aria-label="Share on Facebook (opens in a new tab)"
            title="Share on Facebook">
            <i
              class="bi bi-facebook"
              aria-hidden="true"></i>
            <span class="hidden sm:inline">Facebook</span>
          </a>
          <a
            href="https://www.linkedin.com/sharing/share-offsite/?url={encodeURIComponent(
              page.url.href,
            )}"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-adwaita-border bg-adwaita-card px-4 text-xs font-semibold text-adwaita-text transition-colors select-none hover:bg-adwaita-hover hover:text-adwaita-accent"
            aria-label="Share on LinkedIn (opens in a new tab)"
            title="Share on LinkedIn">
            <i
              class="bi bi-linkedin"
              aria-hidden="true"></i>
            <span class="hidden sm:inline">LinkedIn</span>
          </a>
          <a
            href="mailto:?subject={encodeURIComponent(post.title)}&body={encodeURIComponent(
              page.url.href,
            )}"
            class="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-adwaita-border bg-adwaita-card px-4 text-xs font-semibold text-adwaita-text transition-colors select-none hover:bg-adwaita-hover hover:text-adwaita-accent"
            aria-label="Share via Email"
            title="Share via Email">
            <i
              class="bi bi-envelope"
              aria-hidden="true"></i>
            <span class="hidden sm:inline">Email</span>
          </a>
        </div>
      </div>

      <div
        class="mt-8 flex flex-col items-center gap-5 rounded-2xl border border-adwaita-border bg-adwaita-card/45 p-6 select-none sm:flex-row sm:items-start">
        <img
          src="/android-chrome-512x512.png"
          alt="Farhan Kurnia Pratama"
          class="h-20 w-20 shrink-0 rounded-full border border-adwaita-border object-cover object-top" />
        <div class="min-w-0 flex-1 text-center sm:text-left">
          <h4 class="text-base leading-snug font-bold text-adwaita-text">Farhan Kurnia Pratama</h4>
          <p class="mt-0.5 text-xs font-semibold text-adwaita-subtitle">
            Linux/Unix, FOSS, and Cybersecurity
          </p>
          <p class="mt-3 text-sm leading-relaxed text-adwaita-subtitle/90">
            Security-focused Software Engineer with expertise in Linux/Unix and FOSS, dedicated to
            building reliable, maintainable, and privacy-centric systems.
          </p>

          <div class="mt-4 flex items-center justify-center gap-4 sm:justify-start">
            <a
              href="https://github.com/farhnkrnapratma"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-adwaita-border bg-adwaita-card text-adwaita-subtitle transition-colors hover:bg-adwaita-hover hover:text-adwaita-accent"
              aria-label="GitHub (opens in a new tab)">
              <i
                class="bi bi-github flex items-center justify-center text-base leading-none"
                aria-hidden="true"></i>
            </a>
            <a
              href="https://linkedin.com/in/farhnkrnapratma"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-adwaita-border bg-adwaita-card text-adwaita-subtitle transition-colors hover:bg-adwaita-hover hover:text-adwaita-accent"
              aria-label="LinkedIn (opens in a new tab)">
              <i
                class="bi bi-linkedin flex items-center justify-center text-base leading-none"
                aria-hidden="true"></i>
            </a>
            <a
              href="https://x.com/farhnkrnapratma"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-adwaita-border bg-adwaita-card text-adwaita-subtitle transition-colors hover:bg-adwaita-hover hover:text-adwaita-accent"
              aria-label="X (opens in a new tab)">
              <i
                class="bi bi-twitter-x flex items-center justify-center text-base leading-none"
                aria-hidden="true"></i>
            </a>
            <a
              href="https://facebook.com/farhnkrnapratma"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-adwaita-border bg-adwaita-card text-adwaita-subtitle transition-colors hover:bg-adwaita-hover hover:text-adwaita-accent"
              aria-label="Facebook (opens in a new tab)">
              <i
                class="bi bi-facebook flex items-center justify-center text-base leading-none"
                aria-hidden="true"></i>
            </a>
            <a
              href="https://instagram.com/farhnkrnapratma"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-adwaita-border bg-adwaita-card text-adwaita-subtitle transition-colors hover:bg-adwaita-hover hover:text-adwaita-accent"
              aria-label="Instagram (opens in a new tab)">
              <i
                class="bi bi-instagram flex items-center justify-center text-base leading-none"
                aria-hidden="true"></i>
            </a>
            <a
              href="https://threads.net/@farhnkrnapratma"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-adwaita-border bg-adwaita-card text-adwaita-subtitle transition-colors hover:bg-adwaita-hover hover:text-adwaita-accent"
              aria-label="Threads (opens in a new tab)">
              <i
                class="bi bi-threads flex items-center justify-center text-base leading-none"
                aria-hidden="true"></i>
            </a>
          </div>
        </div>
      </div>

      <section class="mt-16 border-t border-adwaita-border pt-10">
        <h2 class="mb-8 text-xl font-bold tracking-tight text-adwaita-text">
          Comments ({comments.length})
        </h2>

        {#if feedbackMessage}
          <div
            class="mb-6 rounded-lg p-3 text-sm font-semibold {feedbackMessage.type === 'success' ?
              'border border-palette-green/30 bg-palette-green/10 text-palette-green'
            : 'border border-palette-coral/30 bg-palette-coral/10 text-palette-coral'}">
            {feedbackMessage.text}
          </div>
        {/if}

        {#if !replyTo}
          <div
            class="mb-8 rounded-2xl border border-adwaita-border bg-adwaita-card/45 p-5 text-left shadow-xs backdrop-blur-lg transition-colors duration-300">
            <div class="mb-4 select-none">
              <h3 class="text-sm font-bold text-adwaita-text">Leave a Comment</h3>
            </div>

            <form
              novalidate
              onsubmit={e => handleSubmit(e)}
              class="flex flex-col gap-2.5">
              <label
                for="comment-anon"
                class="flex cursor-pointer items-center gap-2 text-xs font-bold text-adwaita-label select-none">
                <input
                  type="checkbox"
                  id="comment-anon"
                  bind:checked={isAnonymous}
                  aria-describedby="anon-help-main"
                  class="h-3.5 w-3.5 cursor-pointer rounded border-adwaita-border text-adwaita-accent focus:ring-adwaita-accent" />
                Comment anonymously
              </label>
              <span
                id="anon-help-main"
                class="sr-only">
                If checked, your name is hidden and your comment is posted as Anonymous.
              </span>
              <div class="flex flex-col gap-1">
                <label
                  for="comment-author"
                  class="text-xs font-bold text-adwaita-label select-none">
                  Name {#if !isAnonymous}<span
                      aria-hidden="true"
                      class="text-adwaita-error">*</span
                    ><span class="sr-only">(required)</span>{/if}
                </label>
                <div class="w-full">
                  <input
                    type="text"
                    id="comment-author"
                    disabled={isAnonymous}
                    aria-required={!isAnonymous}
                    autocomplete="name"
                    aria-invalid={!!errors.authorName}
                    aria-describedby="comment-author-fb"
                    placeholder={isAnonymous ? 'Anonymous' : 'Enter your name'}
                    bind:value={authorName}
                    oninput={() => {
                      errors.authorName = '';
                      valid.authorName = false;
                      validateAuthorName();
                    }}
                    class="w-full rounded-lg border border-adwaita-border bg-adwaita-bg px-3 py-1.5 text-sm text-adwaita-text transition-colors placeholder:text-adwaita-label/70 disabled:opacity-60"
                    class:border-adwaita-error={errors.authorName}
                    class:input-valid={valid.authorName && !isAnonymous} />
                  <div
                    id="comment-author-fb"
                    aria-live="polite"
                    class="mt-1 h-4 text-xs leading-none font-medium">
                    {#if errors.authorName}
                      <span
                        role="alert"
                        class="flex items-center gap-1 text-adwaita-error">
                        <i class="bi bi-exclamation-circle-fill"></i>{errors.authorName}
                      </span>
                    {:else if valid.authorName && !isAnonymous}
                      <span class="flex items-center gap-1 text-adwaita-accent">
                        <i class="bi bi-check-circle-fill"></i>Looks good
                      </span>
                    {/if}
                  </div>
                </div>
              </div>

              <div class="flex flex-col gap-1">
                <label
                  for="comment-msg"
                  class="text-xs font-bold text-adwaita-label select-none">
                  Message <span
                    aria-hidden="true"
                    class="text-adwaita-error">*</span
                  ><span class="sr-only">(required)</span>
                </label>
                <div class="relative w-full">
                  <textarea
                    use:autoResize={commentContent}
                    id="comment-msg"
                    rows="3"
                    maxlength="1000"
                    placeholder="Enter your message"
                    bind:value={commentContent}
                    oninput={() => {
                      errors.commentContent = '';
                      valid.commentContent = false;
                      validateCommentContent();
                    }}
                    aria-required="true"
                    aria-invalid={!!errors.commentContent}
                    aria-describedby="comment-msg-count comment-msg-fb"
                    class="no-scrollbar w-full resize-none overflow-hidden rounded-lg border border-adwaita-border bg-adwaita-bg px-3 py-1.5 pr-16 text-sm text-adwaita-text transition-colors placeholder:text-adwaita-label/70"
                    class:border-adwaita-error={errors.commentContent}
                    class:input-valid={valid.commentContent}></textarea>
                  <div
                    class="pointer-events-none absolute right-3 bottom-2.5 z-10 font-mono text-[10px] text-adwaita-label select-none"
                    id="comment-msg-count"
                    aria-live="polite">
                    {commentContent.length}/1000
                  </div>
                </div>
                <div
                  id="comment-msg-fb"
                  aria-live="polite"
                  class="mt-0.5 h-4 text-xs leading-none font-medium">
                  {#if errors.commentContent}
                    <span
                      role="alert"
                      class="flex items-center gap-1 text-adwaita-error">
                      <i class="bi bi-exclamation-circle-fill"></i>{errors.commentContent}
                    </span>
                  {:else if valid.commentContent}
                    <span class="flex items-center gap-1 text-adwaita-accent">
                      <i class="bi bi-check-circle-fill"></i>Looks good
                    </span>
                  {/if}
                </div>
              </div>

              <div class="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  class="inline-flex cursor-pointer items-center justify-center rounded-lg bg-adwaita-focus px-5 py-2 text-sm font-semibold text-white transition-colors select-none hover:bg-adwaita-focus/90 disabled:cursor-not-allowed disabled:opacity-55">
                  {isSubmitting ? 'Validating...' : 'Post Comment'}
                </button>
              </div>
            </form>
          </div>
        {/if}

        {#if comments.length === 0}
          <div class="boxed-list p-6 text-center text-adwaita-subtitle">No comments yet.</div>
        {:else}
          {#snippet commentNode(comment: FlatComment, depth: number, isLastChildOfParent: boolean)}
            <div
              class="relative flex flex-col gap-2.5"
              use:trunkAction>
              {#if comment.children && comment.children.length > 0}
                <div
                  class="trunk-line-single absolute z-0 border-l border-adwaita-subtitle/10"
                  style="left: 16px; width: 0px;">
                </div>
              {/if}

              <div class="comment-row-wrapper relative flex items-start gap-3">
                <div
                  class="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-adwaita-border bg-adwaita-card text-adwaita-subtitle"
                  class:parent-avatar={comment.children && comment.children.length > 0}
                  class:last-reply-avatar={isLastChildOfParent}>
                  <span
                    class="material-symbols-rounded text-sm"
                    style="font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;"
                    aria-hidden="true">
                    {getCommentIcon(comment)}
                  </span>
                </div>

                <div class="min-w-0 flex-1">
                  <div
                    class="inline-block max-w-full border border-adwaita-border bg-adwaita-card/50 px-4 py-2 text-left"
                    style="border-radius: 18px;">
                    <div class="text-xs font-bold text-adwaita-text/95">
                      {getCommentAuthor(comment)}
                    </div>
                    <p class="mt-0.5 text-sm leading-relaxed text-adwaita-text/90">
                      {#if comment.reply_to_author}
                        <span class="mr-1.5 text-xs font-bold text-palette-green"
                          >{comment.reply_to_author}</span>
                      {/if}
                      <span class="whitespace-pre-line">{comment.content}</span>
                    </p>
                  </div>

                  <div class="mt-1 ml-2 flex items-center gap-3 text-[10px] text-adwaita-subtitle">
                    <span>{formatDate(comment.created_at)}</span>
                    <button
                      type="button"
                      onclick={() => {
                        replyTo = comment;
                        feedbackMessage = null;
                        commentContent = '';
                      }}
                      class="inline-flex h-6 cursor-pointer items-center rounded bg-adwaita-border/30 px-2 py-0.5 font-bold text-adwaita-text/70 transition-colors hover:bg-adwaita-border hover:text-adwaita-accent">
                      Reply
                    </button>
                  </div>

                  {#if replyTo?.id === comment.id}
                    <form
                      novalidate
                      onsubmit={e => handleSubmit(e, comment.id)}
                      class="mt-3 rounded-xl border border-adwaita-border bg-adwaita-bg/60 p-4">
                      <div class="mb-3 flex items-center justify-between gap-3">
                        <p class="text-xs font-semibold text-adwaita-subtitle">
                          Replying to {getCommentAuthor(comment)}
                        </p>
                        <button
                          type="button"
                          onclick={cancelReply}
                          class="inline-flex h-8 cursor-pointer items-center justify-center rounded-lg border border-adwaita-border bg-adwaita-card px-3 text-xs font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover">
                          Cancel
                        </button>
                      </div>

                      <div class="flex flex-col gap-4">
                        <label
                          for="reply-anon-{comment.id}"
                          class="flex cursor-pointer items-center gap-2 text-xs font-bold text-adwaita-label select-none">
                          <input
                            type="checkbox"
                            id="reply-anon-{comment.id}"
                            bind:checked={isAnonymous}
                            aria-describedby="anon-help-reply-{comment.id}"
                            class="h-3.5 w-3.5 cursor-pointer rounded border-adwaita-border text-adwaita-accent focus:ring-adwaita-accent" />
                          Comment anonymously
                        </label>
                        <span
                          id="anon-help-reply-{comment.id}"
                          class="sr-only">
                          If checked, your name is hidden and your comment is posted as Anonymous.
                        </span>

                        <div class="flex flex-col gap-1">
                          <label
                            for="reply-author-{comment.id}"
                            class="text-xs font-bold text-adwaita-label select-none">
                            Name {#if !isAnonymous}<span
                                aria-hidden="true"
                                class="text-adwaita-error">*</span
                              ><span class="sr-only">(required)</span>{/if}
                          </label>
                          <div class="w-full">
                            <input
                              type="text"
                              id="reply-author-{comment.id}"
                              disabled={isAnonymous}
                              aria-required={!isAnonymous}
                              autocomplete="name"
                              aria-invalid={!!errors.authorName}
                              aria-describedby="reply-author-fb-{comment.id}"
                              placeholder={isAnonymous ? 'Anonymous' : 'Enter your name'}
                              bind:value={authorName}
                              oninput={() => {
                                errors.authorName = '';
                                valid.authorName = false;
                                validateAuthorName();
                              }}
                              class="w-full rounded-lg border border-adwaita-border bg-adwaita-bg px-3 py-1.5 text-sm text-adwaita-text transition-colors placeholder:text-adwaita-label/70 disabled:opacity-60"
                              class:border-adwaita-error={errors.authorName}
                              class:input-valid={valid.authorName && !isAnonymous} />
                            <div
                              id="reply-author-fb-{comment.id}"
                              aria-live="polite"
                              class="mt-1 h-4 text-xs leading-none font-medium">
                              {#if errors.authorName}
                                <span
                                  role="alert"
                                  class="flex items-center gap-1 text-adwaita-error">
                                  <i class="bi bi-exclamation-circle-fill"></i>{errors.authorName}
                                </span>
                              {:else if valid.authorName && !isAnonymous}
                                <span class="flex items-center gap-1 text-adwaita-accent">
                                  <i class="bi bi-check-circle-fill"></i>Looks good
                                </span>
                              {/if}
                            </div>
                          </div>
                        </div>

                        <div class="flex flex-col gap-1">
                          <label
                            for="reply-msg-{comment.id}"
                            class="text-xs font-bold text-adwaita-label select-none">
                            Message <span
                              aria-hidden="true"
                              class="text-adwaita-error">*</span
                            ><span class="sr-only">(required)</span>
                          </label>
                          <div class="relative w-full">
                            <textarea
                              use:autoResize={commentContent}
                              id="reply-msg-{comment.id}"
                              rows="3"
                              maxlength="1000"
                              placeholder="Enter your message"
                              bind:value={commentContent}
                              oninput={() => {
                                errors.commentContent = '';
                                valid.commentContent = false;
                                validateCommentContent();
                              }}
                              aria-required="true"
                              aria-invalid={!!errors.commentContent}
                              aria-describedby="reply-msg-count-{comment.id} reply-msg-fb-{comment.id}"
                              class="no-scrollbar w-full resize-none overflow-hidden rounded-lg border border-adwaita-border bg-adwaita-bg px-3 py-1.5 pr-16 text-sm text-adwaita-text transition-colors placeholder:text-adwaita-label/70"
                              class:border-adwaita-error={errors.commentContent}
                              class:input-valid={valid.commentContent}></textarea>
                            <div
                              class="pointer-events-none absolute right-3 bottom-2.5 z-10 font-mono text-[10px] text-adwaita-label select-none"
                              id="reply-msg-count-{comment.id}"
                              aria-live="polite">
                              {commentContent.length}/1000
                            </div>
                          </div>
                          <div
                            id="reply-msg-fb-{comment.id}"
                            aria-live="polite"
                            class="mt-0.5 h-4 text-xs leading-none font-medium">
                            {#if errors.commentContent}
                              <span
                                role="alert"
                                class="flex items-center gap-1 text-adwaita-error">
                                <i class="bi bi-exclamation-circle-fill"></i>{errors.commentContent}
                              </span>
                            {:else if valid.commentContent}
                              <span class="flex items-center gap-1 text-adwaita-accent">
                                <i class="bi bi-check-circle-fill"></i>Looks good
                              </span>
                            {/if}
                          </div>
                        </div>

                        <div class="flex justify-end">
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            class="inline-flex cursor-pointer items-center justify-center rounded-lg bg-adwaita-focus px-5 py-2 text-sm font-semibold text-white transition-colors select-none hover:bg-adwaita-focus/90 disabled:cursor-not-allowed disabled:opacity-55">
                            {isSubmitting ? 'Validating...' : 'Post Reply'}
                          </button>
                        </div>
                      </div>
                    </form>
                  {/if}
                </div>
              </div>

              {#if comment.children && comment.children.length > 0}
                <div
                  class="replies-container relative"
                  style="padding-left: clamp(16px, 5vw, 44px);">
                  {#each comment.children as child, i (child.id)}
                    <div class="child-wrapper relative mt-4">
                      <div
                        class="absolute z-0 border-b border-l border-adwaita-subtitle/10"
                        style="left: -28px; top: -16px; width: 28px; height: 32px; border-bottom-left-radius: 10px;">
                      </div>
                      {@render commentNode(child, depth + 1, i === comment.children.length - 1)}
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {/snippet}

          <div class="flex flex-col gap-6">
            {#each commentTree as rootComment (rootComment.id)}
              {@render commentNode(rootComment, 0, false)}
            {/each}
          </div>
        {/if}
      </section>
    </article>

    <aside class="sticky top-24 hidden h-fit select-none xl:col-span-3 xl:col-start-10 xl:block">
      <div class="boxed-list border border-adwaita-border bg-adwaita-card/45 p-5 backdrop-blur-lg">
        <h3 class="mb-3 text-xs font-bold tracking-wider text-adwaita-subtitle uppercase">
          In this article
        </h3>

        {#if headings.length === 0}
          <p class="text-xs text-adwaita-subtitle italic">No subheadings found.</p>
        {:else}
          <ul class="flex flex-col gap-2">
            {#each headings as heading, index (heading.id + '-' + index)}
              <li
                class="text-xs"
                style="padding-left: {(heading.level - 2) * 12}px;">
                <a
                  href="#{heading.id}"
                  onclick={e => {
                    e.preventDefault();
                    const target = document.getElementById(heading.id);
                    if (target) {
                      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      history.pushState(null, '', `#${heading.id}`);
                      activeHeadingId = heading.id;
                    }
                  }}
                  class="block py-0.5 leading-normal transition-colors hover:text-adwaita-accent {(
                    activeHeadingId === heading.id
                  ) ?
                    'border-l-2 border-adwaita-accent pl-2 font-bold text-adwaita-accent'
                  : 'pl-2 text-adwaita-subtitle'}">
                  {heading.text}
                </a>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </aside>
  </div>

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

{#if showToast}
  <div class="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-adwaita-border bg-adwaita-card/90 px-4 py-2 text-xs font-semibold text-adwaita-text shadow-lg backdrop-blur-md transition-all duration-300">
    <i class="bi bi-check-circle-fill text-adwaita-accent text-sm" aria-hidden="true"></i>
    {toastMessage}
  </div>
{/if}

<ConfirmationDialog
  bind:isOpen={showYesFeedbackDialog}
  title="Would you like to share this article?"
  onCancel={() => {
    helpfulnessFeedback = null;
  }}>
  <div class="mt-4 flex flex-col gap-4">
    <p class="text-left text-xs leading-normal text-adwaita-subtitle">
      Great to hear this article helped you! Share it with your peers:
    </p>

    <div class="grid grid-cols-2 gap-2 text-left">
      <button
        onclick={() => {
          copyToClipboard();
          showYesFeedbackDialog = false;
        }}
        class="col-span-2 flex h-9.5 cursor-pointer items-center justify-center gap-2 rounded-lg border border-adwaita-border bg-adwaita-card px-3 text-xs font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover hover:text-adwaita-accent">
        <i
          class="bi {showCopySuccess ? 'bi-check2 text-palette-green' : 'bi-link-45deg'} text-sm"
          aria-hidden="true"></i>
        <span>{showCopySuccess ? 'Copied!' : 'Copy Link'}</span>
      </button>

      <a
        href="https://twitter.com/intent/tweet?url={encodeURIComponent(
          page.url.href,
        )}&text={encodeURIComponent(post.title)}"
        target="_blank"
        rel="noopener noreferrer"
        onclick={() => (showYesFeedbackDialog = false)}
        class="flex h-9.5 items-center justify-center gap-2 rounded-lg border border-adwaita-border bg-adwaita-card px-3 text-xs font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover hover:text-adwaita-accent">
        <i
          class="bi bi-twitter-x text-sm"
          aria-hidden="true"></i>
        <span>X</span>
      </a>

      <a
        href="https://www.linkedin.com/sharing/share-offsite/?url={encodeURIComponent(
          page.url.href,
        )}"
        target="_blank"
        rel="noopener noreferrer"
        onclick={() => (showYesFeedbackDialog = false)}
        class="flex h-9.5 items-center justify-center gap-2 rounded-lg border border-adwaita-border bg-adwaita-card px-3 text-xs font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover hover:text-adwaita-accent">
        <i
          class="bi bi-linkedin text-sm"
          aria-hidden="true"></i>
        <span>LinkedIn</span>
      </a>

      <a
        href="https://www.facebook.com/sharer/sharer.php?u={encodeURIComponent(page.url.href)}"
        target="_blank"
        rel="noopener noreferrer"
        onclick={() => (showYesFeedbackDialog = false)}
        class="flex h-9.5 items-center justify-center gap-2 rounded-lg border border-adwaita-border bg-adwaita-card px-3 text-xs font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover hover:text-adwaita-accent">
        <i
          class="bi bi-facebook text-sm"
          aria-hidden="true"></i>
        <span>Facebook</span>
      </a>

      <a
        href="mailto:?subject={encodeURIComponent(post.title)}&body={encodeURIComponent(page.url.href)}"
        onclick={() => (showYesFeedbackDialog = false)}
        class="flex h-9.5 items-center justify-center gap-2 rounded-lg border border-adwaita-border bg-adwaita-card px-3 text-xs font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover hover:text-adwaita-accent">
        <i
          class="bi bi-envelope text-sm"
          aria-hidden="true"></i>
        <span>Email</span>
      </a>
    </div>

    <div class="mt-2 flex items-center justify-end gap-3">
      <button
        type="button"
        onclick={() => {
          showYesFeedbackDialog = false;
          helpfulnessFeedback = null;
        }}
        class="inline-flex h-9.5 cursor-pointer items-center justify-center rounded-lg border border-adwaita-border bg-adwaita-card px-4 text-xs font-bold text-adwaita-text transition-colors hover:bg-adwaita-hover focus:outline-none">
        Cancel
      </button>
    </div>
  </div>
</ConfirmationDialog>

<ConfirmationDialog
  bind:isOpen={showNoFeedbackDialog}
  title="Would you like to send feedback?"
  message="Tell us what we can improve. Your report helps make this article better for everyone."
  onCancel={() => {
    helpfulnessFeedback = null;
  }}>
  <div class="mt-6 flex items-center justify-end gap-3">
    <button
      type="button"
      onclick={() => {
        showNoFeedbackDialog = false;
        helpfulnessFeedback = null;
      }}
      class="cancel-btn inline-flex h-9.5 cursor-pointer items-center justify-center rounded-lg border border-adwaita-border bg-adwaita-card px-4 text-xs font-bold text-adwaita-text transition-colors hover:bg-adwaita-hover focus:outline-none">
      Cancel
    </button>

    <button
      type="button"
      onclick={() => {
        showNoFeedbackDialog = false;
        window.location.href = `/feedback?url=${encodeURIComponent(window.location.pathname)}`;
      }}
      class="inline-flex h-9.5 cursor-pointer items-center justify-center rounded-lg bg-adwaita-accent px-4 text-xs font-bold text-white transition-colors hover:bg-adwaita-accent-hover focus:outline-2 focus:outline-adwaita-accent">
      Send Feedback
    </button>
  </div>
</ConfirmationDialog>
