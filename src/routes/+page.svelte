<script lang="ts">
	import LinkListSection from '$lib/LinkListSection.svelte';
	import type { Project } from './+page.server';

	let { data } = $props();

	type Section = 'home' | 'blogs' | 'contacts' | 'cv' | 'projects' | 'funding';

	interface NavItem {
		id: Section;
		label: string;
	}

	interface Post {
		title: string;
		date: string;
		excerpt: string;
	}

	interface Contact {
		label: string;
		value: string;
		shortValue?: string;
		href: string;
		icon: string;
	}

	interface Experience {
		role: string;
		company: string;
		period: string;
		desc: string;
	}

	interface Education {
		degree: string;
		major: string;
		faculty: string;
		university: string;
		period: string;
	}

	const name = 'Farhan Kurnia Pratama';
	const username = 'farhnkrnapratma';
	const desc =
		'Security-focused Software Engineer with expertise in Linux/Unix and FOSS, dedicated to building reliable, maintainable, and privacy-centric systems.';
	const headline = 'Linux/Unix, FOSS, and Cybersecurity';
	const siteUrl = 'https://fkp.my.id/';

	const navItems: NavItem[] = [
		{ id: 'home', label: 'Home' },
		{ id: 'blogs', label: 'Blogs' },
		{ id: 'contacts', label: 'Contacts' },
		{ id: 'cv', label: 'Curriculum Vitae' },
		{ id: 'projects', label: 'Projects' },
		{ id: 'funding', label: 'Funding' }
	];

	const posts: Post[] = [
		{
			title: 'Hardening Linux with SELinux and AppArmor',
			date: 'June 12, 2025',
			excerpt:
				'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.'
		},
		{
			title: 'Why I Switched My Entire Workflow to FOSS',
			date: 'May 3, 2025',
			excerpt:
				'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante.'
		},
		{
			title: 'Understanding LUKS Full-Disk Encryption',
			date: 'March 28, 2025',
			excerpt:
				'Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper pharetra.'
		}
	];

	const contacts: Contact[] = [
		{
			label: 'Email',
			value: 'contact@fkp.my.id',
			href: 'mailto:contact@fkp.my.id',
			icon: 'bi-envelope'
		},
		{
			label: 'GitHub',
			value: 'github.com/farhnkrnapratma',
			shortValue: '@farhnkrnapratma',
			href: 'https://github.com/farhnkrnapratma',
			icon: 'bi-github'
		},
		{
			label: 'LinkedIn',
			value: 'linkedin.com/in/farhnkrnapratma',
			shortValue: '@farhnkrnapratma',
			href: 'https://linkedin.com/in/farhnkrnapratma',
			icon: 'bi-linkedin'
		},
		{
			label: 'YouTube',
			value: 'youtube.com/@farhnkrnapratma',
			shortValue: '@farhnkrnapratma',
			href: 'https://youtube.com/@farhnkrnapratma',
			icon: 'bi-youtube'
		}
	];

	const experiences: Experience[] = [
		{
			role: 'Software Engineer',
			company: 'Lorem Ipsum Corp',
			period: '2024 – Present',
			desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.'
		}
	];

	const education: Education[] = [
		{
			degree: "Bachelor's (S1)",
			major: 'Informatics Engineering',
			faculty: 'Faculty of Computer Science and Sciences',
			university: 'Universitas Indo Global Mandiri',
			period: '2024 – Present'
		}
	];

	const skills: string[] = ['Linux', 'Rust', 'Python', 'Networking', 'Cybersecurity', 'Git', 'AI'];

	interface FundingPlatform {
		label: string;
		value: string;
		shortValue?: string;
		href: string;
		icon: string;
		color: string;
	}

	const fundingPlatforms: FundingPlatform[] = [
		{
			label: 'GitHub Sponsors',
			value: 'github.com/sponsors/farhnkrnapratma',
			shortValue: '@farhnkrnapratma',
			href: 'https://github.com/sponsors/farhnkrnapratma',
			icon: 'bi-heart-fill',
			color: 'text-rose-500'
		},
		{
			label: 'Ko-fi',
			value: 'ko-fi.com/farhnkrnapratma',
			shortValue: '@farhnkrnapratma',
			href: 'https://ko-fi.com/farhnkrnapratma',
			icon: 'bi-cup-hot-fill',
			color: 'text-amber-500'
		},
		{
			label: 'Open Collective',
			value: 'opencollective.com/farhnkrnapratma',
			shortValue: '@farhnkrnapratma',
			href: 'https://opencollective.com/farhnkrnapratma',
			icon: 'bi-people-fill',
			color: 'text-blue-500'
		}
	];

	const langColors: Record<string, string> = {
		Nix: 'bg-blue-100 text-blue-700',
		Rust: 'bg-orange-100 text-orange-700',
		Svelte: 'bg-red-100 text-red-700',
		Go: 'bg-sky-100 text-sky-700',
		Python: 'bg-yellow-100 text-yellow-700',
		TypeScript: 'bg-indigo-100 text-indigo-700',
		Shell: 'bg-emerald-100 text-emerald-700',
		JavaScript: 'bg-amber-100 text-amber-700',
		CSS: 'bg-purple-100 text-purple-700',
		HTML: 'bg-pink-100 text-pink-700'
	};

	const projects = $derived(data.projects);

	type Theme = 'auto' | 'dark' | 'light';

	let activeSection = $state<Section>('home');
	let menuOpen = $state(false);
	let theme = $state<Theme>('auto');
	let themeDropdownOpen = $state(false);

	function navigate(section: Section) {
		activeSection = section;
		menuOpen = false;
	}

	import { onMount } from 'svelte';

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

	onMount(() => {
		const saved = localStorage.getItem('theme') as Theme;
		applyTheme(saved || 'auto');

		const media = window.matchMedia('(prefers-color-scheme: dark)');
		const listener = () => {
			if (theme === 'auto') {
				applyTheme('auto');
			}
		};
		media.addEventListener('change', listener);
		return () => media.removeEventListener('change', listener);
	});
