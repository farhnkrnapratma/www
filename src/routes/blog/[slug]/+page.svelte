<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const post = $derived(data.post);
	const html = $derived(data.html);

	let comments = $state<any[]>([]);

	$effect(() => {
		comments = [...data.comments];
	});

	let authorName = $state('');
	let commentContent = $state('');
	let isSubmitting = $state(false);
	let feedbackMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!authorName.trim() || !commentContent.trim()) return;

		isSubmitting = true;
		feedbackMessage = null;

		try {
			const res = await fetch('/api/comments', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					postId: post.id,
					authorName: authorName.trim(),
					content: commentContent.trim()
				})
			});

			const result = await res.json();

			if (!res.ok) {
				throw new Error(result.message || 'Failed to submit comment');
			}

			if (result.is_approved) {
				comments = [...comments, result.comment];
				feedbackMessage = {
					type: 'success',
					text: 'Your comment has been posted successfully!'
				};
				commentContent = '';
			} else {
				feedbackMessage = {
					type: 'error',
					text: 'Your comment was blocked by AI content moderation (flagged as inappropriate).'
				};
			}
		} catch (err: any) {
			feedbackMessage = {
				type: 'error',
				text: err.message || 'An error occurred while posting your comment.'
			};
		} finally {
			isSubmitting = false;
		}
	}
</script>

<nav
	class="fixed top-0 z-40 flex h-15 w-full items-center justify-between bg-adwaita-card px-5 font-sans border-b border-adwaita-border shadow-xs transition-colors duration-300"
>
	<a
		href="/#blogs"
		class="inline-flex h-9 items-center justify-center rounded-lg bg-adwaita-card border border-adwaita-border px-4 text-sm font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover"
	>
		<i class="bi bi-arrow-left" style="margin-right: 8px;" aria-hidden="true"></i>
		Back to Blog
	</a>
	<div class="flex items-center gap-3">
		<span class="text-sm font-bold text-adwaita-subtitle">Read Post</span>
	</div>
</nav>

<main class="pt-15 font-sans flex flex-col min-h-[calc(100vh-3.75rem)]">
	<article class="mx-auto w-full max-w-3xl px-6 py-12 md:py-20 flex-1">
		<header class="mb-8 border-b border-adwaita-border pb-6">
			<p class="text-xs font-semibold text-adwaita-subtitle mb-2">{formatDate(post.created_at)}</p>
			<h1
				class="text-3xl font-extrabold text-adwaita-text md:text-4xl tracking-tight leading-tight"
			>
				{post.title}
			</h1>
		</header>

		<div class="prose-custom w-full">
			{@html html}
		</div>

		<section class="mt-16 border-t border-adwaita-border pt-10">
			<h2 class="text-xl font-bold text-adwaita-text tracking-tight mb-6">Comments</h2>

			<div class="boxed-list p-5 mb-8 text-left bg-zinc-950/[0.01]">
				<h3 class="text-sm font-bold text-adwaita-text mb-4">Leave a Comment</h3>

				{#if feedbackMessage}
					<div
						class="p-3 mb-4 rounded-lg text-sm font-semibold {feedbackMessage.type === 'success'
							? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30'
							: 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30'}"
					>
						{feedbackMessage.text}
					</div>
				{/if}

				<form onsubmit={handleSubmit} class="flex flex-col gap-4">
					<div class="flex flex-col sm:flex-row sm:items-center gap-2">
						<label
							for="comment-author"
							class="text-xs font-bold text-adwaita-subtitle w-20 shrink-0">Name</label
						>
						<input
							type="text"
							id="comment-author"
							required
							placeholder="Linus Torvalds"
							bind:value={authorName}
							class="w-full px-3 py-1.5 text-sm bg-adwaita-bg border border-adwaita-border rounded-lg text-adwaita-text placeholder:text-adwaita-subtitle/70 focus:outline-none focus:border-adwaita-blue transition-colors"
						/>
					</div>
					<div class="flex flex-col items-start gap-2">
						<label
							for="comment-msg"
							class="text-xs font-bold text-adwaita-subtitle w-20 shrink-0 mt-1">Message</label
						>
						<textarea
							id="comment-msg"
							required
							rows="3"
							placeholder="Write your comment here..."
							bind:value={commentContent}
							class="w-full px-3 py-1.5 text-sm bg-adwaita-bg border border-adwaita-border rounded-lg text-adwaita-text placeholder:text-adwaita-subtitle/70 focus:outline-none focus:border-adwaita-blue transition-colors resize-none"
						></textarea>
					</div>
					<div class="flex justify-end mt-2">
						<button
							type="submit"
							disabled={isSubmitting}
							class="inline-flex items-center justify-center gap-2 cursor-pointer rounded-lg bg-adwaita-blue px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#009c8f] focus:outline-none disabled:opacity-55 disabled:cursor-not-allowed"
						>
							{#if isSubmitting}
								<i class="bi bi-hourglass-split text-xs animate-spin" aria-hidden="true"></i>
								Validating...
							{:else}
								<i class="bi bi-chat-left-text-fill text-xs" aria-hidden="true"></i>
								Post Comment
							{/if}
						</button>
					</div>
				</form>
			</div>

			{#if comments.length === 0}
				<div class="boxed-list p-6 text-center text-adwaita-subtitle">
					No comments yet. Be the first to share your thoughts!
				</div>
			{:else}
				<div class="boxed-list text-left">
					{#each comments as comment (comment.id)}
						<div class="px-5 py-4 border-b border-adwaita-border/40 last:border-b-0">
							<div class="flex items-center justify-between gap-4 mb-1">
								<h4 class="text-sm font-bold text-adwaita-text">{comment.author_name}</h4>
								<span class="text-[10px] font-semibold text-adwaita-subtitle">
									{formatDate(comment.created_at)}
								</span>
							</div>
							<p class="text-sm text-adwaita-subtitle leading-relaxed">{comment.content}</p>
						</div>
					{/each}
				</div>
			{/if}
		</section>
	</article>
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
