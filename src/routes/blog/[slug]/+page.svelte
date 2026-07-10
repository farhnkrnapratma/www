<script lang="ts">
  import { onMount } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import type { PageProps } from './$types';
  import hljs from 'highlight.js';
  import { isNameReserved } from '$lib/nameValidator';
  import { page } from '$app/state';

  let { data }: PageProps = $props();
  const post = $derived(data.post);
  const html = $derived(data.html);

  let showCopySuccess = $state(false);

  function copyToClipboard() {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href)
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

    return () => {
      observer.disconnect();
    };
  });

  let authorName = $state('');
  let isAnonymous = $state(false);
  const isNameInvalid = $derived(!isAnonymous && authorName.trim() !== '' && isNameReserved(authorName));
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

    const sortFn = (a: FlatComment, b: FlatComment) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime();

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
  }

  function trunkAction(node: HTMLElement) {
    if (typeof window === 'undefined') return;

    function update() {
      const parentAvatar = node.querySelector(':scope > .comment-row-wrapper .parent-avatar') as HTMLElement;
      const lastAvatar = node.querySelector(':scope > .replies-container > .child-wrapper:last-child > div > .comment-row-wrapper .last-reply-avatar') as HTMLElement;
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
      }
    };
  }

  async function handleSubmit(e: SubmitEvent, parentId: string | null = null) {
    e.preventDefault();
    if ((!isAnonymous && !authorName.trim()) || !commentContent.trim()) return;

    if (!isAnonymous && isNameReserved(authorName)) {
      feedbackMessage = {
        type: 'error',
        text: 'This name cannot be used. Please use another name.',
      };
      return;
    }

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
          authorName: authorName.trim(),
          isAnonymous,
          content: commentContent.trim(),
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
  class="fixed top-0 z-40 flex h-15 w-full items-center justify-between bg-adwaita-card/60 backdrop-blur-lg px-5 font-sans border-b border-adwaita-border shadow-xs transition-colors duration-300">
  <a
    href="/#blogs"
    class="inline-flex h-9 items-center justify-center rounded-lg border border-adwaita-border bg-adwaita-card px-4 text-xs font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover focus:outline-none">
    <i
      class="bi bi-arrow-left mr-2"
      aria-hidden="true"></i>
    Back to Blog
  </a>
  <div class="flex items-center gap-3">

    <div class="relative">
      <button
        type="button"
        onclick={() => (themeDropdownOpen = !themeDropdownOpen)}
        class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-adwaita-border bg-adwaita-card text-sm text-adwaita-text transition-colors hover:bg-adwaita-hover focus:outline-none"
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
          class="absolute right-0 top-11 z-50 flex min-w-31.25 flex-col rounded-xl border border-adwaita-border bg-adwaita-card py-1.5 shadow-lg">
          <button
            type="button"
            onclick={() => {
              applyTheme('auto');
              themeDropdownOpen = false;
            }}
            class="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-xs font-bold transition-colors hover:bg-adwaita-hover {(
              theme === 'auto'
            ) ?
              'text-adwaita-blue'
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
              'text-adwaita-blue'
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
              'text-adwaita-blue'
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

