<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';
  import { SvelteMap, SvelteSet } from 'svelte/reactivity';
  import {
    Dialog,
    Button,
    IconButton,
    Badge,
    Textarea,
    FormField,
    Input,
    LoadingState,
    EmptyState,
    SkipLink,
    FilterToolbar,
    FilterSelect,
    SortControl,
    SearchResultCount,
    FilterChipGroup,
    FilterEmptyState,
    createFilterSortStore,
  } from '$lib';

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

  const filterStore = createFilterSortStore({
    defaultSortField: 'date',
    defaultSortDir: 'desc',
  });

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
      .replace(/\
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
      alert('Failed to post reply. Please try again.');
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

  const statusFilter = $derived(filterStore.filters['status']?.[0] || 'all');

  const filteredPosts = $derived.by(() => {
    let list = posts;

    const q = filterStore.search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        p => p.title.toLowerCase().includes(q) || p.storage_path.toLowerCase().includes(q),
      );
    }

    if (statusFilter === 'published') {
      list = list.filter(p => p.published);
    } else if (statusFilter === 'draft') {
      list = list.filter(p => !p.published);
    }

    const sortField = filterStore.sort.field;
    const sortDir = filterStore.sort.direction === 'asc' ? 1 : -1;

    return [...list].sort((a, b) => {
      if (sortField === 'title') {
        return a.title.localeCompare(b.title) * sortDir;
      } else if (sortField === 'status') {
        return (Number(a.published) - Number(b.published)) * sortDir;
      } else {
        return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * sortDir;
      }
    });
  });

  onMount(() => {
    filterStore.parseFromUrl(new URL(window.location.href));
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

    resetIdleTimer();
    ACTIVITY_EVENTS.forEach(evt => window.addEventListener(evt, resetIdleTimer, { passive: true }));

    return () => {
      clearTimeout(idleTimer);
      ACTIVITY_EVENTS.forEach(evt => window.removeEventListener(evt, resetIdleTimer));
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
      alert('Failed to update post status. Please try again.');
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
      alert('Failed to delete post. Please try again.');
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
      alert('Failed to delete comment. Please try again.');
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

<svelte:head>
  <title>Console — Admin</title>
</svelte:head>

<SkipLink />

<nav
  class="fixed top-0 z-40 flex h-15 w-full items-center justify-between border-b border-border-subtle bg-surface-card/60 px-5 font-sans shadow-xs backdrop-blur-lg transition-colors duration-300"
  aria-label="Admin navigation">
  <div class="flex items-center gap-4">
    <a
      href="/admin"
      class="flex items-center gap-2">
      <span
        class="material-symbols-rounded text-lg text-accent select-none"
        aria-hidden="true">code</span>
      <span class="text-sm font-bold text-text-primary select-none">Console</span>
    </a>

    <div class="h-4 w-[1px] bg-border-subtle"></div>

    <div class="flex items-center gap-1">
      <a
        href="/admin"
        class="rounded-lg bg-surface-switcher-active px-3 py-1.5 text-xs font-bold text-accent shadow-xs">
        Posts & Comments
      </a>
      <a
        href="/admin/privacy"
        class="rounded-lg px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary">
        Privacy & Analytics
      </a>
    </div>
  </div>

  <div class="flex items-center gap-2">
    <div class="relative">
      <IconButton
        ariaLabel="Change theme"
        variant="default"
        size="md"
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
          role="menu"
          class="absolute top-11 right-0 z-50 flex min-w-31 flex-col rounded-xl border border-border-subtle bg-surface-elevated py-1.5 shadow-lg">
          {#each [['auto', 'bi-circle-half', 'Auto'], ['light', 'bi-sun-fill', 'Light'], ['dark', 'bi-moon-stars-fill', 'Dark']] as const as [val, icon, label] (val)}
            <button
              type="button"
              role="menuitem"
              onclick={() => {
                applyTheme(val);
                themeDropdownOpen = false;
              }}
              class="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-xs font-bold transition-colors hover:bg-surface-hover {(
                theme === val
              ) ?
                'text-accent'
              : 'text-text-primary'}">
              <i
                class="bi {icon} text-sm"
                aria-hidden="true"></i>
              {label}
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <Button
      variant="secondary"
      size="md"
      onclick={handleLogout}
      disabled={isLoggingOut}
      isLoading={isLoggingOut}>
      Sign out
    </Button>
  </div>
</nav>

<main
  id="main-content"
  class="flex min-h-[calc(100vh-3.75rem)] flex-col pt-15 font-sans">
  <section
    class="mx-auto w-full flex-1 px-6 py-14 md:w-[80%] md:max-w-none lg:w-[50%]"
    aria-label="Blog posts">
    {#if isLoading}
      <LoadingState
        label="Loading dashboard data..."
        size="lg"
        class="py-20" />
    {:else}
      <div class="mb-6 flex items-center justify-between gap-4">
        <h1 class="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">Posts</h1>
        <a href="/admin/new">
          <Button
            variant="primary"
            size="md"
            leadingIcon="bi-plus-lg">
            New post
          </Button>
        </a>
      </div>

      {#if posts.length > 0}
        <div class="mb-6">
          <FilterToolbar title="Admin posts filter">
            {#snippet searchSlot()}
              <div class="w-full sm:w-64">
                <Input
                  type="search"
                  placeholder="Search posts..."
                  value={filterStore.search}
                  oninput={e => filterStore.setSearch((e.target as HTMLInputElement).value)}
                  size="sm"
                  aria-label="Search posts" />
              </div>
            {/snippet}

            {#snippet filterControlsSlot()}
              <FilterSelect
                label="Status"
                value={statusFilter}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'published', label: 'Published' },
                  { value: 'draft', label: 'Draft' },
                ]}
                onChange={val => filterStore.setSingleFilter('status', val)} />
            {/snippet}

            {#snippet countSlot()}
              <SearchResultCount
                count={filteredPosts.length}
                total={posts.length}
                itemLabel="posts" />
            {/snippet}

            {#snippet sortSlot()}
              <SortControl
                fields={[
                  { value: 'date', label: 'Date' },
                  { value: 'title', label: 'Title' },
                  { value: 'status', label: 'Status' },
                ]}
                currentField={filterStore.sort.field}
                currentDirection={filterStore.sort.direction}
                onFieldChange={field => filterStore.setSort(field)}
                onDirectionToggle={() => filterStore.toggleSortDirection()} />
            {/snippet}

            {#snippet chipsSlot()}
              <FilterChipGroup
                chips={filterStore.activeChips}
                onRemove={(type, val) => filterStore.removeFilter(type, val)}
                onClearAll={() => filterStore.clearAllFilters()} />
            {/snippet}
          </FilterToolbar>
        </div>
      {/if}

      {#if posts.length === 0}
        <EmptyState
          title="No posts yet"
          description="You haven't published any posts. Create your first article to get started."
          icon="bi-journal-plus">
          {#snippet actions()}
            <a href="/admin/new">
              <Button
                variant="primary"
                size="sm"
                leadingIcon="bi-plus-lg">New post</Button>
            </a>
          {/snippet}
        </EmptyState>
      {:else if filteredPosts.length === 0}
        <FilterEmptyState
          title="No matching posts found"
          description="No posts match the current filter or search criteria."
          onClearFilters={() => filterStore.clearAllFilters()} />
      {:else}
        <div
          class="boxed-list overflow-visible! text-left"
          role="list"
          aria-label="Blog posts list">
          {#each filteredPosts as post, index (post.id)}
            {@const postComments = getPostComments(post.id)}
            {@const isLastItem = index >= filteredPosts.length - 2 && filteredPosts.length > 2}
            <div
              class="action-row group flex flex-col items-stretch gap-4 py-4"
              role="listitem">
              <div class="flex items-start justify-between gap-3">
                <div class="flex min-w-0 flex-1 flex-col gap-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="text-xs font-semibold text-text-secondary">
                      {formatDate(post.created_at)}
                    </span>
                    {#if post.published}
                      <Badge variant="success">Published</Badge>
                    {:else}
                      <Badge variant="warning">Draft</Badge>
                    {/if}
                    {#if postComments.length > 0}
                      <button
                        type="button"
                        onclick={() => toggleComments(post.id)}
                        aria-expanded={expandedPostIds.has(post.id)}
                        aria-controls="comments-{post.id}"
                        class="inline-flex h-6 cursor-pointer items-center gap-1 rounded-lg bg-border-subtle/40 px-2 text-[10px] font-semibold text-text-secondary transition-colors hover:bg-border-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                        <i
                          class="bi bi-chat-left-text-fill text-[10px] text-accent"
                          aria-hidden="true"></i>
                        {expandedPostIds.has(post.id) ? 'Hide' : 'Show'} comments ({postComments.length})
                      </button>
                    {/if}
                  </div>
                  <h2 class="text-base font-bold text-text-primary">{post.title}</h2>
                  <p
                    class="line-clamp-1 font-mono text-xs text-text-muted"
                    aria-label="Storage path">
                    {post.storage_path}
                  </p>
                </div>

                <div class="flex shrink-0 items-center gap-2">
                  <a
                    href="/admin/new?id={post.id}"
                    aria-label="Edit post: {post.title}">
                    <Button
                      variant="secondary"
                      size="sm">Edit post</Button>
                  </a>

                  <div class="relative">
                    <IconButton
                      ariaLabel="More actions for {post.title}"
                      variant="default"
                      size="sm"
                      onclick={() =>
                        (openActionMenuId = openActionMenuId === post.id ? null : post.id)}
                      aria-haspopup="true"
                      aria-expanded={openActionMenuId === post.id}>
                      <i
                        class="bi bi-three-dots-vertical text-sm"
                        aria-hidden="true"></i>
                    </IconButton>

                    {#if openActionMenuId === post.id}
                      <button
                        class="fixed inset-0 z-40 cursor-default"
                        onclick={() => (openActionMenuId = null)}
                        aria-label="Close menu"></button>
                      <div
                        role="menu"
                        aria-label="Post actions"
                        class="absolute {isLastItem ? 'bottom-full mb-1' : (
                          'top-9'
                        )} right-0 z-50 flex min-w-36 flex-col rounded-xl border border-border-subtle bg-surface-elevated py-1.5 shadow-lg">
                        <button
                          type="button"
                          role="menuitem"
                          onclick={() => {
                            togglePublish(post);
                            openActionMenuId = null;
                          }}
                          class="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-left text-xs font-bold text-text-primary transition-colors hover:bg-surface-hover">
                          <i
                            class="bi {post.published ? 'bi-eye-slash' : 'bi-eye'} text-sm"
                            aria-hidden="true"></i>
                          {post.published ? 'Unpublish' : 'Publish post'}
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onclick={() => {
                            openActionMenuId = null;
                            confirmDeletePost(post);
                          }}
                          class="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-left text-xs font-bold text-danger transition-colors hover:bg-danger-subtle">
                          <i
                            class="bi bi-trash3 text-sm"
                            aria-hidden="true"></i>
                          Delete post
                        </button>
                      </div>
                    {/if}
                  </div>
                </div>
              </div>

              {#if postComments.length > 0 && expandedPostIds.has(post.id)}
                <div
                  id="comments-{post.id}"
                  class="flex flex-col gap-6 p-4">
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
                          class="trunk-line-single absolute z-0 border-l border-border-subtle"
                          style="left: 16px; width: 0px;">
                        </div>
                      {/if}

                      <div class="comment-row-wrapper relative flex items-start gap-3">
                        <div
                          class="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface-elevated text-text-secondary"
                          class:parent-avatar={comment.children && comment.children.length > 0}
                          class:last-reply-avatar={isLastChildOfParent}
                          aria-hidden="true">
                          <span
                            class="material-symbols-rounded text-sm text-text-secondary"
                            style="font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;">
                            {getCommentIcon(comment)}
                          </span>
                        </div>

                        <div class="min-w-0 flex-1">
                          <div
                            class="inline-block max-w-full rounded-2xl border border-border-subtle bg-surface-card/70 px-4 py-2.5 text-left">
                            <div class="text-xs font-bold text-text-primary">
                              {getCommentAuthor(comment)}
                            </div>
                            <p class="mt-0.5 text-sm leading-relaxed text-text-secondary">
                              {#if comment.reply_to_author}
                                <span class="mr-1.5 text-xs font-bold text-accent">
                                  {comment.reply_to_author}
                                </span>
                              {/if}
                              <span class="whitespace-pre-line">{comment.content}</span>
                            </p>
                          </div>

                          <div
                            class="mt-1.5 ml-2 flex flex-wrap items-center gap-3 text-[10px] text-text-muted">
                            <span>{formatDate(comment.created_at)}</span>
                            {#if !comment.is_approved}
                              <Badge variant="warning">Hidden</Badge>
                            {/if}
                            {#if comment.is_approved}
                              <button
                                type="button"
                                onclick={() => {
                                  replyTo = comment;
                                  commentContent = '';
                                }}
                                class="inline-flex h-6 cursor-pointer items-center rounded-lg bg-border-subtle/30 px-2 py-0.5 font-bold text-text-secondary transition-colors hover:bg-border-subtle hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                                Reply
                              </button>
                            {/if}
                            <button
                              type="button"
                              onclick={() => confirmDeleteComment(comment.id)}
                              aria-label="Delete comment by {getCommentAuthor(comment)}"
                              class="ml-auto inline-flex h-6 cursor-pointer items-center rounded-lg border border-danger/20 bg-danger-subtle px-2 py-0.5 font-bold text-danger transition-colors hover:bg-danger/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger">
                              Delete
                            </button>
                          </div>

                          {#if replyTo?.id === comment.id}
                            <form
                              onsubmit={e => handleAdminSubmit(e, comment.id, post.id)}
                              class="mt-3 rounded-xl border border-border-subtle bg-surface-base p-4">
                              <div class="mb-3 flex items-center justify-between gap-3">
                                <p class="text-xs font-semibold text-text-secondary">
                                  Replying as Admin to <span class="font-bold text-text-primary"
                                    >{getCommentAuthor(comment)}</span>
                                </p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onclick={() => {
                                    replyTo = null;
                                    commentContent = '';
                                  }}>
                                  Cancel
                                </Button>
                              </div>

                              <div class="flex flex-col gap-2.5">
                                <FormField
                                  id="reply-msg-{comment.id}"
                                  label="Message"
                                  counter="{1000 - commentContent.length} characters left">
                                  <Textarea
                                    id="reply-msg-{comment.id}"
                                    required
                                    rows={3}
                                    maxlength={1000}
                                    placeholder="Write your reply…"
                                    bind:value={commentContent} />
                                </FormField>
                                <div class="flex justify-end">
                                  <Button
                                    type="submit"
                                    variant="primary"
                                    size="sm"
                                    isLoading={isSubmitting}>
                                    {isSubmitting ? 'Posting…' : 'Post reply'}
                                  </Button>
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
                                class="absolute z-0 border-b border-l border-border-subtle"
                                style="left: -28px; top: -16px; width: 28px; height: 32px; border-bottom-left-radius: 10px;"
                                aria-hidden="true">
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

<Dialog
  bind:isOpen={showDeletePostDialog}
  title="Delete post?"
  description={'Permanently delete "' + (postToDelete?.title || '') + '"? This cannot be undone.'}
  onClose={() => (showDeletePostDialog = false)}>
  {#snippet footer()}
    <Button
      variant="secondary"
      size="md"
      onclick={() => (showDeletePostDialog = false)}>
      Cancel
    </Button>
    <Button
      variant="destructive"
      size="md"
      onclick={executeDeletePost}>
      Delete post
    </Button>
  {/snippet}
</Dialog>

<Dialog
  bind:isOpen={showDeleteCommentDialog}
  title="Delete comment?"
  description="Permanently delete this comment and all its replies? This cannot be undone."
  onClose={() => (showDeleteCommentDialog = false)}>
  {#snippet footer()}
    <Button
      variant="secondary"
      size="md"
      onclick={() => (showDeleteCommentDialog = false)}>
      Cancel
    </Button>
    <Button
      variant="destructive"
      size="md"
      onclick={executeDeleteComment}>
      Delete comment
    </Button>
  {/snippet}
</Dialog>
