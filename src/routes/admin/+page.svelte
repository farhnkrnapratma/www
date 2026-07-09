<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';
  import { SvelteMap, SvelteSet } from 'svelte/reactivity';

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
          content: trimmed,
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

  onMount(async () => {
    const saved = localStorage.getItem('theme') as Theme;
    theme = saved || 'auto';

    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      window.location.href = '/admin/login';
      return;
    }

    await Promise.all([fetchPosts(), fetchComments()]);
    isLoading = false;
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

  async function deletePost(post: AdminPost) {
    if (!confirm(`Are you sure you want to delete "${post.title}"?`)) return;

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

  async function deleteComment(id: string) {
    if (!confirm('Are you sure you want to delete this comment?')) return;

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
      const parentAvatar = node.querySelector('.parent-avatar') as HTMLElement;
      const lastAvatar = node.querySelector('.last-reply-avatar') as HTMLElement;
      const trunkLine = node.querySelector('.trunk-line-single') as HTMLElement;
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
    const commentMap = new SvelteMap<string, AdminComment>();
    for (const item of items) {
      commentMap.set(item.id, item);
    }

    function getAncestorAndParent(comment: AdminComment): {
      ancestor: AdminComment;
      parent: AdminComment | null;
    } {
      let current = comment;
      let parent: AdminComment | null = null;
      if (current.parent_id) {
        parent = commentMap.get(current.parent_id) || null;
      }
      while (current.parent_id && commentMap.has(current.parent_id)) {
        current = commentMap.get(current.parent_id)!;
      }
      return { ancestor: current, parent };
    }

    const roots: FlatAdminComment[] = [];
    const rootRepliesMap = new SvelteMap<string, FlatAdminComment[]>();

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
          const replyObj: FlatAdminComment = {
            ...item,
            children: [],
            reply_to_author: parent && parent.id !== ancestor.id ? getCommentAuthor(parent) : null,
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
    return comment.is_anonymous ? 'Anonymous User' : comment.author_name;
  }

  function getCommentIcon(comment: AdminComment) {
    if (comment.author_name === 'Admin') return 'shield_person';
    return comment.is_anonymous ? 'domino_mask' : 'person';
  }
</script>

<nav
  class="fixed top-0 z-40 flex h-15 w-full items-center justify-between bg-adwaita-card/60 backdrop-blur-lg px-5 font-sans border-b border-adwaita-border shadow-xs transition-colors duration-300">
  <div class="flex items-center gap-3">
    <span class="text-sm font-bold text-adwaita-text">CMS Admin Panel</span>
  </div>

  <div class="flex items-center gap-2">
    <div class="relative">
      <button
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

    <button
      onclick={handleLogout}
      disabled={isLoggingOut}
      class="inline-flex h-9 items-center justify-center rounded-lg bg-adwaita-card border border-adwaita-border px-4 text-xs font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover focus:outline-none disabled:opacity-50">
      <i
        class="bi bi-box-arrow-right mr-1.5"
        aria-hidden="true"></i>
      Logout
    </button>
  </div>
</nav>

<main class="pt-15 font-sans flex flex-col min-h-[calc(100vh-3.75rem)]">
  <section class="mx-auto w-full md:w-[80%] lg:w-[55%] md:max-w-none px-6 py-14 flex-1">
    {#if isLoading}
      <div class="flex flex-col items-center justify-center py-20 text-adwaita-subtitle">
        <i
          class="bi bi-hourglass-split text-3xl animate-spin mb-3"
          aria-hidden="true"></i>
        Loading dashboard data...
      </div>
    {:else}
      <div class="mb-8 flex items-center justify-between">
        <h1 class="text-3xl font-bold text-adwaita-text tracking-tight">Blog Posts</h1>
        <a
          href="/admin/new"
          class="inline-flex h-9 items-center justify-center rounded-lg bg-adwaita-blue px-4 text-xs font-semibold text-white transition-colors hover:bg-adwaita-blue-hover focus:outline-none">
          New Post
        </a>
      </div>

      {#if posts.length === 0}
        <div class="boxed-list p-8 text-center text-adwaita-subtitle">
          <i
            class="bi bi-journal-plus text-3xl block mb-2 opacity-60"
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
                        class="rounded bg-palette-green/15 px-2 py-0.5 text-[10px] font-bold text-palette-green border border-palette-green/30"
                        >Published</span>
                    {:else}
                      <span
                        class="rounded bg-palette-yellow/15 px-2 py-0.5 text-[10px] font-bold text-palette-yellow border border-palette-yellow/30"
                        >Draft</span>
                    {/if}
                    {#if postComments.length > 0}
                      <button
                        type="button"
                        onclick={() => toggleComments(post.id)}
                        class="inline-flex items-center gap-1 rounded bg-adwaita-border/40 px-2 py-0.5 text-[10px] font-semibold text-adwaita-subtitle cursor-pointer hover:bg-adwaita-border transition-colors focus:outline-none"
                        title="{expandedPostIds.has(post.id) ? 'Hide' : (
                          'Show'
                        )} {postComments.length} comments">
                        <i
                          class="bi bi-chat-left-text-fill text-[10px] text-adwaita-blue"
                          aria-hidden="true"></i>
                        {expandedPostIds.has(post.id) ? 'Hide' : 'Show'} Comments ({postComments.length})
                      </button>
                    {/if}
                  </div>
                  <h2 class="text-base font-bold text-adwaita-text">{post.title}</h2>
                  <p class="text-xs text-adwaita-subtitle font-mono line-clamp-1">
                    {post.storage_path}
                  </p>
                </div>

                <div class="flex shrink-0 items-center gap-2">
                  <a
                    href="/admin/new?id={post.id}"
                    class="inline-flex h-8 items-center justify-center rounded-lg bg-adwaita-card border border-adwaita-border px-3 text-xs font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover">
                    Edit
                  </a>

                  <div class="relative">
                    <button
                      onclick={() =>
                        (openActionMenuId = openActionMenuId === post.id ? null : post.id)}
                      class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-adwaita-border bg-adwaita-card text-adwaita-text transition-colors hover:bg-adwaita-hover focus:outline-none"
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
                        class="absolute right-0 top-9 z-50 flex min-w-36 flex-col rounded-xl border border-adwaita-border bg-adwaita-card py-1.5 shadow-lg">
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
                            deletePost(post);
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
                  {#each buildCommentTree(postComments) as rootComment (rootComment.id)}
                    <div
                      class="relative flex flex-col gap-4"
                      use:trunkAction>
                      
                      {#if rootComment.children && rootComment.children.length > 0}
                        <div
                          class="trunk-line-single absolute border-l border-adwaita-subtitle/20 z-0"
                          style="left: 16px; width: 0px;">
                        </div>
                      {/if}

                      
                      <div class="relative flex items-start gap-3">
                        
                        <div
                          class="parent-avatar flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-adwaita-card text-adwaita-subtitle border border-adwaita-border z-10">
                          <span
                            class="material-symbols-rounded text-sm text-adwaita-subtitle"
                            style="font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;"
                            aria-hidden="true">
                            {getCommentIcon(rootComment)}
                          </span>
                        </div>

                        
                        <div class="flex-1 min-w-0">
                          <div
                            class="inline-block max-w-full bg-adwaita-card/50 border border-adwaita-border px-4 py-2 text-left"
                            style="border-radius: 18px;">
                            <p class="text-sm leading-relaxed text-adwaita-text/90">
                              <strong class="text-xs font-bold text-adwaita-text/95 mr-2"
                                >{getCommentAuthor(rootComment)}</strong>
                              <span class="whitespace-pre-line">{rootComment.content}</span>
                            </p>
                          </div>

                          
                          <div
                            class="flex flex-wrap items-center gap-3 mt-1 ml-2 text-[10px] text-adwaita-subtitle">
                            <span>{formatDate(rootComment.created_at)}</span>
                            {#if rootComment.is_approved}
                              <span
                                class="rounded bg-palette-green/15 px-2 py-0.5 text-[10px] font-bold text-palette-green border border-palette-green/30">
                                Approved
                              </span>
                            {:else}
                              <span
                                class="rounded bg-palette-yellow/15 px-2 py-0.5 text-[10px] font-bold text-palette-yellow border border-palette-yellow/30">
                                Hidden
                              </span>
                            {/if}
                            <button
                              type="button"
                              onclick={() => {
                                replyTo = rootComment;
                                commentContent = '';
                              }}
                              class="font-bold text-adwaita-text/70 hover:text-adwaita-blue transition-colors cursor-pointer">
                              Reply
                            </button>
                            <button
                              onclick={() => deleteComment(rootComment.id)}
                              class="font-bold text-palette-coral/80 hover:text-palette-coral transition-colors cursor-pointer">
                              Delete
                            </button>
                          </div>

                          
                          {#if replyTo?.id === rootComment.id}
                            <form
                              onsubmit={e => handleAdminSubmit(e, rootComment.id, post.id)}
                              class="mt-3 rounded-xl border border-adwaita-border bg-adwaita-bg/60 p-4">
                              <div class="mb-3 flex items-center justify-between gap-3">
                                <p class="text-xs font-semibold text-adwaita-subtitle">
                                  Replying as Admin to {getCommentAuthor(rootComment)}
                                </p>
                                <button
                                  type="button"
                                  onclick={() => {
                                    replyTo = null;
                                    commentContent = '';
                                  }}
                                  class="inline-flex h-8 items-center justify-center cursor-pointer rounded-lg border border-adwaita-border bg-adwaita-card px-3 text-xs font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover">
                                  Cancel
                                </button>
                              </div>

                              <div class="flex flex-col gap-4">
                                <div class="flex flex-col items-start gap-2">
                                  <label
                                    for="reply-msg-{rootComment.id}"
                                    class="text-xs font-bold text-adwaita-subtitle w-20 shrink-0 mt-1">
                                    Message
                                  </label>
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
                                    class="inline-flex cursor-pointer items-center justify-center rounded-lg bg-adwaita-blue px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-adwaita-blue-hover focus:outline-none disabled:cursor-not-allowed disabled:opacity-55">
                                    {isSubmitting ? 'Posting...' : 'Post Reply'}
                                  </button>
                                </div>
                              </div>
                            </form>
                          {/if}
                        </div>
                      </div>

                      
                      {#if rootComment.children && rootComment.children.length > 0}
                        <div
                          class="relative"
                          style="padding-left: 44px;">
                          {#each rootComment.children as child, i (child.id)}
                            <div class="relative flex items-start gap-3 mt-4">
                              
                              <div
                                class="absolute border-l border-b border-adwaita-subtitle/20 z-0"
                                style="left: -28px; top: -16px; width: 28px; height: 32px; border-bottom-left-radius: 10px;">
                              </div>

                              
                              <div
                                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-adwaita-card text-adwaita-subtitle border border-adwaita-border z-10"
                                class:last-reply-avatar={i === rootComment.children.length - 1}>
                                <span
                                  class="material-symbols-rounded text-sm text-adwaita-subtitle"
                                  style="font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;"
                                  aria-hidden="true">
                                  {getCommentIcon(child)}
                                </span>
                              </div>

                              
                              <div class="flex-1 min-w-0">
                                <div
                                  class="inline-block max-w-full bg-adwaita-card/50 border border-adwaita-border px-4 py-2 text-left"
                                  style="border-radius: 18px;">
                                  <p class="text-sm leading-relaxed text-adwaita-text/90">
                                    <strong class="text-xs font-bold text-adwaita-text/95 mr-2"
                                      >{getCommentAuthor(child)}</strong>
                                    {#if child.reply_to_author}
                                      <span class="font-bold text-adwaita-blue/90 text-xs mr-1"
                                        >@{child.reply_to_author}</span>
                                    {/if}
                                    <span class="whitespace-pre-line">{child.content}</span>
                                  </p>
                                </div>

                                
                                <div
                                  class="flex flex-wrap items-center gap-3 mt-1 ml-2 text-[10px] text-adwaita-subtitle">
                                  <span>{formatDate(child.created_at)}</span>
                                  {#if child.is_approved}
                                    <span
                                      class="rounded bg-palette-green/15 px-2 py-0.5 text-[10px] font-bold text-palette-green border border-palette-green/30">
                                      Approved
                                    </span>
                                  {:else}
                                    <span
                                      class="rounded bg-palette-yellow/15 px-2 py-0.5 text-[10px] font-bold text-palette-yellow border border-palette-yellow/30">
                                      Hidden
                                    </span>
                                  {/if}
                                  <button
                                    type="button"
                                    onclick={() => {
                                      replyTo = child;
                                      commentContent = '';
                                    }}
                                    class="font-bold text-adwaita-text/70 hover:text-adwaita-blue transition-colors cursor-pointer">
                                    Reply
                                  </button>
                                  <button
                                    onclick={() => deleteComment(child.id)}
                                    class="font-bold text-palette-coral/80 hover:text-palette-coral transition-colors cursor-pointer">
                                    Delete
                                  </button>
                                </div>

                                
                                {#if replyTo?.id === child.id}
                                  <form
                                    onsubmit={e => handleAdminSubmit(e, child.id, post.id)}
                                    class="mt-3 rounded-xl border border-adwaita-border bg-adwaita-bg/60 p-4">
                                    <div class="mb-3 flex items-center justify-between gap-3">
                                      <p class="text-xs font-semibold text-adwaita-subtitle">
                                        Replying as Admin to {getCommentAuthor(child)}
                                      </p>
                                      <button
                                        type="button"
                                        onclick={() => {
                                          replyTo = null;
                                          commentContent = '';
                                        }}
                                        class="inline-flex h-8 items-center justify-center cursor-pointer rounded-lg border border-adwaita-border bg-adwaita-card px-3 text-xs font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover">
                                        Cancel
                                      </button>
                                    </div>

                                    <div class="flex flex-col gap-4">
                                      <div class="flex flex-col items-start gap-2">
                                        <label
                                          for="reply-msg-child-{child.id}"
                                          class="text-xs font-bold text-adwaita-subtitle w-20 shrink-0 mt-1">
                                          Message
                                        </label>
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
                                          class="inline-flex cursor-pointer items-center justify-center rounded-lg bg-adwaita-blue px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-adwaita-blue-hover focus:outline-none disabled:cursor-not-allowed disabled:opacity-55">
                                          {isSubmitting ? 'Posting...' : 'Post Reply'}
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
            </div>
          {/each}
        </div>
      {/if}
    {/if}
  </section>
</main>