<main class="pt-15 font-sans flex flex-col min-h-[calc(100vh-3.75rem)]">
  <article
    class="mx-auto w-full md:w-[80%] lg:w-[50%] md:max-w-none px-6 pt-10 pb-16 md:pt-14 md:pb-28 flex-1">
    <header class="mb-8 border-b border-adwaita-border pb-6">
      <h1
        class="text-4xl font-extrabold text-adwaita-text md:text-5xl tracking-tight leading-tight">
        {post.title}
      </h1>
      {#if post.excerpt}
        <p class="text-base text-adwaita-subtitle mt-3 leading-relaxed">
          {post.excerpt}
        </p>
      {/if}
      <p class="text-xs font-semibold mt-4 text-adwaita-subtitle select-none">
        {formatDate(post.created_at)} &middot; {post.read_time} &middot; {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
      </p>
    </header>

    <div class="prose-custom w-full">
      {@html html}
    </div>

    <div class="mt-12 border-t border-adwaita-border pt-8 select-none">
      <h3 class="text-sm font-bold text-adwaita-text tracking-tight mb-4">Share this Blog</h3>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <button
          onclick={copyToClipboard}
          class="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-adwaita-border bg-adwaita-card px-4 text-xs font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover hover:text-adwaita-blue focus:outline-none select-none cursor-pointer"
          title="Copy Link">
          <i class="bi {showCopySuccess ? 'bi-check2 text-palette-green' : 'bi-link-45deg'}" aria-hidden="true"></i>
          <span class="hidden sm:inline">{showCopySuccess ? 'Copied!' : 'Copy'}</span>
        </button>
        <a
          href="https://twitter.com/intent/tweet?url={encodeURIComponent(page.url.href)}&text={encodeURIComponent(post.title)}"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-adwaita-border bg-adwaita-card px-4 text-xs font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover hover:text-adwaita-blue focus:outline-none select-none"
          title="Share on X">
          <i class="bi bi-twitter-x" aria-hidden="true"></i>
          <span class="hidden sm:inline">X</span>
        </a>
        <a
          href="https://www.facebook.com/sharer/sharer.php?u={encodeURIComponent(page.url.href)}"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-adwaita-border bg-adwaita-card px-4 text-xs font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover hover:text-adwaita-blue focus:outline-none select-none"
          title="Share on Facebook">
          <i class="bi bi-facebook" aria-hidden="true"></i>
          <span class="hidden sm:inline">Facebook</span>
        </a>
        <a
          href="https://www.linkedin.com/sharing/share-offsite/?url={encodeURIComponent(page.url.href)}"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-adwaita-border bg-adwaita-card px-4 text-xs font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover hover:text-adwaita-blue focus:outline-none select-none"
          title="Share on LinkedIn">
          <i class="bi bi-linkedin" aria-hidden="true"></i>
          <span class="hidden sm:inline">LinkedIn</span>
        </a>
        <a
          href="mailto:?subject={encodeURIComponent(post.title)}&body={encodeURIComponent(page.url.href)}"
          class="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-adwaita-border bg-adwaita-card px-4 text-xs font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover hover:text-adwaita-blue focus:outline-none select-none"
          title="Share via Email">
          <i class="bi bi-envelope" aria-hidden="true"></i>
          <span class="hidden sm:inline">Email</span>
        </a>
      </div>
    </div>

    <div class="mt-8 p-6 bg-adwaita-card/45 border border-adwaita-border rounded-2xl flex flex-col sm:flex-row items-center sm:items-start gap-5 select-none">
      <img
        src="/android-chrome-512x512.png"
        alt="Farhan Kurnia Pratama"
        class="h-20 w-20 rounded-full object-cover object-top border border-adwaita-border shrink-0" />
      <div class="flex-1 min-w-0 text-center sm:text-left">
        <h4 class="text-base font-bold text-adwaita-text leading-snug">Farhan Kurnia Pratama</h4>
        <p class="text-xs text-adwaita-subtitle font-semibold mt-0.5">Linux/Unix, FOSS, and Cybersecurity</p>
        <p class="text-sm text-adwaita-subtitle/90 mt-3 leading-relaxed">
          Security-focused Software Engineer with expertise in Linux/Unix and FOSS, dedicated to building reliable, maintainable, and privacy-centric systems.
        </p>
        
        <div class="mt-4 flex items-center justify-center sm:justify-start gap-4">
          <a
            href="https://github.com/farhnkrnapratma"
            target="_blank"
            rel="noopener noreferrer"
            class="text-lg text-adwaita-subtitle transition-colors hover:text-adwaita-blue"
            title="GitHub">
            <i class="bi bi-github" aria-hidden="true"></i>
          </a>
          <a
            href="https://linkedin.com/in/farhnkrnapratma"
            target="_blank"
            rel="noopener noreferrer"
            class="text-lg text-adwaita-subtitle transition-colors hover:text-adwaita-blue"
            title="LinkedIn">
            <i class="bi bi-linkedin" aria-hidden="true"></i>
          </a>
          <a
            href="https://x.com/farhnkrnapratma"
            target="_blank"
            rel="noopener noreferrer"
            class="text-lg text-adwaita-subtitle transition-colors hover:text-adwaita-blue"
            title="X">
            <i class="bi bi-twitter-x" aria-hidden="true"></i>
          </a>
          <a
            href="https://facebook.com/farhnkrnapratma"
            target="_blank"
            rel="noopener noreferrer"
            class="text-lg text-adwaita-subtitle transition-colors hover:text-adwaita-blue"
            title="Facebook">
            <i class="bi bi-facebook" aria-hidden="true"></i>
          </a>
          <a
            href="https://instagram.com/farhnkrnapratma"
            target="_blank"
            rel="noopener noreferrer"
            class="text-lg text-adwaita-subtitle transition-colors hover:text-adwaita-blue"
            title="Instagram">
            <i class="bi bi-instagram" aria-hidden="true"></i>
          </a>
          <a
            href="https://threads.net/@farhnkrnapratma"
            target="_blank"
            rel="noopener noreferrer"
            class="text-lg text-adwaita-subtitle transition-colors hover:text-adwaita-blue"
            title="Threads">
            <i class="bi bi-threads" aria-hidden="true"></i>
          </a>
        </div>
      </div>
    </div>

    <section class="mt-16 border-t border-adwaita-border pt-10">
      <h2 class="text-xl font-bold text-adwaita-text tracking-tight mb-8">
        Comments ({comments.length})
      </h2>

      {#if feedbackMessage}
        <div
          class="mb-6 rounded-lg p-3 text-sm font-semibold {feedbackMessage.type === 'success' ?
            'bg-palette-green/10 text-palette-green border border-palette-green/30'
          : 'bg-palette-coral/10 text-palette-coral border border-palette-coral/30'}">
          {feedbackMessage.text}
        </div>
      {/if}

      {#if !replyTo}
        <div class="p-5 mb-8 text-left bg-adwaita-card/45 border border-adwaita-border rounded-2xl shadow-xs backdrop-blur-lg transition-colors duration-300">
          <div class="mb-4 select-none">
            <h3 class="text-sm font-bold text-adwaita-text">Leave a Comment</h3>
          </div>

          <form
            onsubmit={e => handleSubmit(e)}
            class="flex flex-col gap-4">
            <label class="flex items-center gap-2 text-xs font-bold text-adwaita-subtitle select-none cursor-pointer">
              <input
                type="checkbox"
                bind:checked={isAnonymous}
                class="h-3.5 w-3.5 rounded border-adwaita-border text-adwaita-blue focus:ring-adwaita-blue cursor-pointer" />
              Comment anonymously
            </label>
            <div class="flex flex-col sm:flex-row sm:items-center gap-2">
              <label
                for="comment-author"
                class="text-xs font-bold text-adwaita-subtitle w-20 shrink-0 select-none">Name</label>
              <div class="w-full">
                <input
                  type="text"
                  id="comment-author"
                  required={!isAnonymous}
                  disabled={isAnonymous}
                  placeholder={isAnonymous ? 'Anonymous' : 'Enter your name'}
                  bind:value={authorName}
                  class="w-full px-3 py-1.5 text-sm bg-adwaita-bg border border-adwaita-border rounded-lg text-adwaita-text placeholder:text-adwaita-subtitle/70 focus:outline-none focus:border-adwaita-blue transition-colors disabled:opacity-60"
                  class:border-palette-coral={isNameInvalid} />
                {#if isNameInvalid}
                  <p class="text-xs text-palette-coral mt-1">This name cannot be used. Please use another name.</p>
                {/if}
              </div>
            </div>
            <div class="flex flex-col gap-2">
              <label
                for="comment-msg"
                class="text-xs font-bold text-adwaita-subtitle select-none">Message</label>
              <div class="relative w-full">
                <textarea
                  id="comment-msg"
                  required
                  rows="3"
                  maxlength="1000"
                  placeholder="Enter your message"
                  bind:value={commentContent}
                  class="w-full px-3 py-1.5 pr-8 text-sm bg-adwaita-bg border border-adwaita-border rounded-lg text-adwaita-text placeholder:text-adwaita-subtitle/70 focus:outline-none focus:border-adwaita-blue transition-colors resize-none no-scrollbar"
                ></textarea>
                {#if commentContent.length > 0}
                  <div class="absolute right-3 bottom-2.5 pointer-events-none select-none z-10 font-mono text-[10px] text-adwaita-subtitle/80">
                    {1000 - commentContent.length}
                  </div>
                {/if}
              </div>
            </div>
            <div class="flex justify-end mt-2">
              <button
                type="submit"
                disabled={isSubmitting || isNameInvalid}
                class="inline-flex cursor-pointer items-center justify-center rounded-lg bg-adwaita-blue px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-adwaita-blue-hover focus:outline-none disabled:cursor-not-allowed disabled:opacity-55 select-none">
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
          <div class="relative flex flex-col gap-4" use:trunkAction>
            {#if comment.children && comment.children.length > 0}
              <div class="trunk-line-single absolute border-l border-adwaita-subtitle/10 z-0" style="left: 16px; width: 0px;"></div>
            {/if}

            <div class="comment-row-wrapper relative flex items-start gap-3">
              <div
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-adwaita-card text-adwaita-subtitle border border-adwaita-border z-10"
                class:parent-avatar={comment.children && comment.children.length > 0}
                class:last-reply-avatar={isLastChildOfParent}>
                <span
                  class="material-symbols-rounded text-sm"
                  style="font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;"
                  aria-hidden="true">
                  {getCommentIcon(comment)}
                </span>
              </div>

              <div class="flex-1 min-w-0">
                <div
                  class="inline-block max-w-full bg-adwaita-card/50 border border-adwaita-border px-4 py-2 text-left"
                  style="border-radius: 18px;">
                  <div class="text-xs font-bold text-adwaita-text/95">
                    {getCommentAuthor(comment)}
                  </div>
                  <p class="text-sm leading-relaxed text-adwaita-text/90 mt-0.5">
                    {#if comment.reply_to_author}
                      <span class="font-bold text-palette-green text-xs mr-1.5">{comment.reply_to_author}</span>
                    {/if}
                    <span class="whitespace-pre-line">{comment.content}</span>
                  </p>
                </div>

                <div class="flex items-center gap-3 mt-1 ml-2 text-[10px] text-adwaita-subtitle">
                  <span>{formatDate(comment.created_at)}</span>
                  <button
                    type="button"
                    onclick={() => {
                      replyTo = comment;
                      feedbackMessage = null;
                      commentContent = '';
                    }}
                    class="font-bold text-adwaita-text/70 hover:text-adwaita-blue transition-colors cursor-pointer">
                    Reply
                  </button>
                </div>

                {#if replyTo?.id === comment.id}
                  <form
                    onsubmit={e => handleSubmit(e, comment.id)}
                    class="mt-3 rounded-xl border border-adwaita-border bg-adwaita-bg/60 p-4">
                    <div class="mb-3 flex items-center justify-between gap-3">
                      <p class="text-xs font-semibold text-adwaita-subtitle">
                        Replying to {getCommentAuthor(comment)}
                      </p>
                      <button
                        type="button"
                        onclick={cancelReply}
                        class="inline-flex h-8 items-center justify-center cursor-pointer rounded-lg border border-adwaita-border bg-adwaita-card px-3 text-xs font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover">
                        Cancel
                      </button>
                    </div>

                    <div class="flex flex-col gap-4">
                      <label
                        class="flex items-center gap-2 text-xs font-bold text-adwaita-subtitle select-none cursor-pointer">
                        <input
                          type="checkbox"
                          bind:checked={isAnonymous}
                          class="h-3.5 w-3.5 rounded border-adwaita-border text-adwaita-blue focus:ring-adwaita-blue cursor-pointer" />
                        Comment anonymously
                      </label>
                      <div class="flex flex-col sm:flex-row sm:items-center gap-2">
                        <label
                          for="reply-author-{comment.id}"
                          class="text-xs font-bold text-adwaita-subtitle w-20 shrink-0 select-none"
                          >Name</label>
                        <div class="w-full">
                          <input
                            type="text"
                            id="reply-author-{comment.id}"
                            required={!isAnonymous}
                            disabled={isAnonymous}
                            placeholder={isAnonymous ? 'Anonymous' : 'Enter your name'}
                            bind:value={authorName}
                            class="w-full px-3 py-1.5 text-sm bg-adwaita-bg border border-adwaita-border rounded-lg text-adwaita-text placeholder:text-adwaita-subtitle/70 focus:outline-none focus:border-adwaita-blue transition-colors disabled:opacity-60"
                            class:border-palette-coral={isNameInvalid} />
                          {#if isNameInvalid}
                            <p class="text-xs text-palette-coral mt-1">This name cannot be used. Please use another name.</p>
                          {/if}
                        </div>
                      </div>
                      <div class="flex flex-col gap-2">
                        <label
                          for="reply-msg-{comment.id}"
                          class="text-xs font-bold text-adwaita-subtitle select-none"
                          >Message</label>
                        <div class="relative w-full">
                          <textarea
                            id="reply-msg-{comment.id}"
                            required
                            rows="3"
                            maxlength="1000"
                            placeholder="Enter your message"
                            bind:value={commentContent}
                            class="w-full px-3 py-1.5 pr-8 text-sm bg-adwaita-bg border border-adwaita-border rounded-lg text-adwaita-text placeholder:text-adwaita-subtitle/70 focus:outline-none focus:border-adwaita-blue transition-colors resize-none no-scrollbar"
                          ></textarea>
                          {#if commentContent.length > 0}
                            <div class="absolute right-3 bottom-2.5 pointer-events-none select-none z-10 font-mono text-[10px] text-adwaita-subtitle/80">
                              {1000 - commentContent.length}
                            </div>
                          {/if}
                        </div>
                      </div>
                      <div class="flex justify-end">
                        <button
                          type="submit"
                          disabled={isSubmitting || isNameInvalid}
                          class="inline-flex cursor-pointer items-center justify-center rounded-lg bg-adwaita-blue px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-adwaita-blue-hover focus:outline-none disabled:cursor-not-allowed disabled:opacity-55 select-none">
                          {isSubmitting ? 'Validating...' : 'Post Reply'}
                        </button>
                      </div>
                    </div>
                  </form>
                {/if}
              </div>
            </div>

            {#if comment.children && comment.children.length > 0}
              <div class="replies-container relative" style="padding-left: 44px;">
                {#each comment.children as child, i (child.id)}
                  <div class="child-wrapper relative mt-4">
                    <div
                      class="absolute border-l border-b border-adwaita-subtitle/10 z-0"
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
</main>