</script>

<svelte:head>
	<title>{name} — {headline}</title>
	<meta name="description" content={desc} />
	<meta name="robots" content="noindex, nofollow" />
	<link rel="canonical" href={siteUrl} />
	<meta property="og:title" content="{name} — {headline}" />
	<meta property="og:description" content={desc} />
	<meta property="og:type" content="profile" />
	<meta property="og:url" content={siteUrl} />
	<meta property="og:site_name" content={name} />
	<meta property="og:image" content="{siteUrl}hero.png" />
	<meta property="og:image:secure_url" content="{siteUrl}hero.png" />
	<meta property="og:image:type" content="image/png" />
	<meta property="og:image:width" content="1280" />
	<meta property="og:image:height" content="640" />
	<meta property="og:image:alt" content="{name} — {desc}" />
	<meta property="og:locale" content="en_US" />
	<meta property="og:locale:alternate" content="id_ID" />
	<meta property="profile:first_name" content="Farhan Kurnia" />
	<meta property="profile:last_name" content="Pratama" />
	<meta property="profile:username" content={username} />
	<meta property="profile:gender" content="male" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="{name} — {headline}" />
	<meta name="twitter:description" content={desc} />
	<meta name="twitter:image" content="{siteUrl}hero.png" />
	<link
		rel="alternate"
		type="application/rss+xml"
		title="{name} — {headline}"
		href="{siteUrl}/blog/rss.xml"
	/>
</svelte:head>

