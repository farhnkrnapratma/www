<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';

	let isLoading = $state(true);
	let posts = $state<any[]>([]);
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

	interface ThreadedAdminComment extends AdminComment {
		children: ThreadedAdminComment[];
		depth: number;
	}

	let comments = $state<AdminComment[]>([]);

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

	async function togglePublish(post: any) {
		const newStatus = !post.published;
		const { error } = await supabase
			.from('posts')
			.update({ published: newStatus })
			.eq('id', post.id);

		if (!error) {
			posts = posts.map((p) => (p.id === post.id ? { ...p, published: newStatus } : p));
		} else {
			alert('Failed to update post status.');
		}
	}

	async function deletePost(post: any) {
		if (!confirm(`Are you sure you want to delete "${post.title}"?`)) return;

		const { error: storageError } = await supabase.storage
			.from('blog-posts')
			.remove([post.storage_path]);

		if (storageError) {
			console.warn('Storage deletion warning:', storageError);
		}

		const { error: dbError } = await supabase.from('posts').delete().eq('id', post.id);

		if (!dbError) {
			posts = posts.filter((p) => p.id !== post.id);
			comments = comments.filter((comment) => comment.post_id !== post.id);
		} else {
			alert('Failed to delete post from database.');
		}
	}

	async function toggleCommentApproval(comment: any) {
		const newStatus = !comment.is_approved;
		const { error } = await supabase
			.from('comments')
			.update({ is_approved: newStatus })
			.eq('id', comment.id);

		if (!error) {
			comments = comments.map((c) => (c.id === comment.id ? { ...c, is_approved: newStatus } : c));
		} else {
			alert('Failed to update comment status.');
		}
	}

	async function deleteComment(id: string) {
		if (!confirm('Are you sure you want to delete this comment?')) return;

		const { error } = await supabase.from('comments').delete().eq('id', id);

		if (!error) {
			const deletedIds = getDescendantCommentIds(id, comments);
			comments = comments.filter((c) => !deletedIds.has(c.id));
		} else {
			alert('Failed to delete comment.');
		}
	}

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function getPostComments(postId: string) {
		return comments.filter((comment) => comment.post_id === postId);
	}

	function buildCommentTree(items: AdminComment[]) {
		const nodes = new Map<string, ThreadedAdminComment>();
		const roots: ThreadedAdminComment[] = [];

		for (const comment of items) {
			nodes.set(comment.id, { ...comment, children: [], depth: 0 });
		}

		for (const comment of [...nodes.values()].sort(
			(a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
		)) {
			if (comment.parent_id && nodes.has(comment.parent_id)) {
				nodes.get(comment.parent_id)?.children.push(comment);
			} else {
				roots.push(comment);
			}
		}

		return roots;
	}

	function flattenCommentTree(nodes: ThreadedAdminComment[], depth = 0): ThreadedAdminComment[] {
		return nodes.flatMap((node) => {
			const current = { ...node, depth };
			return [current, ...flattenCommentTree(node.children, depth + 1)];
		});
	}

	function getPostThreadItems(postId: string) {
		return flattenCommentTree(buildCommentTree(getPostComments(postId)));
	}

	function getDescendantCommentIds(commentId: string, items: AdminComment[]) {
		const deletedIds = new Set([commentId]);
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
		return comment.is_anonymous ? 'domino_mask' : 'person';
	}

	function getCommentIndent(depth: number) {
		return `${Math.min(depth, 4) * 1.25}rem`;
	}
</script>

<nav
	class="fixed top-0 z-40 flex h-15 w-full items-center justify-between bg-adwaita-card/60 backdrop-blur-lg px-5 font-sans border-b border-adwaita-border shadow-xs transition-colors duration-300"
>
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
				aria-expanded={themeDropdownOpen}
			>
				{#if theme === 'auto'}
					<i class="bi bi-circle-half" aria-hidden="true"></i>
				{:else}
					<i class="bi {theme === 'dark' ? 'bi-moon-stars-fill' : 'bi-sun-fill'}" aria-hidden="true"
					></i>
				{/if}
			</button>

			{#if themeDropdownOpen}
				<button
					class="fixed inset-0 z-40 cursor-default"
					onclick={() => (themeDropdownOpen = false)}
					aria-label="Close theme menu"
				></button>
				<div
					class="absolute right-0 top-11 z-50 flex min-w-31.25 flex-col rounded-xl border border-adwaita-border bg-adwaita-card py-1.5 shadow-lg"
				>
					<button
						type="button"
						onclick={() => {
							applyTheme('auto');
							themeDropdownOpen = false;
						}}
						class="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-xs font-bold transition-colors hover:bg-adwaita-hover {theme ===
						'auto'
							? 'text-adwaita-blue'
							: 'text-adwaita-text'}"
					>
						<i class="bi bi-circle-half text-sm" aria-hidden="true"></i>
						Auto
					</button>
					<button
						type="button"
						onclick={() => {
							applyTheme('light');
							themeDropdownOpen = false;
						}}
						class="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-xs font-bold transition-colors hover:bg-adwaita-hover {theme ===
						'light'
							? 'text-adwaita-blue'
							: 'text-adwaita-text'}"
					>
						<i class="bi bi-sun-fill text-sm" aria-hidden="true"></i>
						Light
					</button>
					<button
						type="button"
						onclick={() => {
							applyTheme('dark');
							themeDropdownOpen = false;
						}}
						class="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-xs font-bold transition-colors hover:bg-adwaita-hover {theme ===
						'dark'
							? 'text-adwaita-blue'
							: 'text-adwaita-text'}"
					>
						<i class="bi bi-moon-stars-fill text-sm" aria-hidden="true"></i>
						Dark
					</button>
				</div>
			{/if}
		</div>

		<button
			onclick={handleLogout}
			disabled={isLoggingOut}
			class="inline-flex h-9 items-center justify-center rounded-lg bg-adwaita-card border border-adwaita-border px-4 text-xs font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover focus:outline-none disabled:opacity-50"
		>
			<i class="bi bi-box-arrow-right mr-1.5" aria-hidden="true"></i>
			Logout
		</button>
	</div>
