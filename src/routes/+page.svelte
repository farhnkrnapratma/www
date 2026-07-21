<script lang="ts">
  import LinkListSection from '$lib/LinkListSection.svelte';
  import ShinyText from '$lib/ShinyText.svelte';
  import { onMount } from 'svelte';
  import type { BlogPost } from './+page.server';
  import { isNameReserved } from '$lib/nameValidator';
  import { autoResize, ConfirmationDialog, SpotlightSearch } from '$lib';
  import { supabase } from '$lib/supabase';
  import { SvelteMap } from 'svelte/reactivity';

  let { data } = $props();

  type Section = 'home' | 'blogs' | 'contacts' | 'cv' | 'projects' | 'funding';

  interface NavItem {
    id: Section;
    label: string;
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
    'Security-focused Software Engineer with expertise in Linux/Unix, AI, and Open-Source Software, dedicated to building reliable, maintainable, and privacy-centric systems.';
  const headline = 'Linux/Unix, AI, Open-Source Software, and Cybersecurity.';
  const siteUrl = 'https://fkp.my.id/';

  const navItems: NavItem[] = [
    { id: 'home', label: 'Home' },
    { id: 'projects', label: 'Projects' },
    { id: 'blogs', label: 'Blogs' },
    { id: 'cv', label: 'CV' },
    { id: 'funding', label: 'Funding' },
    { id: 'contacts', label: 'Contacts' },
  ];

  const posts = $derived(data.posts || []);

  function getPostDate(post: BlogPost) {
    return new Date(post.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function getBannerUrl(bannerPath: string | null | undefined): string | null {
    if (!bannerPath) return null;
    const { data: res } = supabase.storage.from('blog-posts').getPublicUrl(bannerPath);
    return res.publicUrl;
  }

  const contacts: Contact[] = [
    {
      label: 'Email',
      value: 'contact@fkp.my.id',
      href: 'mailto:contact@fkp.my.id',
      icon: 'bi-envelope',
    },
    {
      label: 'GitHub',
      value: '@farhnkrnapratma',
      href: 'https://github.com/farhnkrnapratma',
      icon: 'bi-github',
    },
    {
      label: 'LinkedIn',
      value: '@farhnkrnapratma',
      href: 'https://linkedin.com/in/farhnkrnapratma',
      icon: 'bi-linkedin',
    },
    {
      label: 'X',
      value: '@farhnkrnapratma',
      href: 'https://x.com/farhnkrnapratma',
      icon: 'bi-twitter-x',
    },
    {
      label: 'Facebook',
      value: '@farhnkrnapratma',
      href: 'https://facebook.com/farhnkrnapratma',
      icon: 'bi-facebook',
    },
    {
      label: 'Instagram',
      value: '@farhnkrnapratma',
      href: 'https://instagram.com/farhnkrnapratma',
      icon: 'bi-instagram',
    },
    {
      label: 'Threads',
      value: '@farhnkrnapratma',
      href: 'https://threads.net/@farhnkrnapratma',
      icon: 'bi-threads',
    },
    {
      label: 'YouTube',
      value: '@farhnkrnapratma',
      href: 'https://youtube.com/@farhnkrnapratma',
      icon: 'bi-youtube',
    },
  ];

  const experiences: Experience[] = [
    {
      role: 'Software Engineer',
      company: 'PT Secure Modern Technology Indonesia',
      period: '2024 – Present',
      desc: 'Designed and developed highly secure, performant, and reliable software systems. Built secure APIs and backend services using Rust and Python. Automated system deployments and container orchestration, ensuring alignment with cybersecurity standards and robust access control guidelines.',
    },
  ];

  const education: Education[] = [
    {
      degree: "Bachelor's (S1)",
      major: 'Informatics Engineering',
      faculty: 'Faculty of Computer Science and Sciences',
      university: 'Universitas Indo Global Mandiri',
      period: '2024 – Present',
    },
  ];

  interface SkillGroup {
    category: string;
    items: string[];
  }

  const skills: SkillGroup[] = [
    { category: 'Linux', items: ['Debian', 'Ubuntu', 'Fedora', 'openSUSE', 'NixOS'] },
    { category: 'Unix', items: ['FreeBSD', 'OmniOS', 'OpenBSD'] },
    { category: 'Programming Languages', items: ['Rust', 'Python'] },
    { category: 'DevOps & Tooling', items: ['Docker', 'Kubernetes', 'CI/CD', 'Nix'] },
    { category: 'Shell Scripting', items: ['Bash', 'Nu'] },
    { category: 'Database', items: ['PostgreSQL', 'SurrealDB'] },
    { category: 'Version Control', items: ['Git', 'Jujutsu'] },
    { category: 'Artificial Intelligence', items: ['Prompt Engineering', 'LLMs', 'RAG'] },
    { category: 'Cybersecurity', items: ['GRC', 'IAM'] },
  ];

  interface FundingPlatform {
    label: string;
    value: string;
    shortValue?: string;
    href: string;
    icon: string;
    color?: string;
  }

  const fundingPlatforms: FundingPlatform[] = [
    {
      label: 'GitHub Sponsors',
      value: '@farhnkrnapratma',
      href: 'https://github.com/sponsors/farhnkrnapratma',
      icon: 'bi-heart-fill',
    },
    {
      label: 'Ko-fi',
      value: '@farhnkrnapratma',
      href: 'https://ko-fi.com/farhnkrnapratma',
      icon: 'bi-cup-hot-fill',
    },
    {
      label: 'Open Collective',
      value: '@farhnkrnapratma',
      href: 'https://opencollective.com/farhnkrnapratma',
      icon: 'bi-people-fill',
    },
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
    HTML: 'bg-pink-100 text-pink-700',
  };

  const projects = $derived(data.projects);
  let activeProjectTag = $state<string | null>(null);

  const projectTags = $derived.by(() => {
    const counts = new SvelteMap<string, number>();
    data.projects.forEach(p => {
      p.tags.forEach(t => {
        const normalized = t.toLowerCase();
        counts.set(normalized, (counts.get(normalized) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 10)
      .map(entry => entry[0]);
  });

  const filteredProjects = $derived.by(() => {
    if (!activeProjectTag) return data.projects;
    return data.projects.filter(p => p.tags.some(t => t.toLowerCase() === activeProjectTag));
  });

  type Theme = 'auto' | 'dark' | 'light';

  let activeSection = $state<Section>('home');
  let menuOpen = $state(false);
  let theme = $state<Theme>('auto');
  let themeDropdownOpen = $state(false);
  let formName = $state('');
  let formEmail = $state('');
  let formMessage = $state('');
  let formErrors = $state({ name: '', email: '', message: '' });
  let formValid = $state({ name: false, email: false, message: false });
  let showSendMessageDialog = $state(false);
  let contactFormElement = $state<HTMLFormElement | null>(null);

  function debounce<T extends unknown[]>(cb: (...args: T) => void, ms: number) {
    let timer: ReturnType<typeof setTimeout>;
    return (...args: T) => {
      clearTimeout(timer);
      timer = setTimeout(() => cb(...args), ms);
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateName = debounce(() => {
    if (formName.trim() === '') {
      formErrors.name = '';
      formValid.name = false;
    } else if (isNameReserved(formName)) {
      formErrors.name = 'This name cannot be used. Please use another name.';
      formValid.name = false;
    } else {
      formErrors.name = '';
      formValid.name = true;
    }
  }, 500);

  const validateEmail = debounce(() => {
    if (formEmail.trim() === '') {
      formErrors.email = '';
      formValid.email = false;
    } else if (!emailRegex.test(formEmail.trim())) {
      formErrors.email = 'Please enter a valid email address.';
      formValid.email = false;
    } else {
      formErrors.email = '';
      formValid.email = true;
    }
  }, 500);

  const validateMessage = debounce(() => {
    if (formMessage.trim() === '') {
      formErrors.message = '';
      formValid.message = false;
    } else {
      formErrors.message = '';
      formValid.message = true;
    }
  }, 500);

  function sanitizeInput(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  function validateForm(e: Event) {
    const nameErr = formName.trim() === '' ? 'Name is required.' : '';
    const emailErr = formEmail.trim() === '' ? 'Email is required.' : '';
    const msgErr = formMessage.trim() === '' ? 'Message is required.' : '';
    const emailFormatErr =
      !emailErr && !emailRegex.test(formEmail.trim()) ? 'Please enter a valid email address.' : '';
    const nameReservedErr =
      !nameErr && isNameReserved(formName) ?
        'This name cannot be used. Please use another name.'
      : '';

    formErrors = {
      name: nameErr || nameReservedErr,
      email: emailErr || emailFormatErr,
      message: msgErr,
    };
    if (formErrors.name) formValid.name = false;
    if (formErrors.email) formValid.email = false;
    if (formErrors.message) formValid.message = false;

    e.preventDefault();

    if (!formErrors.name && !formErrors.email && !formErrors.message) {
      formName = sanitizeInput(formName.trim());
      formEmail = sanitizeInput(formEmail.trim());
      formMessage = sanitizeInput(formMessage.trim());
      showSendMessageDialog = true;
    }
  }

  function executeSendMessage() {
    if (contactFormElement) {
      contactFormElement.submit();
    }
  }

  function navigate(section: Section) {
    activeSection = section;
    menuOpen = false;
    if (typeof window !== 'undefined') {
      window.location.hash = section === 'home' ? '' : section;
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

  function getThemeIcon(selectedTheme = theme) {
    if (selectedTheme === 'dark') return 'bi-moon-stars-fill';
    if (selectedTheme === 'light') return 'bi-sun-fill';
    return 'bi-circle-half';
  }

  function getThemeLabel(selectedTheme = theme) {
    return selectedTheme.charAt(0).toUpperCase() + selectedTheme.slice(1);
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

    const handleHashChange = () => {
      if (typeof window !== 'undefined' && window.location.hash) {
        const hash = window.location.hash.substring(1) as Section;
        if (['home', 'blogs', 'contacts', 'cv', 'projects', 'funding'].includes(hash)) {
          activeSection = hash;
        }
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      media.removeEventListener('change', listener);
      window.removeEventListener('hashchange', handleHashChange);
    };
  });
</script>

<svelte:head>
  <title>{name} — {headline}</title>
  <meta
    name="description"
    content={desc} />
  <meta
    name="robots"
    content="noindex, nofollow" />
  <link
    rel="canonical"
    href={siteUrl} />
  <meta
    property="og:title"
    content="{name} — {headline}" />
  <meta
    property="og:description"
    content={desc} />
  <meta
    property="og:type"
    content="profile" />
  <meta
    property="og:url"
    content={siteUrl} />
  <meta
    property="og:site_name"
    content={name} />
  <meta
    property="og:image"
    content="{siteUrl}hero.png" />
  <meta
    property="og:image:secure_url"
    content="{siteUrl}hero.png" />
  <meta
    property="og:image:type"
    content="image/png" />
  <meta
    property="og:image:width"
    content="1280" />
  <meta
    property="og:image:height"
    content="640" />
  <meta
    property="og:image:alt"
    content="{name} — {desc}" />
  <meta
    property="og:locale"
    content="en_US" />
  <meta
    property="og:locale:alternate"
    content="id_ID" />
  <meta
    property="profile:first_name"
    content="Farhan Kurnia" />
  <meta
    property="profile:last_name"
    content="Pratama" />
  <meta
    property="profile:username"
    content={username} />
  <meta
    property="profile:gender"
    content="male" />
  <meta
    name="twitter:card"
    content="summary_large_image" />
  <meta
    name="twitter:title"
    content="{name} — {headline}" />
  <meta
    name="twitter:description"
    content={desc} />
  <meta
    name="twitter:image"
    content="{siteUrl}hero.png" />
</svelte:head>

{#if menuOpen}
  <button
    class="fixed inset-0 z-30 bg-transparent md:hidden"
    onclick={() => (menuOpen = false)}
    aria-label="Close menu"></button>
{/if}

<nav
  class="fixed top-0 z-40 flex h-15 w-full items-center justify-between border-b border-adwaita-border bg-adwaita-card px-3 font-sans shadow-xs backdrop-blur-lg transition-colors duration-300 sm:px-5 md:bg-adwaita-card/60">
  <button
    onclick={() => navigate('home')}
    class="max-w-[calc(100vw-5rem)] min-w-0 cursor-pointer truncate text-left text-base font-bold tracking-tight text-adwaita-text transition-colors hover:text-adwaita-accent sm:max-w-none">
    {name}
  </button>

  <div class="flex items-center gap-2 sm:gap-3">
    <ul
      id="mobile-menu"
      class="fixed top-16 right-5 z-40 flex w-56 origin-top-right flex-col items-start gap-1 rounded-xl border border-adwaita-border bg-adwaita-card p-2 shadow-lg transition-all duration-200 md:pointer-events-auto md:static md:h-auto md:w-auto md:translate-x-0 md:scale-100 md:flex-row md:items-center md:gap-0.5 md:rounded-lg md:border md:border-adwaita-border md:bg-adwaita-switcher-bg md:p-1 md:opacity-100 md:shadow-none"
      class:opacity-0={!menuOpen}
      class:scale-95={!menuOpen}
      class:pointer-events-none={!menuOpen}
      class:opacity-100={menuOpen}
      class:scale-100={menuOpen}>
      <li class="w-full md:hidden">
        <div class="relative w-full">
          <button
            onclick={() => (themeDropdownOpen = !themeDropdownOpen)}
            class="flex h-11 w-full cursor-pointer items-center justify-between rounded-lg px-4 text-sm font-semibold text-adwaita-text transition-colors hover:bg-adwaita-hover"
            aria-label="Change theme"
            aria-haspopup="true"
            aria-expanded={themeDropdownOpen}>
            <span class="inline-flex items-center gap-3">
              <i
                class="bi {getThemeIcon()} text-sm"
                aria-hidden="true"></i>
              {getThemeLabel()}
            </span>
            <i
              class="bi bi-chevron-down text-xs text-adwaita-subtitle"
              aria-hidden="true"></i>
          </button>

          {#if themeDropdownOpen}
            <div
              class="absolute top-12 right-0 left-0 z-50 flex w-full flex-col rounded-lg border border-adwaita-border bg-adwaita-card p-1 shadow-lg">
              {#each ['auto', 'light', 'dark'] as themeOption (themeOption)}
                <button
                  onclick={() => {
                    applyTheme(themeOption as Theme);
                    themeDropdownOpen = false;
                  }}
                  class="flex h-9 w-full cursor-pointer items-center gap-3 rounded-md px-3 text-left text-xs font-bold transition-colors hover:bg-adwaita-hover {(
                    theme === themeOption
                  ) ?
                    'text-adwaita-accent'
                  : 'text-adwaita-text'}">
                  <i
                    class="bi {getThemeIcon(themeOption as Theme)} text-sm"
                    aria-hidden="true"></i>
                  {getThemeLabel(themeOption as Theme)}
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </li>

      {#each navItems as item (item.id)}
        <li class="w-full md:w-auto">
          <button
            onclick={() => {
              navigate(item.id);
              menuOpen = false;
            }}
            class="flex h-11 w-full cursor-pointer items-center justify-start rounded-lg border-0 px-4 text-sm leading-none font-medium whitespace-nowrap transition-all md:h-7.5 md:justify-center md:rounded-md md:px-3.5 {(
              activeSection === item.id
            ) ?
              'bg-adwaita-accent font-semibold text-white hover:bg-adwaita-accent/90 md:bg-adwaita-switcher-active md:text-adwaita-accent md:shadow-xs md:hover:bg-adwaita-switcher-active'
            : 'text-adwaita-text hover:bg-adwaita-hover md:text-adwaita-subtitle md:hover:bg-adwaita-hover md:hover:text-adwaita-text'}">
            {item.label}
          </button>
        </li>
      {/each}
    </ul>

    <div class="relative">
      <button
        onclick={() => (themeDropdownOpen = !themeDropdownOpen)}
        class="hidden h-10 w-10 cursor-pointer items-center justify-center rounded-full text-lg text-adwaita-text transition-colors hover:bg-adwaita-hover md:flex"
        aria-label="Change theme"
        aria-haspopup="true"
        aria-expanded={themeDropdownOpen}>
        <i
          class="bi {getThemeIcon()}"
          aria-hidden="true"></i>
      </button>

      {#if themeDropdownOpen}
        <button
          class="fixed inset-0 z-40 hidden cursor-default md:block"
          onclick={() => (themeDropdownOpen = false)}
          aria-label="Close theme menu"></button>
        <div
          class="absolute top-12 right-0 z-50 hidden min-w-31.25 flex-col rounded-xl border border-adwaita-border bg-adwaita-card py-1.5 shadow-lg md:flex">
          <button
            onclick={() => {
              applyTheme('auto');
              themeDropdownOpen = false;
            }}
            class="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-xs font-bold transition-colors hover:bg-adwaita-hover {(
              theme === 'auto'
            ) ?
              'text-adwaita-accent'
            : 'text-adwaita-text'}">
            <i
              class="bi bi-circle-half text-sm"
              aria-hidden="true"></i>
            Auto
          </button>
          <button
            onclick={() => {
              applyTheme('light');
              themeDropdownOpen = false;
            }}
            class="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-xs font-bold transition-colors hover:bg-adwaita-hover {(
              theme === 'light'
            ) ?
              'text-adwaita-accent'
            : 'text-adwaita-text'}">
            <i
              class="bi bi-sun-fill text-sm"
              aria-hidden="true"></i>
            Light
          </button>
          <button
            onclick={() => {
              applyTheme('dark');
              themeDropdownOpen = false;
            }}
            class="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-xs font-bold transition-colors hover:bg-adwaita-hover {(
              theme === 'dark'
            ) ?
              'text-adwaita-accent'
            : 'text-adwaita-text'}">
            <i
              class="bi bi-moon-stars-fill text-sm"
              aria-hidden="true"></i>
            Dark
          </button>
        </div>
      {/if}
    </div>

    <SpotlightSearch projects={data.projects} />

    <button
      class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-xl transition-colors hover:bg-adwaita-hover md:hidden"
      onclick={() => (menuOpen = !menuOpen)}
      aria-label={menuOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={menuOpen}
      aria-controls="mobile-menu">
      <i
        class="bi {menuOpen ? 'bi-x-lg' : 'bi-list'} text-adwaita-text"
        aria-hidden="true"></i>
    </button>
  </div>
</nav>

<main class="flex min-h-[calc(100vh-3.75rem)] flex-col pt-15 font-sans">
  {#if activeSection === 'home'}
    <section
      class="relative z-10 mx-auto flex w-full flex-col gap-8 px-6 pt-10 pb-24 md:w-[80%] md:max-w-none md:pt-14 md:pb-28 lg:w-[50%]">
      <div
        class="pointer-events-none absolute top-12.5 left-[50%] z-0 h-80 w-[320px] translate-x-[-50%] rounded-full bg-adwaita-accent/10 blur-[80px]">
      </div>

      <div class="relative z-10 flex flex-col items-center justify-center text-center">
        <img
          src="/android-chrome-512x512.png"
          alt="Farhan Kurnia Pratama"
          class="relative z-10 mb-6 h-28 w-28 rounded-full border-2 border-adwaita-accent object-cover object-top shadow-[0_0_20px_rgba(120,101,217,0.25)] transition-all duration-300 dark:shadow-[0_0_25px_rgba(120,101,217,0.35)]" />
        <h1
          class="relative z-10 text-3xl font-bold tracking-tight whitespace-nowrap text-adwaita-text md:text-4xl lg:text-5xl">
          {name}
        </h1>
        <p class="relative z-10 mt-3 mb-2 text-lg font-medium text-adwaita-subtitle">{headline}</p>
        <p class="relative z-10 mt-4 max-w-xl text-base leading-relaxed text-adwaita-subtitle/90">
          {desc}
        </p>

        <div
          class="relative z-10 mt-8 flex w-full flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <a
            href="/cv.pdf"
            download="Farhan_Kurnia_Pratama_CV.pdf"
            class="inline-flex w-full cursor-pointer items-center justify-center rounded-lg bg-adwaita-accent py-2 text-xs font-semibold whitespace-nowrap text-white transition-colors hover:bg-adwaita-accent-hover sm:w-48 sm:text-sm">
            Download CV
          </a>
          <button
            onclick={() => navigate('projects')}
            class="inline-flex w-full cursor-pointer items-center justify-center rounded-lg border border-adwaita-border bg-adwaita-card py-2 text-xs font-semibold whitespace-nowrap text-adwaita-text transition-colors hover:bg-adwaita-hover sm:w-48 sm:text-sm">
            Browse Projects
          </button>
          <button
            onclick={() => navigate('contacts')}
            class="inline-flex w-full cursor-pointer items-center justify-center rounded-lg border border-adwaita-border bg-adwaita-card py-2 text-xs font-semibold whitespace-nowrap text-adwaita-text transition-colors hover:bg-adwaita-hover sm:mt-0 sm:w-48 sm:text-sm">
            Get in Touch
          </button>
        </div>
      </div>

      <div>
        <h3 class="mb-4 text-lg font-bold tracking-tight text-adwaita-text">Top Projects</h3>
        <div class="boxed-list text-left">
          {#each projects.slice(0, 3) as project (project.name)}
            <div class="action-row group relative flex flex-col items-stretch gap-2 text-left">
              <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div class="flex items-center gap-2">
                  <h4
                    class="text-base leading-none font-bold text-adwaita-text transition-colors group-hover:text-adwaita-accent">
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Opens in a new tab"
                      class="after:absolute after:inset-0 after:z-10">
                      {project.name}
                    </a>
                  </h4>
                  {#if langColors[project.lang]}
                    <span
                      class="rounded bg-adwaita-accent/15 px-2 py-0.5 text-[11px] font-semibold text-adwaita-accent"
                      title="Language: {project.lang}">{project.lang}</span>
                  {/if}
                </div>

                <div
                  class="relative z-20 flex shrink-0 flex-wrap items-center gap-3 sm:justify-end">
                  {#if project.licenseName}
                    <span
                      class="text-xs font-semibold whitespace-nowrap text-adwaita-subtitle"
                      title="License: {project.licenseName}">
                      {project.licenseName} License
                    </span>
                  {/if}

                  <div class="flex items-center gap-1 text-xs font-semibold text-adwaita-subtitle">
                    <i
                      class="bi bi-star-fill text-[12px] text-amber-600"
                      aria-hidden="true"></i>
                    {project.stars}
                  </div>
                  <i
                    class="bi bi-chevron-right text-sm text-zinc-400 opacity-80 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"></i>
                </div>
              </div>
              <p class="text-sm leading-relaxed text-adwaita-subtitle">{project.desc}</p>
              <div class="relative z-20 mt-0.5 flex flex-wrap items-center gap-1.5">
                {#each project.tags as tag (tag)}
                  <span
                    class="rounded bg-adwaita-border/40 px-2 py-0.5 text-[11px] font-medium text-adwaita-subtitle"
                    >{tag}</span>
                {/each}
              </div>
            </div>
          {/each}
          <button
            onclick={() => navigate('projects')}
            class="action-row group flex w-full cursor-pointer items-center justify-between text-left">
            <span class="text-sm font-bold text-adwaita-accent group-hover:underline"
              >View all projects</span>
            <i
              class="bi bi-chevron-right text-sm text-adwaita-accent transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"></i>
          </button>
        </div>
      </div>

      <div>
        <h3 class="mb-4 text-lg font-bold tracking-tight text-adwaita-text">Recent Blog Posts</h3>
        <div class="boxed-list text-left">
          {#if posts.length === 0}
            <div class="p-6 text-center text-sm text-adwaita-subtitle">
              No blog posts published yet.
            </div>
          {:else}
            {#each posts.slice(0, 2) as post (post.title)}
              <a
                href="/blog/{post.slug}"
                class="action-row group flex w-full cursor-pointer flex-col items-stretch gap-4 text-left sm:flex-row sm:items-center">
                {#if post.banner_path}
                  <div
                    class="aspect-[2/1] w-full shrink-0 overflow-hidden rounded-lg border border-adwaita-border bg-adwaita-hover/20 select-none sm:w-40 md:w-48">
                    <img
                      src={getBannerUrl(post.banner_path)}
                      alt=""
                      class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-103" />
                  </div>
                {:else}
                  <div
                    class="to-palette-purple/15 flex aspect-[2/1] w-full shrink-0 items-center justify-center rounded-lg border border-adwaita-border bg-gradient-to-br from-adwaita-accent/15 select-none sm:w-40 md:w-48">
                    <i class="bi bi-journal-text text-xl text-adwaita-accent/50"></i>
                  </div>
                {/if}

                <div class="flex flex-1 flex-col gap-1 font-sans">
                  <div
                    class="no-scrollbar flex w-full items-center gap-x-2.5 overflow-x-auto font-sans text-[11px] font-semibold whitespace-nowrap text-adwaita-subtitle select-none">
                    <span class="inline-flex items-center gap-1"
                      ><span
                        class="material-symbols-rounded text-[10px] leading-none"
                        style="font-variation-settings: 'wght' 300;"
                        aria-hidden="true">calendar_clock</span>
                      {getPostDate(post)}</span>
                    <span class="inline-flex items-center gap-1"
                      ><span
                        class="material-symbols-rounded text-[10px] leading-none"
                        style="font-variation-settings: 'wght' 300;"
                        aria-hidden="true">av_timer</span>
                      {(post.read_time || '').replace(/\s*read\s*/gi, '')}</span>
                    <span class="inline-flex items-center gap-1"
                      ><span
                        class="material-symbols-rounded text-[10px] leading-none"
                        style="font-variation-settings: 'wght' 300;"
                        aria-hidden="true">forum</span>
                      {post.comment_count || 0}</span>
                    {#if post.views_count !== undefined}
                      <span class="inline-flex items-center gap-1"
                        ><span
                          class="material-symbols-rounded text-[10px] leading-none"
                          style="font-variation-settings: 'wght' 300;"
                          aria-hidden="true">visibility</span>
                        {post.views_count}</span>
                    {/if}
                  </div>
                  <h4
                    class="text-base leading-snug font-bold text-adwaita-text transition-colors group-hover:text-adwaita-accent">
                    {post.title}
                  </h4>
                  {#if post.excerpt}
                    <p class="mt-1 line-clamp-2 text-xs leading-normal text-adwaita-subtitle">
                      {post.excerpt}
                    </p>
                  {/if}
                </div>

                <div class="ml-2 hidden shrink-0 items-center sm:flex">
                  <i
                    class="bi bi-chevron-right text-sm text-zinc-400 transition-all group-hover:translate-x-0.5 group-hover:text-adwaita-accent"
                    aria-hidden="true"></i>
                </div>
              </a>
            {/each}
            <button
              onclick={() => navigate('blogs')}
              class="action-row group flex w-full cursor-pointer items-center justify-between text-left">
              <span class="text-sm font-bold text-adwaita-accent group-hover:underline"
                >View all posts</span>
              <i
                class="bi bi-chevron-right text-sm text-adwaita-accent transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"></i>
            </button>
          {/if}
        </div>
      </div>

      <div class="boxed-list border-adwaita-accent/30 bg-adwaita-accent/5 text-left">
        <div class="flex flex-col justify-between gap-4 px-5 py-4 sm:flex-row sm:items-center">
          <div class="flex items-start gap-4">
            <i
              class="bi bi-heart-fill mt-0.5 shrink-0 text-2xl text-adwaita-accent"
              aria-hidden="true"></i>
            <div>
              <h4 class="text-sm font-bold">
                <ShinyText
                  text="Support Open Source Work"
                  color="var(--color-adwaita-accent)"
                  shineColor="var(--color-adwaita-card)"
                  speed={1.5} />
              </h4>
              <p class="mt-0.5 text-xs leading-relaxed text-adwaita-subtitle">
                Your support helps maintain and improve these open-source projects
              </p>
            </div>
          </div>
          <button
            onclick={() => navigate('funding')}
            class="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg bg-adwaita-accent px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-adwaita-accent-hover">
            Become a Sponsor
          </button>
        </div>
      </div>

      <form
        bind:this={contactFormElement}
        novalidate
        action="https://formsubmit.co/contact@fkp.my.id"
        method="POST"
        onsubmit={validateForm}
        class="flex w-full flex-col gap-2 rounded-2xl border border-adwaita-border bg-adwaita-card/45 p-5 text-left shadow-xs backdrop-blur-lg transition-colors duration-300"
        autocomplete="off">
        <input
          type="hidden"
          name="_subject"
          value="New message from portfolio website!" />
        <input
          type="hidden"
          name="_template"
          value="table" />
        <input
          type="hidden"
          name="_captcha"
          value="true" />
        <input
          type="hidden"
          name="_url"
          value="https://fkp.my.id/" />

        <div class="mb-2 select-none">
          <h2 class="text-sm font-bold text-adwaita-text">Send a Message</h2>
          <p class="mt-0.5 text-xs text-adwaita-label">
            Feel free to drop me a line. I'll get back to you as soon as possible.
          </p>
        </div>

        <div class="flex flex-col gap-1">
          <label
            for="form-name"
            class="text-xs font-bold text-adwaita-label select-none">
            Name <span
              aria-hidden="true"
              class="text-adwaita-error">*</span
            ><span class="sr-only">(required)</span>
          </label>
          <div class="w-full">
            <input
              type="text"
              id="form-name"
              name="name"
              aria-required="true"
              autocomplete="name"
              aria-invalid={!!formErrors.name}
              aria-describedby="form-name-fb"
              placeholder="Enter your name"
              bind:value={formName}
              oninput={() => {
                formErrors.name = '';
                formValid.name = false;
                validateName();
              }}
              class="w-full rounded-lg border border-adwaita-border bg-adwaita-bg px-3 py-1.5 text-sm text-adwaita-text transition-colors placeholder:text-adwaita-label/70"
              class:border-adwaita-error={formErrors.name}
              class:input-valid={formValid.name} />
            <div
              id="form-name-fb"
              aria-live="polite"
              class="mt-0.5 h-4 text-[11px] leading-none font-medium">
              {#if formErrors.name}
                <span
                  role="alert"
                  class="flex items-center gap-1 text-adwaita-error">
                  <i class="bi bi-exclamation-circle-fill"></i>{formErrors.name}
                </span>
              {:else if formValid.name}
                <span class="flex items-center gap-1 text-adwaita-accent">
                  <i class="bi bi-check-circle-fill"></i>Looks good
                </span>
              {/if}
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <label
            for="form-email"
            class="text-xs font-bold text-adwaita-label select-none">
            Email <span
              aria-hidden="true"
              class="text-adwaita-error">*</span
            ><span class="sr-only">(required)</span>
          </label>
          <div class="w-full">
            <input
              type="email"
              id="form-email"
              name="email"
              aria-required="true"
              aria-invalid={!!formErrors.email}
              aria-describedby="form-email-fb"
              placeholder="Enter your email"
              autocomplete="email"
              bind:value={formEmail}
              oninput={() => {
                formErrors.email = '';
                formValid.email = false;
                validateEmail();
              }}
              class="w-full rounded-lg border border-adwaita-border bg-adwaita-bg px-3 py-1.5 text-sm text-adwaita-text transition-colors placeholder:text-adwaita-label/70"
              class:border-adwaita-error={formErrors.email}
              class:input-valid={formValid.email} />
            <div
              id="form-email-fb"
              aria-live="polite"
              class="mt-0.5 h-4 text-[11px] leading-none font-medium">
              {#if formErrors.email}
                <span
                  role="alert"
                  class="flex items-center gap-1 text-adwaita-error">
                  <i class="bi bi-exclamation-circle-fill"></i>{formErrors.email}
                </span>
              {:else if formValid.email}
                <span class="flex items-center gap-1 text-adwaita-accent">
                  <i class="bi bi-check-circle-fill"></i>Looks good
                </span>
              {/if}
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <label
            for="form-message"
            class="text-xs font-bold text-adwaita-label select-none">
            Message <span
              aria-hidden="true"
              class="text-adwaita-error">*</span
            ><span class="sr-only">(required)</span>
          </label>
          <div class="relative w-full">
            <textarea
              use:autoResize={formMessage}
              id="form-message"
              name="message"
              rows="4"
              placeholder="Enter your message"
              maxlength="1000"
              bind:value={formMessage}
              oninput={() => {
                formErrors.message = '';
                formValid.message = false;
                validateMessage();
              }}
              aria-required="true"
              aria-invalid={!!formErrors.message}
              aria-describedby="form-msg-count form-message-fb"
              class="no-scrollbar w-full resize-none overflow-hidden rounded-lg border border-adwaita-border bg-adwaita-bg px-3 py-1.5 pr-16 text-sm text-adwaita-text transition-colors placeholder:text-adwaita-label/70"
              class:border-adwaita-error={formErrors.message}
              class:input-valid={formValid.message}></textarea>
            <div
              class="pointer-events-none absolute right-3 bottom-2.5 z-10 font-mono text-[10px] text-adwaita-subtitle/50 select-none"
              id="form-msg-count"
              aria-live="polite">
              {formMessage.length}/1000
            </div>
          </div>
          <div
            id="form-message-fb"
            aria-live="polite"
            class="mt-0.5 h-4 text-[11px] leading-none font-medium">
            {#if formErrors.message}
              <span
                role="alert"
                class="flex items-center gap-1 text-adwaita-error">
                <i class="bi bi-exclamation-circle-fill"></i>{formErrors.message}
              </span>
            {:else if formValid.message}
              <span class="flex items-center gap-1 text-adwaita-accent">
                <i class="bi bi-check-circle-fill"></i>Looks good
              </span>
            {/if}
          </div>
        </div>

        <div class="mt-2 flex justify-end">
          <button
            type="submit"
            class="inline-flex cursor-pointer items-center justify-center rounded-lg bg-adwaita-accent px-5 py-2 text-sm font-semibold text-white transition-colors select-none hover:bg-adwaita-accent-hover disabled:cursor-not-allowed disabled:opacity-55">
            Send Message
          </button>
        </div>
      </form>
    </section>
  {/if}

  {#if activeSection === 'contacts'}
    <LinkListSection
      title="Contacts"
      subtitle="Feel free to reach out via any of the channels below."
      items={contacts} />
  {/if}

  {#if activeSection === 'cv'}
    <section
      class="relative z-10 mx-auto w-full px-6 pt-10 pb-24 md:w-[80%] md:max-w-none md:pt-14 md:pb-28 lg:w-[50%]">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-adwaita-text">Curriculum Vitae</h1>
          <p class="mt-2 text-sm text-adwaita-subtitle">Security-focused Software Engineer.</p>
        </div>
        <a
          href="/cv.pdf"
          download="Farhan_Kurnia_Pratama_CV.pdf"
          class="inline-flex items-center justify-center rounded-lg bg-adwaita-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-adwaita-accent-hover">
          Download PDF
        </a>
      </div>

      <div class="mt-10">
        <h2 class="text-sm font-bold text-adwaita-subtitle">Experience</h2>
        <div class="boxed-list mt-4">
          {#each experiences as exp (exp.role)}
            <div class="flex flex-col gap-2 px-6 py-5 transition-all hover:bg-adwaita-hover">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <h3 class="text-base font-bold text-adwaita-text">{exp.role}</h3>
                  <p class="text-sm font-medium text-adwaita-subtitle">{exp.company}</p>
                </div>
                <p class="shrink-0 text-xs font-semibold text-adwaita-subtitle">{exp.period}</p>
              </div>
              <p class="mt-1.5 text-sm leading-relaxed text-adwaita-subtitle">{exp.desc}</p>
            </div>
          {/each}
        </div>
      </div>

      <div class="mt-10">
        <h2 class="text-sm font-bold text-adwaita-subtitle">Education</h2>
        <div class="boxed-list mt-4">
          {#each education as edu (`${edu.degree}-${edu.university}`)}
            <div class="flex flex-col gap-1.5 px-6 py-5 transition-all hover:bg-adwaita-hover">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <h3 class="text-base font-bold text-adwaita-text">{edu.degree} in {edu.major}</h3>
                  <p class="text-sm text-adwaita-subtitle">{edu.faculty}</p>
                  <p class="mt-1 text-sm font-semibold text-adwaita-text">{edu.university}</p>
                </div>
                <p class="shrink-0 text-xs font-semibold text-adwaita-subtitle">{edu.period}</p>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <div class="mt-10">
        <h2 class="text-sm font-bold text-adwaita-subtitle">Skills</h2>
        <div class="mt-4 flex flex-wrap gap-2">
          {#each skills as group (group.category)}
            <span
              class="cursor-default rounded-full bg-adwaita-border/40 px-4 py-2 text-sm font-bold text-adwaita-text transition-colors hover:bg-adwaita-border/60">
              {group.category}
              <span class="font-normal opacity-85">({group.items.join(', ')})</span>
            </span>
          {/each}
        </div>
      </div>
    </section>
  {/if}

  {#if activeSection === 'blogs'}
    <section
      class="relative z-10 mx-auto w-full px-6 pt-10 pb-24 md:w-[80%] md:max-w-none md:pt-14 md:pb-28 lg:w-[50%]">
      <div class="flex items-end justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-adwaita-text">Blogs</h1>
          <p class="mt-2 text-sm text-adwaita-subtitle">
            Thoughts on Linux, security, and open source.
          </p>
        </div>
        <a
          href="/atom.xml"
          target="_blank"
          rel="noopener noreferrer"
          title="Subscribe via Atom/RSS feed"
          class="mb-0.5 flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-adwaita-border bg-adwaita-card px-3 text-xs font-semibold text-adwaita-subtitle transition-colors select-none hover:bg-adwaita-hover hover:text-[#f26522]">
          <i
            class="bi bi-rss-fill flex items-center justify-center text-sm leading-none"
            aria-hidden="true"></i>
          <span class="flex hidden items-center leading-none sm:inline">Feed</span>
        </a>
      </div>
      <div class="boxed-list mt-8">
        {#if posts.length === 0}
          <div class="p-8 text-center text-adwaita-subtitle">
            <i
              class="bi bi-journal-x mb-2 block text-3xl opacity-60"
              aria-hidden="true"></i>
            No blog posts published yet.
          </div>
        {:else}
          {#each posts as post (post.id)}
            <a
              href="/blog/{post.slug}"
              class="action-row group flex w-full cursor-pointer flex-col items-stretch gap-4 text-left sm:flex-row sm:items-center">
              {#if post.banner_path}
                <div
                  class="aspect-[2/1] w-full shrink-0 overflow-hidden rounded-lg border border-adwaita-border bg-adwaita-hover/20 select-none sm:w-40 md:w-48">
                  <img
                    src={getBannerUrl(post.banner_path)}
                    alt=""
                    class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-103" />
                </div>
              {:else}
                <div
                  class="to-palette-purple/15 flex aspect-[2/1] w-full shrink-0 items-center justify-center rounded-lg border border-adwaita-border bg-gradient-to-br from-adwaita-accent/15 select-none sm:w-40 md:w-48">
                  <i class="bi bi-journal-text text-xl text-adwaita-accent/50"></i>
                </div>
              {/if}

              <div class="flex flex-1 flex-col gap-1 font-sans">
                <div
                  class="no-scrollbar flex w-full items-center gap-x-2.5 overflow-x-auto font-sans text-[11px] font-semibold whitespace-nowrap text-adwaita-subtitle select-none">
                  <span class="inline-flex items-center gap-1"
                    ><span
                      class="material-symbols-rounded text-[10px] leading-none"
                      style="font-variation-settings: 'wght' 300;"
                      aria-hidden="true">calendar_clock</span>
                    {getPostDate(post)}</span>
                  <span class="inline-flex items-center gap-1"
                    ><span
                      class="material-symbols-rounded text-[10px] leading-none"
                      style="font-variation-settings: 'wght' 300;"
                      aria-hidden="true">av_timer</span>
                    {(post.read_time || '').replace(/\s*read\s*/gi, '')}</span>
                  <span class="inline-flex items-center gap-1"
                    ><span
                      class="material-symbols-rounded text-[10px] leading-none"
                      style="font-variation-settings: 'wght' 300;"
                      aria-hidden="true">forum</span>
                    {post.comment_count || 0}</span>
                  {#if post.views_count !== undefined}
                    <span class="inline-flex items-center gap-1"
                      ><span
                        class="material-symbols-rounded text-[10px] leading-none"
                        style="font-variation-settings: 'wght' 300;"
                        aria-hidden="true">visibility</span>
                      {post.views_count}</span>
                  {/if}
                </div>
                <h2
                  class="text-lg leading-snug font-bold text-adwaita-text transition-colors group-hover:text-adwaita-accent">
                  {post.title}
                </h2>
                {#if post.excerpt}
                  <p class="mt-1 line-clamp-2 text-xs leading-normal text-adwaita-subtitle">
                    {post.excerpt}
                  </p>
                {/if}
              </div>

              <div class="ml-2 hidden shrink-0 items-center sm:flex">
                <i
                  class="bi bi-chevron-right text-sm text-zinc-400 transition-all group-hover:translate-x-0.5 group-hover:text-adwaita-accent"
                  aria-hidden="true"></i>
              </div>
            </a>
          {/each}
        {/if}
      </div>
    </section>
  {/if}

  {#if activeSection === 'projects'}
    <section
      class="relative z-10 mx-auto w-full px-6 pt-10 pb-24 md:w-[80%] md:max-w-none md:pt-14 md:pb-28 lg:w-[50%]">
      <h1 class="text-3xl font-bold tracking-tight text-adwaita-text">Projects</h1>
      <p class="mt-2 text-sm text-adwaita-subtitle">Open source work on GitHub.</p>

      {#if projectTags.length > 0}
        <div class="mt-6 flex flex-wrap gap-2 select-none">
          <button
            type="button"
            onclick={() => (activeProjectTag = null)}
            class="cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-all focus:outline-2 focus:outline-adwaita-accent {(
              activeProjectTag === null
            ) ?
              'bg-adwaita-accent text-white shadow-xs'
            : 'bg-adwaita-border/40 text-adwaita-subtitle hover:bg-adwaita-hover hover:text-adwaita-text'}">
            All
          </button>
          {#each projectTags as tag (tag)}
            <button
              type="button"
              onclick={() => (activeProjectTag = activeProjectTag === tag ? null : tag)}
              class="cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-all focus:outline-2 focus:outline-adwaita-accent {(
                activeProjectTag === tag
              ) ?
                'bg-adwaita-accent text-white shadow-xs'
              : 'bg-adwaita-border/40 text-adwaita-subtitle hover:bg-adwaita-hover hover:text-adwaita-text'}">
              #{tag}
            </button>
          {/each}
        </div>
      {/if}

      <div class="boxed-list mt-8">
        {#each filteredProjects as project (project.name)}
          <div class="action-row group relative flex flex-col items-stretch gap-2 text-left">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex items-center gap-2">
                <h3
                  class="text-base leading-none font-bold text-adwaita-text transition-colors group-hover:text-adwaita-accent">
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Opens in a new tab"
                    class="after:absolute after:inset-0 after:z-10">
                    {project.name}
                  </a>
                </h3>
                {#if langColors[project.lang]}
                  <span
                    class="rounded bg-adwaita-accent/15 px-2 py-0.5 text-[11px] font-semibold text-adwaita-accent"
                    title="Language: {project.lang}">{project.lang}</span>
                {/if}
              </div>

              <div class="relative z-20 flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                {#if project.licenseName}
                  <span
                    class="text-xs font-semibold whitespace-nowrap text-adwaita-subtitle"
                    title="License: {project.licenseName}">
                    {project.licenseName} License
                  </span>
                {/if}

                <div class="flex items-center gap-1 text-xs font-semibold text-adwaita-subtitle">
                  <i
                    class="bi bi-star-fill text-[12px] text-amber-600"
                    aria-hidden="true"></i>
                  {project.stars}
                </div>
                <i
                  class="bi bi-chevron-right text-sm text-zinc-400 opacity-80 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"></i>
              </div>
            </div>
            <p class="text-sm leading-relaxed text-adwaita-subtitle">{project.desc}</p>
            <div class="relative z-20 mt-0.5 flex flex-wrap items-center gap-1.5">
              {#each project.tags as tag (tag)}
                <button
                  type="button"
                  onclick={() =>
                    (activeProjectTag =
                      activeProjectTag === tag.toLowerCase() ? null : tag.toLowerCase())}
                  class="cursor-pointer rounded bg-adwaita-border/40 px-2 py-0.5 text-[11px] font-medium transition-colors hover:bg-adwaita-hover hover:text-adwaita-accent {(
                    activeProjectTag === tag.toLowerCase()
                  ) ?
                    'font-semibold text-adwaita-accent'
                  : 'text-adwaita-subtitle'}">
                  #{tag}
                </button>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  {#if activeSection === 'funding'}
    <LinkListSection
      title="Supporting & Funding"
      subtitle="Support open-source development and maintenance through these platforms."
      items={fundingPlatforms} />
  {/if}

  <footer
    class="relative z-10 mx-auto mt-auto w-full border-t border-adwaita-border px-6 pt-16 pb-12 font-sans text-xs text-adwaita-subtitle/75 md:w-[80%] lg:w-[50%]">
    <div class="grid grid-cols-1 gap-8 pb-10 md:grid-cols-12">
      <div class="flex flex-col gap-4 md:col-span-7">
        <div>
          <h3 class="text-base font-bold text-adwaita-text">{name}</h3>
          <p class="mt-2 max-w-md text-xs leading-relaxed text-adwaita-subtitle">
            {desc}
          </p>
        </div>

        <div class="flex items-center gap-3">
          <a
            href="https://github.com/farhnkrnapratma"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-adwaita-border bg-adwaita-card text-adwaita-subtitle transition-colors hover:bg-adwaita-hover hover:text-adwaita-accent"
            aria-label="GitHub (opens in a new tab)">
            <i
              class="bi bi-github text-base leading-none"
              aria-hidden="true"></i>
          </a>
          <a
            href="https://linkedin.com/in/farhnkrnapratma"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-adwaita-border bg-adwaita-card text-adwaita-subtitle transition-colors hover:bg-adwaita-hover hover:text-adwaita-accent"
            aria-label="LinkedIn (opens in a new tab)">
            <i
              class="bi bi-linkedin text-base leading-none"
              aria-hidden="true"></i>
          </a>
          <a
            href="https://x.com/farhnkrnapratma"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-adwaita-border bg-adwaita-card text-adwaita-subtitle transition-colors hover:bg-adwaita-hover hover:text-adwaita-accent"
            aria-label="X (opens in a new tab)">
            <i
              class="bi bi-twitter-x text-base leading-none"
              aria-hidden="true"></i>
          </a>
          <a
            href="https://instagram.com/farhnkrnapratma"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-adwaita-border bg-adwaita-card text-adwaita-subtitle transition-colors hover:bg-adwaita-hover hover:text-adwaita-accent"
            aria-label="Instagram (opens in a new tab)">
            <i
              class="bi bi-instagram text-base leading-none"
              aria-hidden="true"></i>
          </a>
        </div>
      </div>

      <div class="flex flex-col pt-1 md:col-span-5 md:pt-8">
        <ul class="grid grid-cols-2 gap-x-4 gap-y-2">
          {#each navItems as item (item.id)}
            <li>
              <button
                onclick={() => {
                  navigate(item.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                class="cursor-pointer text-left font-medium transition-colors hover:text-adwaita-accent">
                {item.label}
              </button>
            </li>
          {/each}
        </ul>
      </div>
    </div>

    <div
      class="flex flex-col items-center justify-between gap-4 border-t border-adwaita-border pt-6 select-none sm:flex-row">
      <p>&copy; {new Date().getFullYear()} {name}. All rights reserved</p>
      <div class="flex items-center gap-4 text-[11px] text-adwaita-subtitle">
        <a
          href="/atom.xml"
          class="inline-flex items-center gap-1 transition-colors hover:text-[#f26522]">
          <i
            class="bi bi-rss-fill"
            aria-hidden="true"></i> RSS Feed
        </a>
        <a
          href="/sitemap.xml"
          class="transition-colors hover:text-adwaita-accent">Sitemap</a>
      </div>
    </div>
  </footer>
</main>

<ConfirmationDialog
  bind:isOpen={showSendMessageDialog}
  title="Send Message?"
  message="Are you sure you want to send this message?"
  confirmLabel="Send"
  isDestructive={false}
  onConfirm={executeSendMessage} />
