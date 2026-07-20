<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';
  import { SvelteMap, SvelteSet } from 'svelte/reactivity';
  import { ConfirmationDialog } from '$lib';

  interface AdminPost {
    id: string;
    title: string;
    slug: string;
    published: boolean;
    storage_path: string;
    created_at: string;
  }

  let isLoading = $state(true);
  let posts = $state<AdminPost[]>([]);
  let isLoggingOut = $state(false);
  let openActionMenuId = $state<string | null>(null);

  // Deletion dialog states
  let showDeletePostDialog = $state(false);
  let postToDelete = $state<AdminPost | null>(null);
  let showDeleteCommentDialog = $state(false);
  let commentIdToDelete = $state<string | null>(null);

  interface AdminComment {
    id: string;
    post_id: string;
    parent_id: string | null;
    author_name: string;
    content: string;
    is_anonymous?: boolean;
    is_approved: boolean;
    created_at: string;
    posts?: { title: string };
  }

  interface FlatAdminComment extends AdminComment {
    children: FlatAdminComment[];
    reply_to_author?: string | null;
  }

  let comments = $state<AdminComment[]>([]);
  let replyTo = $state<AdminComment | null>(null);
  let commentContent = $state('');
  let isSubmitting = $state(false);

  type Theme = 'auto' | 'dark' | 'light';
  let theme = $state<Theme>('auto');
  let themeDropdownOpen = $state(false);
  const expandedPostIds = new SvelteSet<string>();

  function toggleComments(postId: string) {
    if (expandedPostIds.has(postId)) {
      expandedPostIds.delete(postId);
    } else {
      expandedPostIds.add(postId);
    }
  }

  function sanitizeInput(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  async function handleAdminSubmit(e: SubmitEvent, parentId: string, postId: string) {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmed = commentContent.trim();
    if (!trimmed) return;

    isSubmitting = true;
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          parent_id: parentId,
          author_name: 'Admin',
          content: sanitizeInput(trimmed),
          is_anonymous: false,
          is_approved: true,
        })
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        const postObj = posts.find(p => p.id === postId);
        const newComment: AdminComment = {
          ...data,
          posts: { title: postObj?.title || '' },
        };
        comments = [...comments, newComment];
        replyTo = null;
        commentContent = '';
      }
    } catch (err) {
      console.error('Error saving admin reply:', err);
      alert('Failed to post reply.');
    } finally {
      isSubmitting = false;
    }
  }

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

  const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
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
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        window.location.href = '/admin/login';
        return;
      }

      await Promise.all([fetchPosts(), fetchComments()]);
      isLoading = false;
    })();

    // Start idle timer
    resetIdleTimer();
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, resetIdleTimer, { passive: true }));

    return () => {
      clearTimeout(idleTimer);
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, resetIdleTimer));
    };
  });

  async function fetchPosts() {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      posts = data;
    }
  }

  async function fetchComments() {
    const { data, error } = await supabase
      .from('comments')
      .select('*, posts(title)')
      .order('created_at', { ascending: true });

    if (!error && data) {
      comments = data;
    }
  }

  async function handleLogout() {
    isLoggingOut = true;
    await supabase.auth.signOut();
    window.location.href = '/admin/login';
  }

  async function togglePublish(post: AdminPost) {
    const newStatus = !post.published;
    const { error } = await supabase
      .from('posts')
      .update({ published: newStatus })
      .eq('id', post.id);

    if (!error) {
      posts = posts.map(p => (p.id === post.id ? { ...p, published: newStatus } : p));
    } else {
      alert('Failed to update post status.');
    }
  }

  function confirmDeletePost(post: AdminPost) {
    postToDelete = post;
    showDeletePostDialog = true;
  }

  async function executeDeletePost() {
    if (!postToDelete) return;
    const post = postToDelete;
    postToDelete = null;

    const { error: storageError } = await supabase.storage
      .from('blog-posts')
      .remove([post.storage_path]);

    if (storageError) {
      console.warn('Storage deletion warning:', storageError);
    }

    const { error: dbError } = await supabase.from('posts').delete().eq('id', post.id);

    if (!dbError) {
      posts = posts.filter(p => p.id !== post.id);
      comments = comments.filter(comment => comment.post_id !== post.id);
    } else {
      alert('Failed to delete post from database.');
    }
  }

  function confirmDeleteComment(id: string) {
    commentIdToDelete = id;
    showDeleteCommentDialog = true;
  }

  async function executeDeleteComment() {
    if (!commentIdToDelete) return;
    const id = commentIdToDelete;
    commentIdToDelete = null;

    const { error } = await supabase.from('comments').delete().eq('id', id);

    if (!error) {
      const deletedIds = getDescendantCommentIds(id, comments);
      comments = comments.filter(c => !deletedIds.has(c.id));
    } else {
      alert('Failed to delete comment.');
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function getPostComments(postId: string) {
    return comments.filter(comment => comment.post_id === postId);
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

  function buildCommentTree(items: AdminComment[]): FlatAdminComment[] {
    const commentMap = new SvelteMap<string, FlatAdminComment>();
    for (const item of items) {
      commentMap.set(item.id, { ...item, children: [] });
    }

    const roots: FlatAdminComment[] = [];

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

    const sortFn = (a: FlatAdminComment, b: FlatAdminComment) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime();

    roots.sort(sortFn);

    for (const node of commentMap.values()) {
      node.children.sort(sortFn);
    }

    return roots;
  }

  function getDescendantCommentIds(commentId: string, items: AdminComment[]) {
    const deletedIds = new SvelteSet([commentId]);
    let changed = true;

    while (changed) {
      changed = false;
      for (const comment of items) {
        if (comment.parent_id && deletedIds.has(comment.parent_id) && !deletedIds.has(comment.id)) {
          deletedIds.add(comment.id);
          changed = true;
        }
      }
    }

    return deletedIds;
  }

  function getCommentAuthor(comment: AdminComment) {
    return comment.is_anonymous ? 'Anonymous' : comment.author_name;
  }

  function getCommentIcon(comment: AdminComment) {
    if (comment.author_name === 'Admin') return 'crown';
    return comment.is_anonymous ? 'domino_mask' : 'person';
  }
</script>

<nav
  class="fixed top-0 z-40 flex h-15 w-full items-center justify-between border-b border-adwaita-border bg-adwaita-card/60 px-5 font-sans shadow-xs backdrop-blur-lg transition-colors duration-300">
  <div class="flex items-center gap-3">
    <div class="flex items-center gap-2">
      <span class="material-symbols-rounded text-lg text-adwaita-accent select-none">code</span>
      <span class="text-sm font-bold text-adwaita-text select-none">Console</span>
    </div>
  </div>

  <div class="flex items-center gap-2">
    <div class="relative">
      <button
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

    <button
      onclick={handleLogout}
      disabled={isLoggingOut}
      class="inline-flex h-9 items-center justify-center rounded-lg border border-adwaita-border bg-adwaita-card px-4 text-xs font-semibold text-adwaita-text transition-colors select-none hover:bg-adwaita-hover disabled:opacity-50">
      Logout
    </button>
  </div>
</nav>

<main class="flex min-h-[calc(100vh-3.75rem)] flex-col pt-15 font-sans">
  <section class="mx-auto w-full flex-1 px-6 py-14 md:w-[80%] md:max-w-none lg:w-[50%]">
    {#if isLoading}
      <div class="flex flex-col items-center justify-center py-20 text-adwaita-subtitle">
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
        Loading dashboard data...
      </div>
    {:else}
      <div class="mb-8 flex items-center justify-between">
        <h1 class="text-3xl font-bold tracking-tight text-adwaita-text">Blog Posts</h1>
        <a
          href="/admin/new"
          class="inline-flex h-9 items-center justify-center rounded-lg bg-adwaita-accent px-4 text-xs font-semibold text-white transition-colors hover:bg-adwaita-accent-hover">
          New Post
        </a>
      </div>

      {#if posts.length === 0}
        <div class="boxed-list p-8 text-center text-adwaita-subtitle">
          <i
            class="bi bi-journal-plus mb-2 block text-3xl opacity-60"
            aria-hidden="true"></i>
          No posts found.
        </div>
      {:else}
        <div class="boxed-list text-left">
          {#each posts as post (post.id)}
            {@const postComments = getPostComments(post.id)}
            <div class="action-row group flex flex-col items-stretch gap-4 py-4">
              <div class="flex items-start justify-between gap-3">
                <div class="flex min-w-0 flex-1 flex-col gap-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="text-xs font-semibold text-adwaita-subtitle"
                      >{formatDate(post.created_at)}</span>
                    {#if post.published}
                      <span
                        class="rounded border border-palette-green/30 bg-palette-green/15 px-2 py-0.5 text-[10px] font-bold text-palette-green"
                        >Published</span>
                    {:else}
                      <span
                        class="rounded border border-palette-yellow/30 bg-palette-yellow/15 px-2 py-0.5 text-[10px] font-bold text-palette-yellow"
                        >Draft</span>
                    {/if}
                    {#if postComments.length > 0}
                      <button
                        type="button"
                        onclick={() => toggleComments(post.id)}
                        class="inline-flex h-6 cursor-pointer items-center gap-1 rounded bg-adwaita-border/40 px-2 text-[10px] font-semibold text-adwaita-subtitle transition-colors hover:bg-adwaita-border"
                        title="{expandedPostIds.has(post.id) ? 'Hide' : (
                          'Show'
                        )} {postComments.length} comments">
                        <i
                          class="bi bi-chat-left-text-fill text-[10px] text-adwaita-accent"
                          aria-hidden="true"></i>
                        {expandedPostIds.has(post.id) ? 'Hide' : 'Show'} Comments ({postComments.length})
                      </button>
                    {/if}
                  </div>
                  <h2 class="text-base font-bold text-adwaita-text">{post.title}</h2>
                  <p class="line-clamp-1 font-mono text-xs text-adwaita-subtitle">
                    {post.storage_path}
                  </p>
                </div>

                <div class="flex shrink-0 items-center gap-2">
                  <a
                    href="/admin/new?id={post.id}"
                    class="inline-flex h-8 items-center justify-center rounded-lg border border-adwaita-border bg-adwaita-card px-3 text-xs font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover">
                    Edit
                  </a>

                  <div class="relative">
                    <button
                      onclick={() =>
                        (openActionMenuId = openActionMenuId === post.id ? null : post.id)}
                      class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-adwaita-border bg-adwaita-card text-adwaita-text transition-colors hover:bg-adwaita-hover"
                      aria-label="More actions"
                      aria-haspopup="true"
                      aria-expanded={openActionMenuId === post.id}>
                      <i
                        class="bi bi-three-dots-vertical text-sm"
                        aria-hidden="true"></i>
                    </button>

                    {#if openActionMenuId === post.id}
                      <button
                        class="fixed inset-0 z-40 cursor-default"
                        onclick={() => (openActionMenuId = null)}
                        aria-label="Close menu"></button>
                      <div
                        class="absolute top-9 right-0 z-50 flex min-w-36 flex-col rounded-xl border border-adwaita-border bg-adwaita-card py-1.5 shadow-lg">
                        <button
                          type="button"
                          onclick={() => {
                            togglePublish(post);
                            openActionMenuId = null;
                          }}
                          class="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-left text-xs font-bold text-adwaita-text transition-colors hover:bg-adwaita-hover">
                          <i
                            class="bi {post.published ? 'bi-eye-slash' : 'bi-eye'} text-sm"
                            aria-hidden="true"></i>
                          {post.published ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          type="button"
                          onclick={() => {
                            openActionMenuId = null;
                            confirmDeletePost(post);
                          }}
                          class="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-left text-xs font-bold text-palette-coral transition-colors hover:bg-palette-coral/10">
                          <i
                            class="bi bi-trash3 text-sm"
                            aria-hidden="true"></i>
                          Delete
                        </button>
                      </div>
                    {/if}
                  </div>
                </div>
              </div>

              {#if postComments.length > 0 && expandedPostIds.has(post.id)}
                <div class="flex flex-col gap-6 p-4">
                  {#snippet commentNode(
                    comment: FlatAdminComment,
                    depth: number,
                    isLastChildOfParent: boolean,
                  )}
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
                            class="material-symbols-rounded text-sm text-adwaita-subtitle"
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

                          <div
                            class="mt-1 ml-2 flex flex-wrap items-center gap-3 text-[10px] text-adwaita-subtitle">
                            <span>{formatDate(comment.created_at)}</span>
                            {#if !comment.is_approved}
                              <span
                                class="rounded border border-palette-yellow/30 bg-palette-yellow/15 px-2 py-0.5 text-[10px] font-bold text-palette-yellow">
                                Hidden
                              </span>
                            {/if}
                            {#if comment.is_approved}
                              <button
                                type="button"
                                onclick={() => {
                                  replyTo = comment;
                                  commentContent = '';
                                }}
                                class="inline-flex h-6 cursor-pointer items-center rounded bg-adwaita-border/30 px-2 py-0.5 font-bold text-adwaita-text/70 transition-colors hover:bg-adwaita-border hover:text-adwaita-accent">
                                Reply
                              </button>
                            {/if}
                            <button
                              type="button"
                              onclick={() => confirmDeleteComment(comment.id)}
                              class="ml-auto inline-flex h-6 cursor-pointer items-center rounded border border-palette-coral/20 bg-palette-coral/10 px-2 py-0.5 font-bold text-palette-coral transition-colors hover:bg-palette-coral/20">
                              Delete
                            </button>
                          </div>

                          {#if replyTo?.id === comment.id}
                            <form
                              onsubmit={e => handleAdminSubmit(e, comment.id, post.id)}
                              class="mt-3 rounded-xl border border-adwaita-border bg-adwaita-bg/60 p-4">
                              <div class="mb-3 flex items-center justify-between gap-3">
                                <p class="text-xs font-semibold text-adwaita-subtitle">
                                  Replying as Admin to {getCommentAuthor(comment)}
                                </p>
                                <button
                                  type="button"
                                  onclick={() => {
                                    replyTo = null;
                                    commentContent = '';
                                  }}
                                  class="inline-flex h-8 cursor-pointer items-center justify-center rounded-lg border border-adwaita-border bg-adwaita-card px-3 text-xs font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover">
                                  Cancel
                                </button>
                              </div>

                              <div class="flex flex-col gap-2.5">
                                <div class="flex flex-col gap-2">
                                  <label
                                    for="reply-msg-{comment.id}"
                                    class="text-xs font-bold text-adwaita-subtitle select-none">
                                    Message
                                  </label>
                                  <div class="relative w-full">
                                    <textarea
                                      id="reply-msg-{comment.id}"
                                      required
                                      rows="3"
                                      maxlength="1000"
                                      placeholder="Enter your message"
                                      bind:value={commentContent}
                                      class="no-scrollbar w-full resize-none rounded-lg border border-adwaita-border bg-adwaita-bg px-3 py-1.5 pr-8 text-sm text-adwaita-text transition-colors placeholder:text-adwaita-subtitle/70 focus:border-adwaita-accent"
                                    ></textarea>
                                    {#if commentContent.length > 0}
                                      <div
                                        class="pointer-events-none absolute right-3 bottom-2.5 z-10 font-mono text-[10px] text-adwaita-subtitle/80 select-none">
                                        {1000 - commentContent.length}
                                      </div>
                                    {/if}
                                  </div>
                                </div>
                                <div class="flex justify-end">
                                  <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    class="inline-flex cursor-pointer items-center justify-center rounded-lg bg-adwaita-accent px-5 py-2 text-sm font-semibold text-white transition-colors select-none hover:bg-adwaita-accent-hover disabled:cursor-not-allowed disabled:opacity-55">
                                    {isSubmitting ? 'Posting...' : 'Post Reply'}
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
                          style="padding-left: 44px;">
                          {#each comment.children as child, i (child.id)}
                            <div class="child-wrapper relative mt-4">
                              <div
                                class="absolute z-0 border-b border-l border-adwaita-subtitle/10"
                                style="left: -28px; top: -16px; width: 28px; height: 32px; border-bottom-left-radius: 10px;">
                              </div>
                              {@render commentNode(
                                child,
                                depth + 1,
                                i === comment.children.length - 1,
                              )}
                            </div>
                          {/each}
                        </div>
                      {/if}
                    </div>
                  {/snippet}

                  {#each buildCommentTree(postComments) as rootComment (rootComment.id)}
                    {@render commentNode(rootComment, 0, false)}
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    {/if}
  </section>
</main>

<ConfirmationDialog
  bind:isOpen={showDeletePostDialog}
  title="Delete Blog Post?"
  message={'Are you sure you want to permanently delete "' + (postToDelete?.title || '') + '"? This action is irreversible.'}
  confirmLabel="Delete"
  isDestructive={true}
  onConfirm={executeDeletePost} />

<ConfirmationDialog
  bind:isOpen={showDeleteCommentDialog}
  title="Delete Comment?"
  message="Are you sure you want to permanently delete this comment and all its replies? This action is irreversible."
  confirmLabel="Delete"
  isDestructive={true}
  onConfirm={executeDeleteComment} />