{#if menuOpen}
	<button
		class="fixed inset-0 z-30 bg-zinc-950/20 backdrop-blur-xs md:hidden"
		onclick={() => (menuOpen = false)}
		aria-label="Close menu"
	></button>
{/if}

<div
	class="fixed top-0 left-0 z-50 flex h-8 w-full items-center justify-center border-b border-amber-200 bg-amber-100/75 text-xs font-bold text-amber-800 backdrop-blur-md transition-colors duration-300 dark:border-amber-900/30 dark:bg-amber-950/45 dark:text-amber-300 select-none"
>
	<i class="bi bi-exclamation-triangle-fill" style="margin-right: 6px;" aria-hidden="true"></i>
	Development Preview
</div>

<nav
	class="fixed top-8 z-40 flex h-15 w-full items-center justify-between bg-adwaita-card px-5 font-sans border-b border-adwaita-border shadow-xs transition-colors duration-300"
>
	<button
		onclick={() => navigate('home')}
		class="cursor-pointer text-base font-bold text-adwaita-text tracking-tight hover:text-adwaita-blue transition-colors"
	>
		{name}
	</button>

	<div class="flex items-center gap-3">
		<ul
			id="mobile-menu"
			class="fixed right-0 top-0 z-40 flex h-full w-64 flex-col items-start gap-1 bg-adwaita-card px-4 pt-4 shadow-xl border-l border-adwaita-border transition-transform duration-300 ease-in-out md:static md:h-auto md:w-auto md:translate-x-0 md:flex-row md:items-center md:bg-adwaita-switcher-bg md:p-1 md:rounded-lg md:border md:border-adwaita-border md:gap-0.5 md:shadow-none"
			class:translate-x-full={!menuOpen}
			class:translate-x-0={menuOpen}
		>
			<li class="mb-2 flex w-full items-center justify-end md:hidden">
				<button
					onclick={() => (menuOpen = false)}
					aria-label="Close menu"
					class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-xl transition-colors hover:bg-adwaita-hover"
				>
					<i class="bi bi-x-lg text-adwaita-text" aria-hidden="true"></i>
				</button>
			</li>

			{#each navItems as item (item.id)}
				<li class="w-full md:w-auto">
					<button
						onclick={() => navigate(item.id)}
						class="flex w-full cursor-pointer whitespace-nowrap items-center justify-start md:justify-center rounded-lg border-0 px-4 h-11 text-sm font-medium leading-none outline-none focus:outline-none active:outline-none transition-all md:rounded-md md:px-3.5 md:h-7.5 {activeSection ===
						item.id
							? 'bg-adwaita-blue text-white hover:bg-adwaita-blue/90 md:bg-adwaita-switcher-active md:text-adwaita-blue md:shadow-xs md:hover:bg-adwaita-switcher-active font-semibold'
							: 'text-adwaita-text hover:bg-adwaita-hover md:text-adwaita-subtitle md:hover:text-adwaita-text md:hover:bg-adwaita-hover'}"
					>
						{item.label}
					</button>
				</li>
			{/each}
		</ul>

		<div class="relative">
			<button
				onclick={() => (themeDropdownOpen = !themeDropdownOpen)}
				class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-lg text-adwaita-text transition-colors hover:bg-adwaita-hover focus:outline-none"
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
					class="absolute right-0 top-12 z-50 flex min-w-[125px] flex-col rounded-xl border border-adwaita-border bg-adwaita-card py-1.5 shadow-lg"
				>
					<button
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
			class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-xl transition-colors hover:bg-adwaita-hover md:hidden"
			onclick={() => (menuOpen = !menuOpen)}
			aria-label={menuOpen ? 'Close menu' : 'Open menu'}
			aria-expanded={menuOpen}
			aria-controls="mobile-menu"
		>
			<i class="bi {menuOpen ? 'bi-x-lg' : 'bi-list'} text-adwaita-text" aria-hidden="true"></i>
		</button>
	</div>
</nav>

<main class="pt-[92px] font-sans flex flex-col min-h-[calc(100vh-5.75rem)]">
	{#if activeSection === 'home'}
		<section class="mx-auto max-w-3xl px-6 py-12 md:py-20 flex flex-col gap-12">
			<div class="flex flex-col items-center justify-center text-center">
				<img
					src="/android-chrome-512x512.png"
					alt="Farhan Kurnia Pratama"
					class="mb-6 h-28 w-28 rounded-full object-cover object-top border border-adwaita-border shadow-xs"
				/>
				<h1 class="text-4xl font-bold text-adwaita-text md:text-5xl lg:text-6xl tracking-tight">
					{name}
				</h1>
				<p class="mt-3 text-lg font-medium text-adwaita-subtitle">{headline}</p>
				<p class="mt-4 max-w-xl text-base text-adwaita-subtitle/90 leading-relaxed">{desc}</p>
				<div class="mt-8 flex flex-wrap justify-center gap-3">
					<a
						href="/cv.pdf"
						download="Farhan_Kurnia_Pratama_CV.pdf"
						class="inline-flex items-center justify-center gap-2 cursor-pointer rounded-lg bg-adwaita-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#009c8f] focus:outline-none"
					>
						<i class="bi bi-download" aria-hidden="true"></i>
						Download CV
					</a>
					<button
						onclick={() => navigate('projects')}
						class="cursor-pointer rounded-lg bg-adwaita-card border border-adwaita-border px-5 py-2.5 text-sm font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover focus:outline-none"
					>
						Projects
					</button>
					<button
						onclick={() => navigate('contacts')}
						class="cursor-pointer rounded-lg bg-adwaita-card border border-adwaita-border px-5 py-2.5 text-sm font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover focus:outline-none"
					>
						Get in Touch
					</button>
				</div>
			</div>

			<form
				action="https://formsubmit.co/contact@fkp.my.id"
				method="POST"
				class="w-full boxed-list text-left shadow-xs"
			>
				<input type="hidden" name="_subject" value="New message from portfolio website!" />
				<input type="hidden" name="_template" value="table" />
				<input type="hidden" name="_captcha" value="true" />

				<div class="px-5 py-4 border-b border-adwaita-border">
					<h2 class="text-lg font-bold text-adwaita-text">Send a Message</h2>
					<p class="text-xs text-adwaita-subtitle mt-0.5">
						Feel free to drop me a line. I'll get back to you as soon as possible.
					</p>
				</div>

				<div
					class="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4"
				>
					<label for="form-name" class="text-sm font-semibold text-adwaita-text sm:w-1/4 shrink-0"
						>Name</label
					>
					<input
						type="text"
						id="form-name"
						name="name"
						required
						placeholder="Linus Torvalds"
						class="w-full sm:w-3/4 px-3 py-1.5 text-sm bg-adwaita-bg border border-adwaita-border rounded-lg text-adwaita-text placeholder:text-adwaita-subtitle/70 focus:outline-none focus:border-adwaita-blue transition-colors"
					/>
				</div>

				<div
					class="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4"
				>
					<label for="form-email" class="text-sm font-semibold text-adwaita-text sm:w-1/4 shrink-0"
						>Email Address</label
					>
					<input
						type="email"
						id="form-email"
						name="email"
						required
						placeholder="torvalds@linux-foundation.org"
						class="w-full sm:w-3/4 px-3 py-1.5 text-sm bg-adwaita-bg border border-adwaita-border rounded-lg text-adwaita-text placeholder:text-adwaita-subtitle/70 focus:outline-none focus:border-adwaita-blue transition-colors"
					/>
				</div>

				<div
					class="px-5 py-3.5 flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-4"
				>
					<label
						for="form-message"
						class="text-sm font-semibold text-adwaita-text sm:w-1/4 shrink-0 mt-1.5">Message</label
					>
					<textarea
						id="form-message"
						name="message"
						required
						rows="3"
						placeholder="Write your message here..."
						class="w-full sm:w-3/4 px-3 py-1.5 text-sm bg-adwaita-bg border border-adwaita-border rounded-lg text-adwaita-text placeholder:text-adwaita-subtitle/70 focus:outline-none focus:border-adwaita-blue transition-colors resize-none"
					></textarea>
				</div>

				<div class="px-5 py-3.5 flex items-center justify-end bg-adwaita-hover/30">
					<button
						type="submit"
						class="inline-flex items-center justify-center gap-2 cursor-pointer rounded-lg bg-adwaita-blue px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#009c8f] focus:outline-none"
					>
						<i class="bi bi-send-fill text-xs" aria-hidden="true"></i>
						Send Message
					</button>
				</div>
			</form>

			<div>
				<h3 class="text-lg font-bold text-adwaita-text tracking-tight mb-4">Recent Blog Posts</h3>
				<div class="boxed-list text-left">
					{#each posts.slice(0, 2) as post (post.title)}
						<button
							onclick={() => navigate('blogs')}
							type="button"
							class="action-row w-full text-left group cursor-pointer"
						>
							<div class="flex flex-col gap-1 pr-6">
								<p class="text-xs font-semibold text-adwaita-subtitle">{post.date}</p>
								<h4
									class="text-base font-bold text-adwaita-text group-hover:text-adwaita-blue transition-colors leading-tight"
								>
									{post.title}
								</h4>
								<p class="mt-1.5 text-sm text-adwaita-subtitle line-clamp-2">{post.excerpt}</p>
							</div>
							<i
								class="bi bi-chevron-right text-sm text-zinc-400 group-hover:text-adwaita-blue transition-all group-hover:translate-x-0.5"
								aria-hidden="true"
							></i>
						</button>
					{/each}
					<button
						onclick={() => navigate('blogs')}
						class="action-row w-full text-left group cursor-pointer flex items-center justify-between"
					>
						<span class="text-sm font-bold text-adwaita-blue group-hover:underline"
							>Read more...</span
						>
						<i
							class="bi bi-chevron-right text-sm text-adwaita-blue group-hover:translate-x-0.5 transition-transform"
							aria-hidden="true"
						></i>
					</button>
				</div>
			</div>

			<div>
				<h3 class="text-lg font-bold text-adwaita-text tracking-tight mb-4">Top Projects</h3>
				<div class="boxed-list text-left">
					{#each projects.slice(0, 2) as project (project.name)}
						<a
							href={project.url}
							target="_blank"
							rel="noopener noreferrer"
							title="Opens in a new tab"
							class="action-row group flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
						>
							<div class="flex flex-col gap-1.5 pr-0 sm:pr-6">
								<div class="flex items-center gap-2">
									<h4
										class="text-base font-bold text-adwaita-text group-hover:text-adwaita-blue transition-colors leading-none"
									>
										{project.name}
									</h4>
									{#if langColors[project.lang]}
										<span
											class="inline-flex items-center justify-center rounded-full px-2 h-4.5 text-[9px] font-bold uppercase tracking-wider leading-none {langColors[
												project.lang
											]}">{project.lang}</span
										>
									{/if}
								</div>
								<p class="text-sm text-adwaita-subtitle leading-relaxed">{project.desc}</p>
								<div class="mt-1.5 flex flex-wrap items-center gap-1.5">
									{#each project.tags as tag (tag)}
										<span
											class="rounded bg-adwaita-border/40 px-2 py-0.5 text-[11px] font-medium text-adwaita-subtitle"
											>{tag}</span
										>
									{/each}
								</div>
							</div>
							<div
								class="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0 border-t border-adwaita-border/40 pt-3 sm:border-t-0 sm:pt-0"
							>
								<div class="flex items-center gap-1 text-xs font-semibold text-adwaita-subtitle">
									<i
										class="bi bi-star-fill text-amber-500"
										style="font-size:12px"
										aria-hidden="true"
									></i>
									{project.stars}
								</div>
								<i
									class="bi bi-chevron-right text-sm text-zinc-400 opacity-80 transition-all group-hover:translate-x-0.5 group-hover:text-adwaita-blue"
									aria-hidden="true"
								></i>
							</div>
						</a>
					{/each}
					<button
						onclick={() => navigate('projects')}
						class="action-row w-full text-left group cursor-pointer flex items-center justify-between"
					>
						<span class="text-sm font-bold text-adwaita-blue group-hover:underline"
							>View all projects...</span
						>
						<i
							class="bi bi-chevron-right text-sm text-adwaita-blue group-hover:translate-x-0.5 transition-transform"
							aria-hidden="true"
						></i>
					</button>
				</div>
			</div>

			<div class="boxed-list text-left border-adwaita-blue/30 bg-adwaita-blue/5">
				<div class="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div class="flex items-start gap-4">
						<i
							class="bi bi-heart-fill text-2xl text-adwaita-blue shrink-0 mt-0.5"
							aria-hidden="true"
						></i>
						<div>
							<h4 class="text-sm font-bold text-adwaita-text">Support My Open Source Work</h4>
							<p class="text-xs text-adwaita-subtitle mt-0.5 leading-relaxed">
								If you find my open-source projects and tools helpful, please consider supporting
								me. Your backing directly contributes to the development and maintenance of these
								works.
							</p>
						</div>
					</div>
					<button
						onclick={() => navigate('funding')}
						class="inline-flex items-center justify-center gap-2 cursor-pointer rounded-lg bg-adwaita-blue px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#009c8f] focus:outline-none shrink-0"
					>
						Become a Sponsor
						<i class="bi bi-arrow-right" aria-hidden="true"></i>
					</button>
				</div>
			</div>
		</section>
	{/if}

	{#if activeSection === 'blogs'}
		<section class="mx-auto max-w-3xl px-6 py-20">
			<h1 class="text-3xl font-bold text-adwaita-text tracking-tight">Blogs</h1>
			<p class="mt-2 text-sm text-adwaita-subtitle">
				Thoughts on Linux, security, and open source.
			</p>
			<div class="mt-10 boxed-list">
				{#each posts as post (post.title)}
					<article class="action-row group cursor-pointer">
						<div class="flex flex-col gap-1 pr-6">
							<p class="text-xs font-semibold text-adwaita-subtitle">{post.date}</p>
							<h2
								class="text-base font-bold text-adwaita-text group-hover:text-adwaita-blue transition-colors"
							>
								{post.title}
							</h2>
							<p class="mt-1.5 text-sm text-adwaita-subtitle line-clamp-2">{post.excerpt}</p>
						</div>
						<i
							class="bi bi-chevron-right text-sm text-zinc-400 group-hover:text-adwaita-blue transition-all group-hover:translate-x-0.5"
							aria-hidden="true"
						></i>
					</article>
				{/each}
			</div>
		</section>
	{/if}

	{#if activeSection === 'contacts'}
		<LinkListSection
			title="Contacts"
			subtitle="Feel free to reach out via any of the channels below."
			items={contacts}
		/>
	{/if}

	{#if activeSection === 'cv'}
		<section class="mx-auto max-w-3xl px-6 py-20">
			<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 class="text-3xl font-bold text-adwaita-text tracking-tight">Curriculum Vitae</h1>
					<p class="mt-2 text-sm text-adwaita-subtitle">Security-focused Software Engineer.</p>
				</div>
				<a
					href="/cv.pdf"
					download="Farhan_Kurnia_Pratama_CV.pdf"
					class="inline-flex items-center justify-center gap-2 rounded-lg bg-adwaita-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#009c8f] focus:outline-none"
				>
					<i class="bi bi-download" aria-hidden="true"></i>
					Download PDF
				</a>
			</div>

			<div class="mt-10">
				<h2 class="text-xs font-bold uppercase tracking-widest text-adwaita-subtitle">
					Experience
				</h2>
				<div class="mt-4 boxed-list">
					{#each experiences as exp (exp.role)}
						<div class="px-5 py-4 flex flex-col gap-1.5 hover:bg-zinc-950/[0.015] transition-all">
							<div class="flex items-start justify-between gap-4">
								<div>
									<h3 class="text-base font-bold text-adwaita-text">{exp.role}</h3>
									<p class="text-sm font-medium text-adwaita-subtitle">{exp.company}</p>
								</div>
								<p class="shrink-0 text-xs font-semibold text-adwaita-subtitle">{exp.period}</p>
							</div>
							<p class="mt-1.5 text-sm text-adwaita-subtitle leading-relaxed">{exp.desc}</p>
						</div>
					{/each}
				</div>
			</div>

			<div class="mt-10">
				<h2 class="text-xs font-bold uppercase tracking-widest text-adwaita-subtitle">Education</h2>
				<div class="mt-4 boxed-list">
					{#each education as edu (`${edu.degree}-${edu.university}`)}
						<div class="px-5 py-4 flex flex-col gap-1 hover:bg-zinc-950/1.5 transition-all">
							<div class="flex items-start justify-between gap-4">
								<div>
									<h3 class="text-base font-bold text-adwaita-text">{edu.degree} in {edu.major}</h3>
									<p class="text-sm text-adwaita-subtitle">{edu.faculty}</p>
									<p class="text-sm font-semibold text-adwaita-text mt-1">{edu.university}</p>
								</div>
								<p class="shrink-0 text-xs font-semibold text-adwaita-subtitle">{edu.period}</p>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<div class="mt-10">
				<h2 class="text-xs font-bold uppercase tracking-widest text-adwaita-subtitle">Skills</h2>
				<div class="mt-4 flex flex-wrap gap-2">
					{#each skills as skill (skill)}
						<span
							class="cursor-default rounded-full bg-adwaita-border/40 px-3.5 py-1.5 text-xs font-bold text-adwaita-text hover:bg-adwaita-border/60 transition-colors"
						>
							{skill}
						</span>
					{/each}
				</div>
			</div>

			<div class="mt-10">
				<h2 class="text-xs font-bold uppercase tracking-widest text-adwaita-subtitle">
					Design System
				</h2>
				<div class="mt-4 boxed-list">
					<div class="px-5 py-4 flex flex-col gap-3">
						<p class="text-sm text-adwaita-subtitle leading-relaxed">
							This website uses a custom analogous color palette with a modern, high-contrast
							primary accent based on the GNOME Human Interface Guidelines (HIG):
						</p>
						<div class="flex items-center gap-2 flex-wrap mt-1">
							<div
								class="flex items-center gap-1.5 bg-adwaita-bg border border-adwaita-border rounded-full pl-1.5 pr-3 py-1"
							>
								<span
									class="w-5 h-3 rounded-xs border border-zinc-400/15 shrink-0"
									style="background-color: #00B8A9;"
								></span>
								<span class="text-[11px] font-mono font-bold text-adwaita-text"
									>#00B8A9 (Primary Accent)</span
								>
							</div>
							<div
								class="flex items-center gap-1.5 bg-adwaita-bg border border-adwaita-border rounded-full pl-1.5 pr-3 py-1"
							>
								<span
									class="w-5 h-3 rounded-xs border border-zinc-400/15 shrink-0"
									style="background-color: #00B86A;"
								></span>
								<span class="text-[11px] font-mono font-bold text-adwaita-text">#00B86A</span>
							</div>
							<div
								class="flex items-center gap-1.5 bg-adwaita-bg border border-adwaita-border rounded-full pl-1.5 pr-3 py-1"
							>
								<span
									class="w-5 h-3 rounded-xs border border-zinc-400/15 shrink-0"
									style="background-color: #008CB8;"
								></span>
								<span class="text-[11px] font-mono font-bold text-adwaita-text">#008CB8</span>
							</div>
							<div
								class="flex items-center gap-1.5 bg-adwaita-bg border border-adwaita-border rounded-full pl-1.5 pr-3 py-1"
							>
								<span
									class="w-5 h-3 rounded-xs border border-zinc-400/15 shrink-0"
									style="background-color: #00B82C;"
								></span>
								<span class="text-[11px] font-mono font-bold text-adwaita-text">#00B82C</span>
							</div>
							<div
								class="flex items-center gap-1.5 bg-adwaita-bg border border-adwaita-border rounded-full pl-1.5 pr-3 py-1"
							>
								<span
									class="w-5 h-3 rounded-xs border border-zinc-400/15 shrink-0"
									style="background-color: #0052B8;"
								></span>
								<span class="text-[11px] font-mono font-bold text-adwaita-text">#0052B8</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	{/if}

	{#if activeSection === 'projects'}
		<section class="mx-auto max-w-3xl px-6 py-20">
			<h1 class="text-3xl font-bold text-adwaita-text tracking-tight">Projects</h1>
			<p class="mt-2 text-sm text-adwaita-subtitle">Open source work on GitHub.</p>
			<div class="mt-10 boxed-list">
				{#each projects as project (project.name)}
					<a
						href={project.url}
						target="_blank"
						rel="noopener noreferrer"
						title="Opens in a new tab"
						class="action-row group flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
					>
						<div class="flex flex-col gap-1.5 pr-0 sm:pr-6">
							<div class="flex items-center gap-2">
								<h3
									class="text-base font-bold text-adwaita-text group-hover:text-adwaita-blue transition-colors leading-none"
								>
									{project.name}
								</h3>
								{#if langColors[project.lang]}
									<span
										class="inline-flex items-center justify-center rounded-full px-2 h-4.5 text-[9px] font-bold uppercase tracking-wider leading-none {langColors[
											project.lang
										]}">{project.lang}</span
									>
								{/if}
							</div>
							<p class="text-sm text-adwaita-subtitle leading-relaxed">{project.desc}</p>
							<div class="mt-1.5 flex flex-wrap items-center gap-1.5">
								{#each project.tags as tag (tag)}
									<span
										class="rounded bg-adwaita-border/40 px-2 py-0.5 text-[11px] font-medium text-adwaita-subtitle"
										>{tag}</span
									>
								{/each}
							</div>
						</div>
						<div
							class="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0 border-t border-adwaita-border/40 pt-3 sm:border-t-0 sm:pt-0"
						>
							<div class="flex items-center gap-1 text-xs font-semibold text-adwaita-subtitle">
								<i class="bi bi-star-fill text-amber-500" style="font-size:12px" aria-hidden="true"
								></i>
								{project.stars}
							</div>
							<i
								class="bi bi-chevron-right text-sm text-zinc-400 opacity-80 transition-all group-hover:translate-x-0.5 group-hover:text-adwaita-blue"
								aria-hidden="true"
							></i>
						</div>
					</a>
				{/each}
			</div>
		</section>
	{/if}

	{#if activeSection === 'funding'}
		<LinkListSection
			title="Supporting & Funding"
			subtitle="If you find my open-source work helpful, consider supporting me through these platforms."
			items={fundingPlatforms}
		/>
	{/if}

	<footer
		class="mx-auto w-full max-w-3xl px-6 py-8 mt-auto text-center text-xs text-adwaita-subtitle/75 border-t border-adwaita-border"
	>
		<p>&copy; {new Date().getFullYear()} {name}. All rights reserved.</p>
	</footer>
</main>
