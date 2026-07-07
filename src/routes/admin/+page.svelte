<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';

	let isLoading = $state(true);
	let posts = $state<any[]>([]);
	let comments = $state<any[]>([]);
	let activeTab = $state<'posts' | 'comments'>('posts');
	let isLoggingOut = $state(false);

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
			.order('created_at', { ascending: false });

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
			comments = comments.filter((c) => c.id !== id);
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
</script>

<nav
	class="fixed top-0 z-40 flex h-15 w-full items-center justify-between bg-adwaita-card px-5 font-sans border-b border-adwaita-border shadow-xs transition-colors duration-300"
>
	<div class="flex items-center gap-3">
		<span class="text-sm font-bold text-adwaita-text">CMS Admin Panel</span>
	</div>

	<div class="flex items-center gap-2">
		<a
			href="/admin/new"
			class="inline-flex h-9 items-center justify-center rounded-lg bg-adwaita-blue px-4 text-xs font-semibold text-white transition-colors hover:bg-adwaita-blue-hover focus:outline-none"
		>
			<i class="bi bi-plus-lg mr-1.5" aria-hidden="true"></i>
			New Post
		</a>

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
					class="absolute right-0 top-11 z-50 flex min-w-[125px] flex-col rounded-xl border border-adwaita-border bg-adwaita-card py-1.5 shadow-lg"
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
	<section class="mx-auto w-full md:w-[50%] md:max-w-none px-6 py-10 flex-1">
		{#if isLoading}
			<div class="flex flex-col items-center justify-center py-20 text-adwaita-subtitle">
				<i class="bi bi-hourglass-split text-3xl animate-spin mb-3" aria-hidden="true"></i>
				Loading dashboard data...
			</div>
		{:else}
			<div class="flex border-b border-adwaita-border mb-8">
				<button
					onclick={() => (activeTab = 'posts')}
					class="px-4 py-2 text-sm font-bold border-b-2 transition-colors {activeTab === 'posts'
						? 'border-adwaita-blue text-adwaita-blue'
						: 'border-transparent text-adwaita-subtitle hover:text-adwaita-text'}"
				>
					Blog Posts ({posts.length})
				</button>
				<button
					onclick={() => (activeTab = 'comments')}
					class="px-4 py-2 text-sm font-bold border-b-2 transition-colors {activeTab === 'comments'
						? 'border-adwaita-blue text-adwaita-blue'
						: 'border-transparent text-adwaita-subtitle hover:text-adwaita-text'}"
				>
					Comments ({comments.length})
				</button>
			</div>

			{#if activeTab === 'posts'}
				{#if posts.length === 0}
					<div class="boxed-list p-8 text-center text-adwaita-subtitle">
						<i class="bi bi-journal-plus text-3xl block mb-2 opacity-60" aria-hidden="true"></i>
						No posts found. Write your first blog post by clicking the "New Post" button above.
					</div>
				{:else}
					<div class="boxed-list text-left">
						{#each posts as post (post.id)}
							<div
								class="action-row group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4"
							>
								<div class="flex flex-col gap-1 pr-6">
									<div class="flex items-center gap-2">
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
									</div>
									<h3 class="text-base font-bold text-adwaita-text">{post.title}</h3>
									<p class="text-xs text-adwaita-subtitle font-mono line-clamp-1">
										{post.storage_path}
									</p>
								</div>

								<div
									class="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end border-t border-adwaita-border/40 pt-3 sm:border-t-0 sm:pt-0"
								>
									<button
										onclick={() => togglePublish(post)}
										class="inline-flex h-8 items-center justify-center rounded-lg bg-adwaita-card border border-adwaita-border px-3 text-xs font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover"
									>
										{post.published ? 'Unpublish' : 'Publish'}
									</button>
									<a
										href="/admin/new?id={post.id}"
										class="inline-flex h-8 items-center justify-center rounded-lg bg-adwaita-card border border-adwaita-border px-3 text-xs font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover"
									>
										Edit
									</a>
									<button
										onclick={() => deletePost(post)}
										class="inline-flex h-8 items-center justify-center rounded-lg bg-palette-coral/10 border border-palette-coral/30 px-3 text-xs font-semibold text-palette-coral transition-colors hover:bg-palette-coral/20"
									>
										Delete
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			{:else}
				{#if comments.length === 0}
					<div class="boxed-list p-8 text-center text-adwaita-subtitle">
						<i class="bi bi-chat-left-dots text-3xl block mb-2 opacity-60" aria-hidden="true"></i>
						No comments submitted yet.
					</div>
				{:else}
					<div class="boxed-list text-left">
						{#each comments as comment (comment.id)}
							<div class="action-row group flex flex-col gap-3 py-4">
								<div class="flex flex-col gap-1 w-full">
									<div class="flex items-center justify-between gap-4">
										<div class="flex items-center gap-2">
											<h4 class="text-sm font-bold text-adwaita-text">{comment.author_name}</h4>
											{#if comment.is_approved}
												<span
													class="rounded bg-emerald-100 dark:bg-emerald-950/20 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30"
													>Approved</span
												>
											{:else}
												<span
													class="rounded bg-red-100 dark:bg-red-950/20 px-2 py-0.5 text-[9px] font-bold text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/30"
													>Flagged/Hidden</span
												>
											{/if}
										</div>
										<span class="text-[10px] font-semibold text-adwaita-subtitle"
											>{formatDate(comment.created_at)}</span
										>
									</div>
									<p class="text-xs text-adwaita-subtitle mt-0.5">
										Post: <strong class="text-adwaita-text"
											>{comment.posts?.title || 'Unknown Post'}</strong
										>
									</p>
									<p
										class="text-sm text-adwaita-subtitle mt-2 bg-zinc-950/[0.015] border border-adwaita-border/40 p-2.5 rounded-lg"
									>
										{comment.content}
									</p>
								</div>

								<div
									class="flex items-center justify-end gap-2 border-t border-adwaita-border/40 pt-3"
								>
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
						{/each}
					</div>
				{/if}
			{/if}
		{/if}
	</section>
</main>
