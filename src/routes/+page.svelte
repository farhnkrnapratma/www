<script lang="ts">
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



	interface Project {
		name: string;
		desc: string;
		tags: string[];
		url: string;
		lang: string;
		stars: number;
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
		{ label: 'Email', value: 'contact@fkp.my.id', href: 'mailto:contact@fkp.my.id', icon: 'bi-envelope' },
		{ label: 'GitHub', value: 'github.com/farhnkrnapratma', href: 'https://github.com/farhnkrnapratma', icon: 'bi-github' },
		{ label: 'LinkedIn', value: 'linkedin.com/in/farhnkrnapratma', href: 'https://linkedin.com/in/farhnkrnapratma', icon: 'bi-linkedin' },
		{ label: 'YouTube', value: 'youtube.com/@farhnkrnapratma', href: 'https://youtube.com/@farhnkrnapratma', icon: 'bi-youtube' }
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

	const skills: string[] = [
		'Linux',
		'Rust',
		'Python',
		'Network Security',
		'Cybersecurity (GRC, Network, Linux)',
		'Git',
		'Unix',
		'FOSS',
		'AI'
	];

	interface FundingPlatform {
		name: string;
		value: string;
		href: string;
		icon: string;
		color: string;
	}

	const fundingPlatforms: FundingPlatform[] = [
		{
			name: 'GitHub Sponsors',
			value: 'github.com/sponsors/farhnkrnapratma',
			href: 'https://github.com/sponsors/farhnkrnapratma',
			icon: 'bi-heart-fill',
			color: 'text-rose-500'
		},
		{
			name: 'Ko-fi',
			value: 'ko-fi.com/farhnkrnapratma',
			href: 'https://ko-fi.com/farhnkrnapratma',
			icon: 'bi-cup-hot-fill',
			color: 'text-amber-500'
		},
		{
			name: 'Open Collective',
			value: 'opencollective.com/farhnkrnapratma',
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
		TypeScript: 'bg-indigo-100 text-indigo-700'
	};

	const projects: Project[] = [
		{
			name: 'nixos',
			desc: 'NixOS flake for declarative, reproducible system environments — fully managed via Nix with home-manager and modular configuration.',
			tags: ['NixOS', 'Flake', 'Configuration'],
			url: 'https://github.com/farhnkrnapratma/nixos',
			lang: 'Nix',
			stars: 1
		},
		{
			name: 'boogeyman',
			desc: 'A simple and blazingly fast unit conversion API powered by Rust — built for performance and correctness.',
			tags: ['REST API', 'Unit Converter'],
			url: 'https://github.com/farhnkrnapratma/boogeyman',
			lang: 'Rust',
			stars: 1
		},
		{
			name: 'www',
			desc: 'Source code for my official website — built with SvelteKit, TailwindCSS v4, and deployed on Cloudflare Pages.',
			tags: ['SvelteKit', 'TailwindCSS', 'Cloudflare'],
			url: 'https://github.com/farhnkrnapratma/www',
			lang: 'Svelte',
			stars: 1
		}
	];

	let activeSection = $state<Section>('home');
	let menuOpen = $state(false);

	function navigate(section: Section) {
		activeSection = section;
		menuOpen = false;
	}
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

<nav class="fixed top-0 z-40 flex h-15 w-full items-center justify-between bg-adwaita-card px-5 font-sans border-b border-adwaita-border shadow-xs">
	<button onclick={() => navigate('home')} class="cursor-pointer text-base font-bold text-adwaita-text tracking-tight hover:opacity-80">
		{name}
	</button>

	<button
		class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-xl transition-colors hover:bg-zinc-950/8 md:hidden"
		onclick={() => (menuOpen = !menuOpen)}
		aria-label={menuOpen ? 'Close menu' : 'Open menu'}
		aria-expanded={menuOpen}
		aria-controls="mobile-menu"
	>
		<i class="bi {menuOpen ? 'bi-x-lg' : 'bi-list'} text-adwaita-text" aria-hidden="true"></i>
	</button>

	<ul
		id="mobile-menu"
		class="fixed right-0 top-0 z-40 flex h-full w-64 flex-col items-start gap-1 bg-adwaita-card px-4 pt-4 shadow-xl border-l border-adwaita-border transition-transform duration-300 ease-in-out md:static md:h-auto md:w-auto md:translate-x-0 md:flex-row md:items-center md:bg-zinc-200/50 md:p-1 md:rounded-lg md:border md:border-adwaita-border md:gap-0.5 md:shadow-none"
		class:translate-x-full={!menuOpen}
		class:translate-x-0={menuOpen}
	>
		<li class="mb-2 flex w-full items-center justify-end md:hidden">
			<button
				onclick={() => (menuOpen = false)}
				aria-label="Close menu"
				class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-xl transition-colors hover:bg-zinc-950/8"
			>
				<i class="bi bi-x-lg text-adwaita-text" aria-hidden="true"></i>
			</button>
		</li>

		{#each navItems as item (item.id)}
			<li class="w-full md:w-auto">
				<button
					onclick={() => navigate(item.id)}
					class="flex w-full cursor-pointer whitespace-nowrap items-center justify-start md:justify-center rounded-lg border-0 px-4 h-11 text-sm font-medium leading-none outline-none focus:outline-none active:outline-none transition-all md:rounded-md md:px-3.5 md:h-7.5 {activeSection === item.id ? 'bg-zinc-950 text-zinc-50 hover:bg-zinc-800 md:bg-white md:text-adwaita-text md:shadow-xs md:hover:bg-white' : 'text-adwaita-text hover:bg-zinc-950/5 md:text-adwaita-subtitle md:hover:text-adwaita-text md:hover:bg-white/45'}"
				>
					{item.label}
				</button>
			</li>
		{/each}
	</ul>
</nav>

<main class="pt-15 font-sans flex flex-col min-h-[calc(100vh-3.75rem)]">
	{#if activeSection === 'home'}
		<section class="mx-auto max-w-2xl px-6 py-20 flex min-h-[calc(100vh-8.75rem)] flex-col items-center justify-center text-center">
			<img
				src="/android-chrome-512x512.png"
				alt="Farhan Kurnia Pratama"
				class="mb-6 h-28 w-28 rounded-full object-cover object-top border border-adwaita-border shadow-xs"
			/>
			<h1 class="text-4xl font-bold text-adwaita-text md:text-5xl lg:text-6xl tracking-tight">{name}</h1>
			<p class="mt-3 text-lg font-medium text-adwaita-subtitle">{headline}</p>
			<p class="mt-4 max-w-xl text-base text-adwaita-subtitle/90 leading-relaxed">{desc}</p>
			<div class="mt-8 flex flex-wrap justify-center gap-3">
				<button
					onclick={() => navigate('cv')}
					class="cursor-pointer rounded-lg bg-adwaita-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600 focus:outline-none"
				>
					Curriculum Vitae
				</button>
				<button
					onclick={() => navigate('projects')}
					class="cursor-pointer rounded-lg bg-white border border-adwaita-border px-5 py-2.5 text-sm font-semibold text-adwaita-text transition-colors hover:bg-zinc-950/[0.02] focus:outline-none"
				>
					Projects
				</button>
				<button
					onclick={() => navigate('contacts')}
					class="cursor-pointer rounded-lg bg-white border border-adwaita-border px-5 py-2.5 text-sm font-semibold text-adwaita-text transition-colors hover:bg-zinc-950/[0.02] focus:outline-none"
				>
					Get in Touch
				</button>
			</div>
		</section>
	{/if}

	{#if activeSection === 'blogs'}
		<section class="mx-auto max-w-2xl px-6 py-20">
			<h1 class="text-3xl font-bold text-adwaita-text tracking-tight">Blogs</h1>
			<p class="mt-2 text-sm text-adwaita-subtitle">Thoughts on Linux, security, and open source.</p>
			<div class="mt-10 boxed-list">
				{#each posts as post (post.title)}
					<article class="action-row group cursor-pointer">
						<div class="flex flex-col gap-1 pr-6">
							<p class="text-xs font-semibold text-adwaita-subtitle">{post.date}</p>
							<h2 class="text-base font-bold text-adwaita-text group-hover:text-adwaita-blue transition-colors">{post.title}</h2>
							<p class="mt-1.5 text-sm text-adwaita-subtitle line-clamp-2">{post.excerpt}</p>
						</div>
						<i class="bi bi-chevron-right text-sm text-zinc-400 group-hover:text-adwaita-blue transition-all group-hover:translate-x-0.5" aria-hidden="true"></i>
					</article>
				{/each}
			</div>
		</section>
	{/if}

	{#if activeSection === 'contacts'}
		<section class="mx-auto max-w-2xl px-6 py-20">
			<h1 class="text-3xl font-bold text-adwaita-text tracking-tight">Contacts</h1>
			<p class="mt-2 text-sm text-adwaita-subtitle">Feel free to reach out via any of the channels below.</p>
			<div class="mt-10 boxed-list">
				{#each contacts as contact (contact.label)}
					<a
						href={contact.href}
						target="_blank"
						rel="noopener noreferrer"
						title="Opens in a new tab"
						class="action-row group"
					>
						<div class="flex items-center gap-4">
							<i class="bi {contact.icon} text-lg text-adwaita-subtitle transition-colors group-hover:text-adwaita-blue" aria-hidden="true"></i>
							<span class="text-sm font-semibold text-adwaita-text">{contact.label}</span>
						</div>
						<div class="flex items-center gap-2">
							<span class="text-sm font-medium text-adwaita-subtitle">{contact.value}</span>
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

	{#if activeSection === 'cv'}
		<section class="mx-auto max-w-2xl px-6 py-20">
			<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 class="text-3xl font-bold text-adwaita-text tracking-tight">Curriculum Vitae</h1>
					<p class="mt-2 text-sm text-adwaita-subtitle">Security-focused Software Engineer.</p>
				</div>
				<a
					href="/cv.pdf"
					download="Farhan_Kurnia_Pratama_CV.pdf"
					class="inline-flex items-center justify-center gap-2 rounded-lg bg-adwaita-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600 focus:outline-none"
				>
					<i class="bi bi-download" aria-hidden="true"></i>
					Download PDF
				</a>
			</div>

			<div class="mt-10">
				<h2 class="text-xs font-bold uppercase tracking-widest text-adwaita-subtitle">Experience</h2>
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
						<div class="px-5 py-4 flex flex-col gap-1 hover:bg-zinc-950/[0.015] transition-all">
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
						<span class="cursor-default rounded-full bg-zinc-200/60 px-3.5 py-1.5 text-xs font-bold text-adwaita-text hover:bg-zinc-200/80 transition-colors">
							{skill}
						</span>
					{/each}
				</div>
			</div>
		</section>
	{/if}

	{#if activeSection === 'projects'}
		<section class="mx-auto max-w-2xl px-6 py-20">
			<h1 class="text-3xl font-bold text-adwaita-text tracking-tight">Projects</h1>
			<p class="mt-2 text-sm text-adwaita-subtitle">Open source work on GitHub.</p>
			<div class="mt-10 boxed-list">
				{#each projects as project (project.name)}
					<a
						href={project.url}
						target="_blank"
						rel="noopener noreferrer"
						title="Opens in a new tab"
						class="action-row group"
					>
						<div class="flex flex-col gap-1.5 pr-6">
							<div class="flex items-center gap-2">
								<h3 class="text-base font-bold text-adwaita-text group-hover:text-adwaita-blue transition-colors">{project.name}</h3>
								{#if langColors[project.lang]}
									<span class="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider {langColors[project.lang]}">{project.lang}</span>
								{/if}
							</div>
							<p class="text-sm text-adwaita-subtitle leading-relaxed">{project.desc}</p>
							<div class="mt-1 flex flex-wrap items-center gap-1.5">
								{#each project.tags as tag (tag)}
									<span class="rounded bg-zinc-200/50 px-2 py-0.5 text-[11px] font-medium text-adwaita-subtitle">{tag}</span>
								{/each}
							</div>
						</div>
						<div class="flex items-center gap-3">
							<div class="flex items-center gap-1 text-xs font-semibold text-adwaita-subtitle">
								<i class="bi bi-star-fill text-amber-500" style="font-size:12px" aria-hidden="true"></i>
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
		<section class="mx-auto max-w-2xl px-6 py-20">
			<h1 class="text-3xl font-bold text-adwaita-text tracking-tight">Supporting & Funding</h1>
			<p class="mt-2 text-sm text-adwaita-subtitle">If you find my open-source work helpful, consider supporting me through these platforms.</p>
			<div class="mt-10 boxed-list">
				{#each fundingPlatforms as platform (platform.name)}
					<a
						href={platform.href}
						target="_blank"
						rel="noopener noreferrer"
						title="Opens in a new tab"
						class="action-row group"
					>
						<div class="flex items-center gap-4">
							<i class="bi {platform.icon} text-lg {platform.color}" aria-hidden="true"></i>
							<span class="text-sm font-semibold text-adwaita-text">{platform.name}</span>
						</div>
						<div class="flex items-center gap-2">
							<span class="text-sm font-medium text-adwaita-subtitle">{platform.value}</span>
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

	<footer class="mx-auto w-full max-w-2xl px-6 py-8 mt-auto text-center text-xs text-adwaita-subtitle/75 border-t border-adwaita-border">
		<p>&copy; {new Date().getFullYear()} {name}. All rights reserved.</p>
	</footer>
</main>
