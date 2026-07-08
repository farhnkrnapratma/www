<script lang="ts">
	import { onMount } from 'svelte';
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

	interface ThreadedComment extends BlogComment {
		children: ThreadedComment[];
		depth: number;
	}

	let comments = $state<BlogComment[]>([]);
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

	$effect(() => {
		comments = [...data.comments];
	});

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
			attributeFilter: ['class']
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
	let commentsExpanded = $state(false);
	const commentTree = $derived(buildCommentTree(comments));

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function buildCommentTree(items: BlogComment[]) {
		const nodes = new Map<string, ThreadedComment>();
		const roots: ThreadedComment[] = [];

		for (const comment of items) {
			nodes.set(comment.id, { ...comment, children: [], depth: 0 });
		}

		for (const comment of [...nodes.values()].sort(
			(a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
		)) {
			if (comment.parent_id && nodes.has(comment.parent_id)) {
				nodes.get(comment.parent_id)?.children.push(comment);
			} else if (!comment.parent_id) {
				roots.push(comment);
			}
		}

		return roots;
	}

	function getCommentAuthor(comment: BlogComment) {
		return comment.is_anonymous ? 'Anonymous User' : comment.author_name;
	}

	function getCommentIcon(comment: BlogComment) {
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
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					postId: post.id,
					parentId,
					authorName: authorName.trim(),
					isAnonymous,
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
					text: parentId ? 'Your reply has been posted.' : 'Your comment has been posted.'
				};
				commentContent = '';
				replyTo = null;
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

<svelte:head>
	{#if isDark}
		<link
			rel="stylesheet"
			href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css"
		/>
	{:else}
		<link
			rel="stylesheet"
			href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css"
		/>
	{/if}
</svelte:head>

<nav
	class="fixed top-0 z-40 flex h-15 w-full items-center justify-between bg-adwaita-card/60 backdrop-blur-lg px-5 font-sans border-b border-adwaita-border shadow-xs transition-colors duration-300"
>
	<a
		href="/#blogs"
		class="inline-flex h-9 items-center justify-center rounded-lg border border-adwaita-border bg-adwaita-card px-4 text-xs font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover focus:outline-none"
	>
		<i class="bi bi-arrow-left mr-2" aria-hidden="true"></i>
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
	<article
		class="mx-auto w-full md:w-[70%] lg:w-[45%] md:max-w-none px-6 pt-10 pb-16 md:pt-14 md:pb-28 flex-1"
	>
		<header class="mb-8 border-b border-adwaita-border pb-6">
			<p class="text-xs font-semibold mb-2 text-adwaita-subtitle">{formatDate(post.created_at)}</p>
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
			<div class="flex items-center justify-between mb-8">
				<h2 class="text-xl font-bold text-adwaita-text tracking-tight">
					Comments ({comments.length})
				</h2>
				<button
					type="button"
					onclick={() => (commentsExpanded = !commentsExpanded)}
					class="inline-flex h-9 items-center justify-center cursor-pointer rounded-lg border border-adwaita-border bg-adwaita-card px-4 text-xs font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover focus:outline-none"
				>
					{commentsExpanded ? 'Hide Comments' : 'Show Comments'}
				</button>
			</div>

			{#if commentsExpanded}
				{#if feedbackMessage}
					<div
						class="mb-6 rounded-lg p-3 text-sm font-semibold {feedbackMessage.type === 'success'
							? 'bg-palette-green/10 text-palette-green border border-palette-green/30'
							: 'bg-palette-coral/10 text-palette-coral border border-palette-coral/30'}"
					>
						{feedbackMessage.text}
					</div>
				{/if}

				{#if !replyTo}
					<div class="boxed-list p-5 mb-8 text-left bg-zinc-950/1">
						<h3 class="text-sm font-bold text-adwaita-text mb-4">Leave a Comment</h3>

						<form onsubmit={(e) => handleSubmit(e)} class="flex flex-col gap-4">
							<label class="flex items-center gap-2 text-xs font-bold text-adwaita-subtitle">
								<input
									type="checkbox"
									bind:checked={isAnonymous}
									class="h-4 w-4 rounded border-adwaita-border text-adwaita-blue focus:ring-adwaita-blue"
								/>
								Comment anonymously
							</label>
							<div class="flex flex-col sm:flex-row sm:items-center gap-2">
								<label
									for="comment-author"
									class="text-xs font-bold text-adwaita-subtitle w-20 shrink-0">Name</label
								>
								<input
									type="text"
									id="comment-author"
									required={!isAnonymous}
									disabled={isAnonymous}
									placeholder={isAnonymous ? 'Anonymous User' : 'Linus Torvalds'}
									bind:value={authorName}
									class="w-full px-3 py-1.5 text-sm bg-adwaita-bg border border-adwaita-border rounded-lg text-adwaita-text placeholder:text-adwaita-subtitle/70 focus:outline-none focus:border-adwaita-blue transition-colors disabled:opacity-60"
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
									class="inline-flex cursor-pointer items-center justify-center rounded-lg bg-adwaita-blue px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-adwaita-blue-hover focus:outline-none disabled:cursor-not-allowed disabled:opacity-55"
								>
									{isSubmitting ? 'Validating...' : 'Post Comment'}
								</button>
							</div>
						</form>
					</div>
				{/if}

				{#if comments.length === 0}
					<div class="boxed-list p-6 text-center text-adwaita-subtitle">No comments yet.</div>
				{:else}
					{#snippet renderComment(comment: ThreadedComment)}
						<div class="relative">
							<!-- Box container for the comment -->
							<div class="rounded-xl border border-adwaita-border bg-adwaita-card/60 p-5 shadow-xs hover:bg-adwaita-hover/5 transition-colors text-left">
								<div class="flex items-center justify-between gap-4 mb-2">
									<h4 class="inline-flex min-w-0 items-center gap-1.5 text-sm font-bold text-adwaita-text">
										<span class="material-symbols-rounded text-base text-adwaita-subtitle" aria-hidden="true">
											{getCommentIcon(comment)}
										</span>
										<span class="truncate">{getCommentAuthor(comment)}</span>
									</h4>
									<span class="text-[10px] font-semibold text-adwaita-subtitle">
										{formatDate(comment.created_at)}
									</span>
								</div>
								
								<p class="text-sm leading-relaxed text-adwaita-text/90 whitespace-pre-line">{comment.content}</p>
								
								<div class="mt-3 flex justify-end">
									<button
										type="button"
										onclick={() => {
											replyTo = comment;
											feedbackMessage = null;
											commentContent = '';
										}}
										class="inline-flex h-8 items-center justify-center cursor-pointer rounded-lg border border-adwaita-border bg-adwaita-card px-3 text-xs font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover"
									>
										Reply
									</button>
								</div>

								{#if replyTo?.id === comment.id}
									<form
										onsubmit={(e) => handleSubmit(e, comment.id)}
										class="mt-4 rounded-lg border border-adwaita-border bg-adwaita-bg/60 p-4"
									>
										<div class="mb-3 flex items-center justify-between gap-3">
											<p class="text-xs font-semibold text-adwaita-subtitle">
												Replying to {getCommentAuthor(comment)}
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
												<label
													for="reply-author-{comment.id}"
													class="text-xs font-bold text-adwaita-subtitle w-20 shrink-0">Name</label
												>
												<input
													type="text"
													id="reply-author-{comment.id}"
													required={!isAnonymous}
													disabled={isAnonymous}
													placeholder={isAnonymous ? 'Anonymous User' : 'Linus Torvalds'}
													bind:value={authorName}
													class="w-full px-3 py-1.5 text-sm bg-adwaita-bg border border-adwaita-border rounded-lg text-adwaita-text placeholder:text-adwaita-subtitle/70 focus:outline-none focus:border-adwaita-blue transition-colors disabled:opacity-60"
												/>
											</div>
											<div class="flex flex-col items-start gap-2">
												<label
													for="reply-msg-{comment.id}"
													class="text-xs font-bold text-adwaita-subtitle w-20 shrink-0 mt-1"
													>Message</label
												>
												<textarea
													id="reply-msg-{comment.id}"
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

							<!-- Replies connection tree/graph -->
							{#if comment.children && comment.children.length > 0}
								<div class="relative pl-6 md:pl-10 mt-2">
									<!-- Vertical connecting line -->
									<div class="absolute left-3 md:left-5 top-0 bottom-[30px] w-[2px] bg-adwaita-blue/50"></div>

									{#each comment.children as child (child.id)}
										<div class="relative mt-4">
											<!-- Horizontal connecting line -->
											<div class="absolute -left-3 md:-left-5 top-[30px] w-3 md:w-5 h-[2px] bg-adwaita-blue/50"></div>
											{@render renderComment(child)}
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{/snippet}

					<div class="flex flex-col gap-6">
						{#each commentTree as rootComment (rootComment.id)}
							{@render renderComment(rootComment)}
						{/each}
					</div>
				{/if}
			{/if}
		</section>
	</article>
</main>
