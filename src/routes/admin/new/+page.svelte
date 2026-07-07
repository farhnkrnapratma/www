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
		isCheckingAuth = false;
	});

	$effect(() => {
		if (title) {
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

			window.location.href = '/admin';
		} catch (err: any) {
			console.error('Error creating post:', err);
			errorMessage = err.message || 'Failed to save blog post.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<nav
	class="fixed top-0 z-40 flex h-15 w-full items-center justify-between bg-adwaita-card px-5 font-sans border-b border-adwaita-border shadow-xs transition-colors duration-300"
>
	<a
		href="/admin"
		class="inline-flex h-9 items-center justify-center rounded-lg bg-adwaita-card border border-adwaita-border px-4 text-sm font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover"
	>
		<i class="bi bi-arrow-left" style="margin-right: 8px;" aria-hidden="true"></i>
		Cancel
	</a>

	<div class="flex items-center gap-3">
		<span class="text-sm font-bold text-adwaita-subtitle">Write New Post</span>

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
					class="p-3 mb-6 rounded-lg text-sm font-semibold bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30"
				>
					{errorMessage}
				</div>
			{/if}

			<form onsubmit={handleSubmit} class="flex flex-col gap-6">
				<div class="boxed-list p-5 text-left bg-zinc-950/[0.01]">
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

				<div class="boxed-list overflow-hidden text-left flex flex-col min-h-[400px]">
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
							class="w-full flex-1 p-5 text-sm font-mono bg-adwaita-bg text-adwaita-text focus:outline-none resize-y min-h-[350px] leading-relaxed"
						></textarea>
					{:else}
						<div class="prose-custom p-6 w-full overflow-y-auto bg-adwaita-bg min-h-[350px]">
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
						class="inline-flex h-10 items-center justify-center gap-2 cursor-pointer rounded-lg bg-adwaita-blue px-6 text-sm font-semibold text-white transition-colors hover:bg-[#009c8f] focus:outline-none disabled:opacity-55"
					>
						{#if isSubmitting}
							<i class="bi bi-hourglass-split text-xs animate-spin" aria-hidden="true"></i>
							Saving...
						{:else}
							<i class="bi bi-check-lg text-sm" aria-hidden="true"></i>
							Save Blog Post
						{/if}
					</button>
				</div>
			</form>
		</section>
	{/if}
</main>

<style>
	:global(.prose-custom) {
		color: var(--color-adwaita-text);
		line-height: 1.7;
	}
	:global(.prose-custom p) {
		margin-top: 1.25rem;
		margin-bottom: 1.25rem;
	}
	:global(.prose-custom h1) {
		font-size: 1.875rem;
		font-weight: 800;
		margin-top: 2rem;
		margin-bottom: 1rem;
		color: var(--color-adwaita-text);
	}
	:global(.prose-custom h2) {
		font-size: 1.5rem;
		font-weight: 700;
		margin-top: 1.75rem;
		margin-bottom: 0.75rem;
		color: var(--color-adwaita-text);
	}
	:global(.prose-custom h3) {
		font-size: 1.25rem;
		font-weight: 600;
		margin-top: 1.5rem;
		margin-bottom: 0.5rem;
		color: var(--color-adwaita-text);
	}
	:global(.prose-custom ul) {
		margin-top: 1rem;
		margin-bottom: 1rem;
		padding-left: 1.5rem;
		list-style-type: disc;
	}
	:global(.prose-custom ol) {
		margin-top: 1rem;
		margin-bottom: 1rem;
		padding-left: 1.5rem;
		list-style-type: decimal;
	}
	:global(.prose-custom li) {
		margin-top: 0.25rem;
		margin-bottom: 0.25rem;
	}
	:global(.prose-custom pre) {
		background-color: var(--color-adwaita-hover);
		border: 1px solid var(--color-adwaita-border);
		padding: 1rem;
		border-radius: 0.5rem;
		overflow-x: auto;
		margin-top: 1.5rem;
		margin-bottom: 1.5rem;
	}
	:global(.prose-custom code) {
		font-family: monospace;
		font-size: 0.875rem;
		background-color: var(--color-adwaita-hover);
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
	}
	:global(.prose-custom pre code) {
		background-color: transparent;
		padding: 0;
	}
	:global(.prose-custom a) {
		color: var(--color-adwaita-blue);
		text-decoration: underline;
	}
</style>
