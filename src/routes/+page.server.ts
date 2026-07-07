import { supabase } from '$lib/supabase';
import type { PageServerLoad } from './$types';

interface GitHubRepo {
	name: string;
	description: string | null;
	html_url: string;
	language: string | null;
	stargazers_count: number;
	topics: string[];
	fork: boolean;
	archived: boolean;
	license: {
		key: string;
		name: string;
		spdx_id: string;
		url: string;
	} | null;
}

export interface Project {
	name: string;
	desc: string;
	tags: string[];
	url: string;
	lang: string;
	stars: number;
	licenseName: string | null;
	licenseUrl: string | null;
}

const GITHUB_USERNAME = 'farhnkrnapratma';
const GITHUB_API_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos`;

export const load: PageServerLoad = async ({ fetch, platform }) => {
	let projects: Project[] = [];
	let dbPosts: any[] = [];

	try {
		const headers: Record<string, string> = {
			Accept: 'application/vnd.github.v3+json',
			'User-Agent': 'fkp-www-sveltekit'
		};

		const token = platform?.env?.GITHUB_TOKEN ?? import.meta.env.VITE_GITHUB_TOKEN;
		if (token) {
			headers['Authorization'] = `Bearer ${token}`;
		}

		const res = await fetch(`${GITHUB_API_URL}?sort=stars&direction=desc&per_page=30&type=owner`, {
			headers
		});

		if (res.ok) {
			const repos: GitHubRepo[] = await res.json();
			projects = repos
				.filter((repo) => !repo.fork && !repo.archived)
				.map((repo) => ({
					name: repo.name,
					desc: repo.description ?? 'No description provided.',
					tags: repo.topics.length > 0 ? repo.topics : [],
					url: repo.html_url,
					lang: repo.language ?? 'Unknown',
					stars: repo.stargazers_count,
					licenseName: repo.license?.spdx_id ?? null,
					licenseUrl: repo.license ? `${repo.html_url}/blob/main/LICENSE` : null
				}));
		} else {
			console.error(`GitHub API error: ${res.status} ${res.statusText}`);
			projects = getFallbackProjects();
		}
	} catch (err) {
		console.error('Failed to fetch GitHub repos:', err);
		projects = getFallbackProjects();
	}

	try {
		const { data, error } = await supabase
			.from('posts')
			.select('*')
			.eq('published', true)
			.order('created_at', { ascending: false })
			.limit(3);
		if (!error && data) {
			dbPosts = data;
		}
	} catch (err) {
		console.error('Failed to fetch blog posts for home page:', err);
	}

	return { projects, posts: dbPosts };
};

function getFallbackProjects(): Project[] {
	return [
		{
			name: 'nixos',
			desc: 'NixOS flake for declarative, reproducible system environments.',
			tags: ['NixOS', 'Flake', 'Configuration'],
			url: 'https://github.com/farhnkrnapratma/nixos',
			lang: 'Nix',
			stars: 0,
			licenseName: 'MIT',
			licenseUrl: 'https://github.com/farhnkrnapratma/nixos/blob/main/LICENSE'
		},
		{
			name: 'boogeyman',
			desc: 'A simple and blazingly fast unit conversion API powered by Rust.',
			tags: ['REST API', 'Unit Converter'],
			url: 'https://github.com/farhnkrnapratma/boogeyman',
			lang: 'Rust',
			stars: 0,
			licenseName: 'MIT',
			licenseUrl: 'https://github.com/farhnkrnapratma/boogeyman/blob/main/LICENSE'
		},
		{
			name: 'www',
			desc: 'Source code for my official website — built with SvelteKit.',
			tags: ['SvelteKit', 'TailwindCSS', 'Cloudflare'],
			url: 'https://github.com/farhnkrnapratma/www',
			lang: 'Svelte',
			stars: 0,
			licenseName: 'MIT',
			licenseUrl: 'https://github.com/farhnkrnapratma/www/blob/main/LICENSE'
		}
	];
}
