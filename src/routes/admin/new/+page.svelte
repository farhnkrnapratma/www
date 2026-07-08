<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';
	import { marked } from 'marked';

	let isCheckingAuth = $state(true);
	let title = $state('');
	let slug = $state('');
	let excerpt = $state('');
	let markdownContent = $state('# New Post\n\nWrite your markdown content here...');
	let published = $state(false);

	let isSubmitting = $state(false);
	let errorMessage = $state<string | null>(null);
	let activeTab = $state<'editor' | 'preview'>('editor');
	let previewHtml = $state('');

	let isEditMode = $state(false);
	let editId = $state<string | null>(null);
	let originalSlug = '';

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
		}
	});

	async function loadPostForEdit(id: string) {
		try {
			const { data: post, error } = await supabase.from('posts').select('*').eq('id', id).single();

			if (error || !post) {
				throw error || new Error('Post not found');
			}

			title = post.title;
			slug = post.slug;
			originalSlug = post.slug;
			excerpt = post.excerpt || '';
			published = post.published;

			const { data: fileData, error: fileError } = await supabase.storage
				.from('blog-posts')
				.download(post.storage_path);

			if (fileError) {
				throw fileError;
			}

			markdownContent = await fileData.text();
		} catch (err: any) {
			console.error('Error loading post for edit:', err);
			errorMessage = 'Failed to load post data: ' + err.message;
		}
	}

	$effect(() => {
		if (title && !isEditMode) {
			slug = title
				.toLowerCase()
				.replace(/[^a-z0-9\s-]/g, '') // remove special chars
				.replace(/\s+/g, '-') // replace spaces with hyphens
				.replace(/-+/g, '-') // remove multiple consecutive hyphens
				.replace(/^-+|-+$/g, ''); // trim leading/trailing hyphens
		}
	});

	$effect(() => {
		if (markdownContent) {
			Promise.resolve(marked.parse(markdownContent)).then((html) => {
				previewHtml = html;
			});
		}
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!title.trim() || !slug.trim() || !markdownContent.trim()) {
			errorMessage = 'Title, slug, and markdown content are required.';
			return;
		}

		isSubmitting = true;
		errorMessage = null;

		try {
			const fileName = `${slug}.md`;
			const storagePath = `${fileName}`;

			const mdBlob = new Blob([markdownContent], { type: 'text/markdown' });
			const mdFile = new File([mdBlob], fileName, { type: 'text/markdown' });

			if (isEditMode && editId) {
				const { error: uploadError } = await supabase.storage
					.from('blog-posts')
					.upload(storagePath, mdFile, {
						cacheControl: '3600',
						upsert: true
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
						published,
						storage_path: storagePath
					})
					.eq('id', editId);

				if (dbError) {
					throw dbError;
				}

				if (originalSlug && originalSlug !== slug) {
					await supabase.storage.from('blog-posts').remove([`${originalSlug}.md`]);
				}
			} else {
				const { error: uploadError } = await supabase.storage
					.from('blog-posts')
					.upload(storagePath, mdFile, {
						cacheControl: '3600',
						upsert: true
					});

				if (uploadError) {
					throw new Error(`Storage upload failed: ${uploadError.message}`);
				}

				const { error: dbError } = await supabase.from('posts').insert({
					title: title.trim(),
					slug: slug.trim(),
					excerpt: excerpt.trim() || null,
					published,
					storage_path: storagePath
				});

				if (dbError) {
					await supabase.storage.from('blog-posts').remove([storagePath]);
					throw dbError;
				}
			}

			window.location.href = '/admin';
		} catch (err: any) {
			console.error('Error saving post:', err);
			errorMessage = err.message || 'Failed to save blog post.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<nav
	class="fixed top-0 z-40 flex h-15 w-full items-center justify-between bg-adwaita-card/60 backdrop-blur-lg px-5 font-sans border-b border-adwaita-border shadow-xs transition-colors duration-300"
>
	<a
		href="/admin"
		class="inline-flex h-9 items-center justify-center rounded-lg border border-adwaita-border bg-adwaita-card px-4 text-xs font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover focus:outline-none"
	>
		<i class="bi bi-arrow-left mr-2" aria-hidden="true"></i>
		Cancel
	</a>

	<div class="flex items-center gap-3">
		<span class="text-sm font-bold text-adwaita-subtitle"
			>{isEditMode ? 'Edit Post' : 'Write New Post'}</span
		>

		<div class="relative">
			<button
				type="button"
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
	</div>
</nav>

<main class="pt-15 font-sans flex flex-col min-h-[calc(100vh-3.75rem)]">
	{#if isCheckingAuth}
		<div class="flex flex-col items-center justify-center py-20 text-adwaita-subtitle flex-1">
			<i class="bi bi-hourglass-split text-3xl animate-spin mb-3" aria-hidden="true"></i>
			Verifying credentials...
		</div>
	{:else}
		<section class="mx-auto w-full max-w-4xl px-6 py-10 flex-1">
			{#if errorMessage}
				<div
					class="p-3 mb-6 rounded-lg text-sm font-semibold bg-palette-coral/10 text-palette-coral border border-palette-coral/30"
				>
					{errorMessage}
				</div>
			{/if}

			<form onsubmit={handleSubmit} class="flex flex-col gap-6">
				<div class="boxed-list p-5 text-left bg-zinc-950/1">
					<h2 class="text-sm font-bold text-adwaita-text mb-4">Post Settings</h2>
					<div class="flex flex-col gap-4">
						<div class="flex flex-col sm:flex-row sm:items-center gap-2">
							<label for="post-title" class="text-xs font-bold text-adwaita-subtitle w-20 shrink-0"
								>Title</label
							>
							<input
								type="text"
								id="post-title"
								required
								placeholder="Getting Started with Rust"
								bind:value={title}
								class="w-full px-3 py-2 text-sm bg-adwaita-bg border border-adwaita-border rounded-lg text-adwaita-text placeholder:text-adwaita-subtitle/70 focus:outline-none focus:border-adwaita-blue transition-colors"
							/>
						</div>
						<div class="flex flex-col sm:flex-row sm:items-center gap-2">
							<label for="post-slug" class="text-xs font-bold text-adwaita-subtitle w-20 shrink-0"
								>Slug</label
							>
							<input
								type="text"
								id="post-slug"
								required
								placeholder="getting-started-with-rust"
								bind:value={slug}
								class="w-full px-3 py-2 text-sm bg-adwaita-bg border border-adwaita-border rounded-lg text-adwaita-text placeholder:text-adwaita-subtitle/70 focus:outline-none focus:border-adwaita-blue transition-colors"
							/>
						</div>
						<div class="flex flex-col items-start gap-2">
							<label
								for="post-excerpt"
								class="text-xs font-bold text-adwaita-subtitle w-20 shrink-0 mt-1">Excerpt</label
							>
							<textarea
								id="post-excerpt"
								rows="2"
								placeholder="Brief summary of the article..."
								bind:value={excerpt}
								class="w-full px-3 py-1.5 text-sm bg-adwaita-bg border border-adwaita-border rounded-lg text-adwaita-text placeholder:text-adwaita-subtitle/70 focus:outline-none focus:border-adwaita-blue transition-colors resize-none"
							></textarea>
						</div>
						<div class="flex items-center gap-2 mt-2">
							<input
								type="checkbox"
								id="post-publish"
								bind:checked={published}
								class="rounded border-adwaita-border text-adwaita-blue focus:ring-adwaita-blue"
							/>
							<label
								for="post-publish"
								class="text-xs font-bold text-adwaita-text cursor-pointer select-none"
								>Publish immediately</label
							>
						</div>
					</div>
				</div>

				<div class="boxed-list overflow-hidden text-left flex flex-col min-h-100">
					<div class="flex border-b border-adwaita-border bg-adwaita-hover/30 px-3 py-1">
						<button
							type="button"
							onclick={() => (activeTab = 'editor')}
							class="px-4 py-2 text-xs font-bold border-b-2 transition-colors {activeTab ===
							'editor'
								? 'border-adwaita-blue text-adwaita-blue'
								: 'border-transparent text-adwaita-subtitle hover:text-adwaita-text'}"
						>
							Markdown Editor
						</button>
						<button
							type="button"
							onclick={() => (activeTab = 'preview')}
							class="px-4 py-2 text-xs font-bold border-b-2 transition-colors {activeTab ===
							'preview'
								? 'border-adwaita-blue text-adwaita-blue'
								: 'border-transparent text-adwaita-subtitle hover:text-adwaita-text'}"
						>
							Live HTML Preview
						</button>
					</div>

					{#if activeTab === 'editor'}
						<textarea
							required
							bind:value={markdownContent}
							class="w-full flex-1 p-5 text-sm font-mono bg-adwaita-bg text-adwaita-text focus:outline-none resize-y min-h-87.5 leading-relaxed"
						></textarea>
					{:else}
						<div class="prose-custom p-6 w-full overflow-y-auto bg-adwaita-bg min-h-87.5">
							{#if previewHtml}
								{@html previewHtml}
							{:else}
								<p class="text-adwaita-subtitle italic">Nothing to preview...</p>
							{/if}
						</div>
					{/if}
				</div>

				<div class="flex justify-end gap-3 mt-4 mb-10">
					<a
						href="/admin"
						class="inline-flex h-10 items-center justify-center rounded-lg bg-adwaita-card border border-adwaita-border px-5 text-sm font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover focus:outline-none"
					>
						Cancel
					</a>
					<button
						type="submit"
						disabled={isSubmitting}
						class="inline-flex h-10 items-center justify-center gap-2 cursor-pointer rounded-lg bg-adwaita-blue px-6 text-sm font-semibold text-white transition-colors hover:bg-adwaita-blue-hover focus:outline-none disabled:opacity-55"
					>
						{#if isSubmitting}
							<i class="bi bi-hourglass-split text-xs animate-spin" aria-hidden="true"></i>
							Saving...
						{:else}
							<i class="bi bi-check-lg text-sm" aria-hidden="true"></i>
							{isEditMode ? 'Save Changes' : 'Save Blog Post'}
						{/if}
					</button>
				</div>
			</form>
		</section>
	{/if}
</main>

