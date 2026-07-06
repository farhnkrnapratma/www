<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const posts = $derived(data.posts);

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<div
	class="fixed top-0 left-0 z-50 flex h-8 w-full items-center justify-center border-b border-amber-200 bg-amber-100/75 text-xs font-bold text-amber-800 backdrop-blur-md transition-colors duration-300 dark:border-amber-900/30 dark:bg-amber-950/45 dark:text-amber-300 select-none"
>
	<i class="bi bi-exclamation-triangle-fill" style="margin-right: 6px;" aria-hidden="true"></i>
	Development Preview
</div>

<nav
	class="fixed top-8 z-40 flex h-15 w-full items-center justify-between bg-adwaita-card px-5 font-sans border-b border-adwaita-border shadow-xs transition-colors duration-300"
>
	<a
		href="/"
		class="inline-flex h-9 items-center justify-center rounded-lg bg-adwaita-card border border-adwaita-border px-4 text-sm font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover"
	>
		<i class="bi bi-arrow-left" style="margin-right: 8px;" aria-hidden="true"></i>
		Back to Home
	</a>
	<div class="flex items-center gap-3">
		<span class="text-sm font-bold text-adwaita-subtitle">Blog Posts</span>
	</div>
</nav>

<main class="pt-[92px] font-sans flex flex-col min-h-[calc(100vh-5.75rem)]">
	<section class="mx-auto w-full max-w-3xl px-6 py-12 md:py-20 flex-1">
		<h1 class="text-3xl font-bold text-adwaita-text tracking-tight">Blog</h1>
		<p class="mt-2 text-sm text-adwaita-subtitle">
			Thoughts on Linux, Unix, cybersecurity, and FOSS.
		</p>

		<div class="mt-10">
			{#if posts.length === 0}
				<div class="boxed-list p-8 text-center text-adwaita-subtitle">
					<i class="bi bi-journal-x text-3xl block mb-2 opacity-60" aria-hidden="true"></i>
					No published posts found. Please write some in the CMS dashboard.
				</div>
			{:else}
				<div class="boxed-list text-left">
					{#each posts as post (post.id)}
						<a
							href="/blog/{post.slug}"
							class="action-row w-full text-left group cursor-pointer flex items-center justify-between"
						>
							<div class="flex flex-col gap-1 pr-6">
								<p class="text-xs font-semibold text-adwaita-subtitle">
									{formatDate(post.created_at)}
								</p>
								<h2
									class="text-base font-bold text-adwaita-text group-hover:text-adwaita-blue transition-colors leading-tight"
								>
									{post.title}
								</h2>
								{#if post.excerpt}
									<p class="mt-1.5 text-sm text-adwaita-subtitle line-clamp-2">{post.excerpt}</p>
								{/if}
							</div>
							<i
								class="bi bi-chevron-right text-sm text-zinc-400 group-hover:text-adwaita-blue transition-all group-hover:translate-x-0.5"
								aria-hidden="true"
							></i>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</section>
</main>
