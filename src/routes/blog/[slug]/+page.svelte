<script lang="ts">
  import { onMount } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import type { PageProps } from './$types';
  import hljs from 'highlight.js';

  let { data }: PageProps = $props();
  const post = $derived(data.post);
  const html = $derived(data.html);

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

    return () => observer.disconnect();
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

  function buildCommentTree(items: BlogComment[]): FlatComment[] {
    const commentMap = new SvelteMap<string, BlogComment>();
    for (const item of items) {
      commentMap.set(item.id, item);
    }

    function getAncestorAndParent(comment: BlogComment): { ancestor: BlogComment; parent: BlogComment | null } {
      let current = comment;
      let parent: BlogComment | null = null;
      if (current.parent_id) {
        parent = commentMap.get(current.parent_id) || null;
      }
      while (current.parent_id && commentMap.has(current.parent_id)) {
        current = commentMap.get(current.parent_id)!;
      }
      return { ancestor: current, parent };
    }

    const roots: FlatComment[] = [];
    const rootRepliesMap = new SvelteMap<string, FlatComment[]>();

    for (const item of items) {
      if (!item.parent_id) {
        roots.push({ ...item, children: [] });
      }
    }

    roots.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    for (const item of items) {
      if (item.parent_id) {
        const { ancestor, parent } = getAncestorAndParent(item);
        if (ancestor.id !== item.id) {
          const replyObj: FlatComment = {
            ...item,
            children: [],
            reply_to_author: (parent && parent.id !== ancestor.id) ? getCommentAuthor(parent) : null
          };
          if (!rootRepliesMap.has(ancestor.id)) {
            rootRepliesMap.set(ancestor.id, []);
          }
          rootRepliesMap.get(ancestor.id)!.push(replyObj);
        }
      }
    }

    for (const root of roots) {
      const replies = rootRepliesMap.get(root.id) || [];
      replies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      root.children = replies;
    }

    return roots;
  }

  function getCommentAuthor(comment: BlogComment) {
    return comment.is_anonymous ? 'Anonymous User' : comment.author_name;
  }

  function getCommentIcon(comment: BlogComment) {
    if (comment.author_name === 'Admin') return 'shield_person';
    return comment.is_anonymous ? 'domino_mask' : 'person';
  }

  function cancelReply() {
    replyTo = null;
    commentContent = '';
    feedbackMessage = null;
  }

  async function handleSubmit(e: SubmitEvent, parentId: string | null = null) {
    e.preventDefault();
    if ((!isAnonymous && !authorName.trim()) || !commentContent.trim()) return;

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
    <span class="text-sm font-bold text-adwaita-subtitle hidden sm:inline">Read Post</span>

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
    class="mx-auto w-full md:w-[70%] lg:w-[45%] md:max-w-none px-6 pt-10 pb-16 md:pt-14 md:pb-28 flex-1">
    <header class="mb-8 border-b border-adwaita-border pb-6">
      <p class="text-xs font-semibold mb-2 text-adwaita-subtitle">{formatDate(post.created_at)}</p>
      <h1
        class="text-3xl font-extrabold text-adwaita-text md:text-4xl tracking-tight leading-tight">
        {post.title}
      </h1>
    </header>

    <div class="prose-custom w-full">
      {@html html}
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
          <div class="boxed-list p-5 mb-8 text-left bg-zinc-950/1">
            <h3 class="text-sm font-bold text-adwaita-text mb-4">Leave a Comment</h3>

            <form
              onsubmit={e => handleSubmit(e)}
              class="flex flex-col gap-4">
              <label class="flex items-center gap-2 text-xs font-bold text-adwaita-subtitle">
                <input
                  type="checkbox"
                  bind:checked={isAnonymous}
                  class="h-4 w-4 rounded border-adwaita-border text-adwaita-blue focus:ring-adwaita-blue" />
                Comment anonymously
              </label>
              <div class="flex flex-col sm:flex-row sm:items-center gap-2">
                <label
                  for="comment-author"
                  class="text-xs font-bold text-adwaita-subtitle w-20 shrink-0">Name</label>
                <input
                  type="text"
                  id="comment-author"
                  required={!isAnonymous}
                  disabled={isAnonymous}
                  placeholder={isAnonymous ? 'Anonymous User' : 'Linus Torvalds'}
                  bind:value={authorName}
                  class="w-full px-3 py-1.5 text-sm bg-adwaita-bg border border-adwaita-border rounded-lg text-adwaita-text placeholder:text-adwaita-subtitle/70 focus:outline-none focus:border-adwaita-blue transition-colors disabled:opacity-60" />
              </div>
              <div class="flex flex-col items-start gap-2">
                <label
                  for="comment-msg"
                  class="text-xs font-bold text-adwaita-subtitle w-20 shrink-0 mt-1">Message</label>
                <textarea
                  id="comment-msg"
                  required
                  rows="3"
                  maxlength="2000"
                  placeholder="Write your comment here..."
                  bind:value={commentContent}
                  class="w-full px-3 py-1.5 text-sm bg-adwaita-bg border border-adwaita-border rounded-lg text-adwaita-text placeholder:text-adwaita-subtitle/70 focus:outline-none focus:border-adwaita-blue transition-colors resize-none"
                ></textarea>
              </div>
              <div class="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  class="inline-flex cursor-pointer items-center justify-center rounded-lg bg-adwaita-blue px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-adwaita-blue-hover focus:outline-none disabled:cursor-not-allowed disabled:opacity-55">
                  {isSubmitting ? 'Validating...' : 'Post Comment'}
                </button>
              </div>
            </form>
          </div>
        {/if}

        {#if comments.length === 0}
          <div class="boxed-list p-6 text-center text-adwaita-subtitle">No comments yet.</div>
        {:else}
          <div class="flex flex-col gap-6">
            {#each commentTree as rootComment (rootComment.id)}
              <div class="relative flex flex-col gap-4">
                <!-- Trunk line connecting root avatar center to last reply avatar center -->
                {#if rootComment.children && rootComment.children.length > 0}
                  <div class="absolute left-4 top-4 bottom-0 w-[1px] bg-adwaita-subtitle/20 z-0"></div>
                {/if}

                <!-- Top-level Comment -->
                <div class="relative flex items-start gap-3">
                  <!-- Avatar Column -->
                  <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-adwaita-card text-adwaita-subtitle border border-adwaita-border z-10">
                    <span class="material-symbols-rounded text-sm" style="font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;" aria-hidden="true">
                      {getCommentIcon(rootComment)}
                    </span>
                  </div>

                  <!-- Content Column -->
                  <div class="flex-1 min-w-0">
                    <div class="inline-block max-w-full bg-adwaita-card/50 px-4 py-2 text-left" style="border-radius: 18px;">
                      <p class="text-sm leading-relaxed text-adwaita-text/90">
                        <strong class="text-xs font-bold text-adwaita-text/95 mr-2">{getCommentAuthor(rootComment)}</strong>
                        <span class="whitespace-pre-line">{rootComment.content}</span>
                      </p>
                    </div>

                    <!-- Actions / Metadata below bubble -->
                    <div class="flex items-center gap-3 mt-1 ml-2 text-[10px] text-adwaita-subtitle">
                      <span>{formatDate(rootComment.created_at)}</span>
                      <button
                        type="button"
                        onclick={() => {
                          replyTo = rootComment;
                          feedbackMessage = null;
                          commentContent = '';
                        }}
                        class="font-bold text-adwaita-text/70 hover:text-adwaita-blue transition-colors cursor-pointer"
                      >
                        Reply
                      </button>
                    </div>

                    <!-- Inline Reply Form for Root Comment -->
                    {#if replyTo?.id === rootComment.id}
                      <form
                        onsubmit={e => handleSubmit(e, rootComment.id)}
                        class="mt-3 rounded-xl border border-adwaita-border bg-adwaita-bg/60 p-4"
                      >
                        <div class="mb-3 flex items-center justify-between gap-3">
                          <p class="text-xs font-semibold text-adwaita-subtitle">
                            Replying to {getCommentAuthor(rootComment)}
                          </p>
                          <button
                            type="button"
                            onclick={cancelReply}
                            class="inline-flex h-8 items-center justify-center cursor-pointer rounded-lg border border-adwaita-border bg-adwaita-card px-3 text-xs font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover"
                          >
                            Cancel
                          </button>
                        </div>

                        <div class="flex flex-col gap-4">
                          <label class="flex items-center gap-2 text-xs font-bold text-adwaita-subtitle">
                            <input
                              type="checkbox"
                              bind:checked={isAnonymous}
                              class="h-4 w-4 rounded border-adwaita-border text-adwaita-blue focus:ring-adwaita-blue"
                            />
                            Comment anonymously
                          </label>
                          <div class="flex flex-col sm:flex-row sm:items-center gap-2">
                            <label for="reply-author-{rootComment.id}" class="text-xs font-bold text-adwaita-subtitle w-20 shrink-0">Name</label>
                            <input
                              type="text"
                              id="reply-author-{rootComment.id}"
                              required={!isAnonymous}
                              disabled={isAnonymous}
                              placeholder={isAnonymous ? 'Anonymous User' : 'Linus Torvalds'}
                              bind:value={authorName}
                              class="w-full px-3 py-1.5 text-sm bg-adwaita-bg border border-adwaita-border rounded-lg text-adwaita-text placeholder:text-adwaita-subtitle/70 focus:outline-none focus:border-adwaita-blue transition-colors disabled:opacity-60"
                            />
                          </div>
                          <div class="flex flex-col items-start gap-2">
                            <label for="reply-msg-{rootComment.id}" class="text-xs font-bold text-adwaita-subtitle w-20 shrink-0 mt-1">Message</label>
                            <textarea
                              id="reply-msg-{rootComment.id}"
                              required
                              rows="3"
                              maxlength="2000"
                              placeholder="Write your reply here..."
                              bind:value={commentContent}
                              class="w-full px-3 py-1.5 text-sm bg-adwaita-bg border border-adwaita-border rounded-lg text-adwaita-text placeholder:text-adwaita-subtitle/70 focus:outline-none focus:border-adwaita-blue transition-colors resize-none"
                            ></textarea>
                          </div>
                          <div class="flex justify-end">
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              class="inline-flex cursor-pointer items-center justify-center rounded-lg bg-adwaita-blue px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-adwaita-blue-hover focus:outline-none disabled:cursor-not-allowed disabled:opacity-55"
                            >
                              {isSubmitting ? 'Validating...' : 'Post Reply'}
                            </button>
                          </div>
                        </div>
                      </form>
                    {/if}
                  </div>
                </div>

                <!-- Replies Section (Flat List, max 1 level indent) -->
                {#if rootComment.children && rootComment.children.length > 0}
                  <div class="relative pl-11">

                    {#each rootComment.children as child, i (child.id)}
                      <div class="relative flex items-start gap-3 mt-4">
                        <!-- Hook (horizontal line) from trunk to child avatar left edge -->
                        <div class="absolute -left-7 top-4 w-7 h-[1px] bg-adwaita-subtitle/20"></div>

                        <!-- Masking line for the last child's bottom half of the vertical trunk line -->
                        {#if i === rootComment.children.length - 1}
                          <div class="absolute -left-7 top-4 bottom-0 w-[2px] bg-adwaita-bg"></div>
                        {/if}

                        <!-- Reply Avatar Column -->
                        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-adwaita-card text-adwaita-subtitle border border-adwaita-border z-10">
                          <span class="material-symbols-rounded text-sm" style="font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;" aria-hidden="true">
                            {getCommentIcon(child)}
                          </span>
                        </div>

                        <!-- Reply Content Column -->
                        <div class="flex-1 min-w-0">
                          <div class="inline-block max-w-full bg-adwaita-card/50 px-4 py-2 text-left" style="border-radius: 18px;">
                            <p class="text-sm leading-relaxed text-adwaita-text/90">
                              <strong class="text-xs font-bold text-adwaita-text/95 mr-2">{getCommentAuthor(child)}</strong>
                              {#if child.reply_to_author}
                                <span class="font-bold text-adwaita-blue/90 text-xs mr-1">@{child.reply_to_author}</span>
                              {/if}
                              <span class="whitespace-pre-line">{child.content}</span>
                            </p>
                          </div>

                          <!-- Actions / Metadata below bubble -->
                          <div class="flex items-center gap-3 mt-1 ml-2 text-[10px] text-adwaita-subtitle">
                            <span>{formatDate(child.created_at)}</span>
                            <button
                              type="button"
                              onclick={() => {
                                replyTo = child;
                                feedbackMessage = null;
                                commentContent = '';
                              }}
                              class="font-bold text-adwaita-text/70 hover:text-adwaita-blue transition-colors cursor-pointer"
                            >
                              Reply
                            </button>
                          </div>

                          <!-- Inline Reply Form for Child Comment (Replies go to the same flat level under rootComment) -->
                          {#if replyTo?.id === child.id}
                            <form
                              onsubmit={e => handleSubmit(e, child.id)}
                              class="mt-3 rounded-xl border border-adwaita-border bg-adwaita-bg/60 p-4"
                            >
                              <div class="mb-3 flex items-center justify-between gap-3">
                                <p class="text-xs font-semibold text-adwaita-subtitle">
                                  Replying to {getCommentAuthor(child)}
                                </p>
                                <button
                                  type="button"
                                  onclick={cancelReply}
                                  class="inline-flex h-8 items-center justify-center cursor-pointer rounded-lg border border-adwaita-border bg-adwaita-card px-3 text-xs font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover"
                                >
                                  Cancel
                                </button>
                              </div>

                              <div class="flex flex-col gap-4">
                                <label class="flex items-center gap-2 text-xs font-bold text-adwaita-subtitle">
                                  <input
                                    type="checkbox"
                                    bind:checked={isAnonymous}
                                    class="h-4 w-4 rounded border-adwaita-border text-adwaita-blue focus:ring-adwaita-blue"
                                  />
                                  Comment anonymously
                                </label>
                                <div class="flex flex-col sm:flex-row sm:items-center gap-2">
                                  <label for="reply-author-child-{child.id}" class="text-xs font-bold text-adwaita-subtitle w-20 shrink-0">Name</label>
                                  <input
                                    type="text"
                                    id="reply-author-child-{child.id}"
                                    required={!isAnonymous}
                                    disabled={isAnonymous}
                                    placeholder={isAnonymous ? 'Anonymous User' : 'Linus Torvalds'}
                                    bind:value={authorName}
                                    class="w-full px-3 py-1.5 text-sm bg-adwaita-bg border border-adwaita-border rounded-lg text-adwaita-text placeholder:text-adwaita-subtitle/70 focus:outline-none focus:border-adwaita-blue transition-colors disabled:opacity-60"
                                  />
                                </div>
                                <div class="flex flex-col items-start gap-2">
                                  <label for="reply-msg-child-{child.id}" class="text-xs font-bold text-adwaita-subtitle w-20 shrink-0 mt-1">Message</label>
                                  <textarea
                                    id="reply-msg-child-{child.id}"
                                    required
                                    rows="3"
                                    maxlength="2000"
                                    placeholder="Write your reply here..."
                                    bind:value={commentContent}
                                    class="w-full px-3 py-1.5 text-sm bg-adwaita-bg border border-adwaita-border rounded-lg text-adwaita-text placeholder:text-adwaita-subtitle/70 focus:outline-none focus:border-adwaita-blue transition-colors resize-none"
                                  ></textarea>
                                </div>
                                <div class="flex justify-end">
                                  <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    class="inline-flex cursor-pointer items-center justify-center rounded-lg bg-adwaita-blue px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-adwaita-blue-hover focus:outline-none disabled:cursor-not-allowed disabled:opacity-55"
                                  >
                                    {isSubmitting ? 'Validating...' : 'Post Reply'}
                                  </button>
                                </div>
                              </div>
                            </form>
                          {/if}
                        </div>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}

    </section>
  </article>
</main>