</nav>

<main class="pt-15 font-sans flex flex-col min-h-[calc(100vh-3.75rem)]">
	<section class="mx-auto w-full md:w-[80%] lg:w-[55%] md:max-w-none px-6 py-14 flex-1">
		{#if isLoading}
			<div class="flex flex-col items-center justify-center py-20 text-adwaita-subtitle">
				<i class="bi bi-hourglass-split text-3xl animate-spin mb-3" aria-hidden="true"></i>
				Loading dashboard data...
			</div>
		{:else}
			<div class="mb-8 flex items-center justify-between">
				<h1 class="text-3xl font-bold text-adwaita-text tracking-tight">Blog Posts</h1>
				<a
					href="/admin/new"
					class="inline-flex h-9 items-center justify-center rounded-lg bg-adwaita-blue px-4 text-xs font-semibold text-white transition-colors hover:bg-adwaita-blue-hover focus:outline-none"
				>
					New Post
				</a>
			</div>

			{#if posts.length === 0}
				<div class="boxed-list p-8 text-center text-adwaita-subtitle">
					<i class="bi bi-journal-plus text-3xl block mb-2 opacity-60" aria-hidden="true"></i>
					No posts found.
				</div>
			{:else}
				<div class="boxed-list text-left">
					{#each posts as post (post.id)}
						{@const postComments = getPostComments(post.id)}
						{@const postThreadItems = getPostThreadItems(post.id)}
						<div class="action-row group flex flex-col items-stretch gap-4 py-4">
							<div class="flex items-start justify-between gap-3">
								<div class="flex min-w-0 flex-1 flex-col gap-1">
									<div class="flex flex-wrap items-center gap-2">
										<span class="text-xs font-semibold text-adwaita-subtitle"
											>{formatDate(post.created_at)}</span
										>
										{#if post.published}
											<span
												class="rounded bg-palette-green/15 px-2 py-0.5 text-[10px] font-bold text-palette-green border border-palette-green/30"
												>Published</span
											>
										{:else}
											<span
												class="rounded bg-palette-yellow/15 px-2 py-0.5 text-[10px] font-bold text-palette-yellow border border-palette-yellow/30"
												>Draft</span
											>
										{/if}
										{#if postComments.length > 0}
											<span
												class="inline-flex items-center gap-1 rounded bg-adwaita-border/40 px-2 py-0.5 text-[10px] font-semibold text-adwaita-subtitle"
												title="{postComments.length} comments"
											>
												<i class="bi bi-chat-left-text-fill text-[10px]" aria-hidden="true"></i>
												{postComments.length}
											</span>
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
										class="inline-flex h-8 items-center justify-center rounded-lg bg-adwaita-card border border-adwaita-border px-3 text-xs font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover"
									>
										Edit
									</a>

									<div class="relative">
										<button
											onclick={() =>
												(openActionMenuId = openActionMenuId === post.id ? null : post.id)}
											class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-adwaita-border bg-adwaita-card text-adwaita-text transition-colors hover:bg-adwaita-hover focus:outline-none"
											aria-label="More actions"
											aria-haspopup="true"
											aria-expanded={openActionMenuId === post.id}
										>
											<i class="bi bi-three-dots-vertical text-sm" aria-hidden="true"></i>
										</button>

										{#if openActionMenuId === post.id}
											<button
												class="fixed inset-0 z-40 cursor-default"
												onclick={() => (openActionMenuId = null)}
												aria-label="Close menu"
											></button>
											<div
												class="absolute right-0 top-9 z-50 flex min-w-36 flex-col rounded-xl border border-adwaita-border bg-adwaita-card py-1.5 shadow-lg"
											>
												<button
													type="button"
													onclick={() => {
														togglePublish(post);
														openActionMenuId = null;
													}}
													class="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-left text-xs font-bold text-adwaita-text transition-colors hover:bg-adwaita-hover"
												>
													<i
														class="bi {post.published ? 'bi-eye-slash' : 'bi-eye'} text-sm"
														aria-hidden="true"
													></i>
													{post.published ? 'Unpublish' : 'Publish'}
												</button>
												<button
													type="button"
													onclick={() => {
														openActionMenuId = null;
														deletePost(post);
													}}
													class="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-left text-xs font-bold text-palette-coral transition-colors hover:bg-palette-coral/10"
												>
													<i class="bi bi-trash3 text-sm" aria-hidden="true"></i>
													Delete
												</button>
											</div>
										{/if}
									</div>
								</div>
							</div>

							{#if postComments.length > 0}
								<div
									class="relative z-20 rounded-lg border border-adwaita-border/60 bg-adwaita-bg/60"
								>
									{#each postThreadItems as comment (comment.id)}
										<div
											class="border-b border-adwaita-border/50 p-3 last:border-b-0 {comment.depth >
											0
												? 'border-l border-l-adwaita-border/70'
												: ''}"
											style:margin-left={getCommentIndent(comment.depth)}
										>
											<div
												class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
											>
												<div class="min-w-0">
													<div class="flex flex-wrap items-center gap-2">
														<h3
															class="inline-flex min-w-0 items-center gap-1.5 text-sm font-bold text-adwaita-text"
														>
															<span
																class="material-symbols-rounded text-base text-adwaita-subtitle"
																aria-hidden="true">{getCommentIcon(comment)}</span
															>
															<span class="truncate">{getCommentAuthor(comment)}</span>
														</h3>
														{#if comment.is_approved}
															<span
																class="rounded bg-palette-green/15 px-2 py-0.5 text-[10px] font-bold text-palette-green border border-palette-green/30"
																>Approved</span
															>
														{:else}
															<span
																class="rounded bg-palette-yellow/15 px-2 py-0.5 text-[10px] font-bold text-palette-yellow border border-palette-yellow/30"
																>Hidden</span
															>
														{/if}
													</div>
													<p class="mt-1 text-xs font-semibold text-adwaita-subtitle">
														{formatDate(comment.created_at)}
													</p>
												</div>

												<div class="flex shrink-0 items-center gap-2">
													<button
														onclick={() => toggleCommentApproval(comment)}
														class="inline-flex h-8 items-center justify-center rounded-lg bg-adwaita-card border border-adwaita-border px-3 text-xs font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover"
													>
														{comment.is_approved ? 'Hide' : 'Approve'}
													</button>
													<button
														onclick={() => deleteComment(comment.id)}
														class="inline-flex h-8 items-center justify-center rounded-lg bg-palette-coral/10 border border-palette-coral/30 px-3 text-xs font-semibold text-palette-coral transition-colors hover:bg-palette-coral/20"
													>
														Delete
													</button>
												</div>
											</div>
											<p class="mt-2 text-sm text-adwaita-subtitle leading-relaxed">
												{comment.content}
											</p>
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
