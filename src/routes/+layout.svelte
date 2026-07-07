<script lang="ts">
	import './layout.css';
	import { onMount } from 'svelte';

	const { children } = $props();

	type Theme = 'auto' | 'dark' | 'light';

	function applyTheme(newTheme: Theme) {
		if (typeof window !== 'undefined') {
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
		// Read theme from localStorage on mount and apply
		const saved = (localStorage.getItem('theme') as Theme) || 'auto';
		applyTheme(saved);

		// Watch system theme changes
		const media = window.matchMedia('(prefers-color-scheme: dark)');
		const listener = () => {
			const current = (localStorage.getItem('theme') as Theme) || 'auto';
			if (current === 'auto') {
				applyTheme('auto');
			}
		};

		// Synchronize theme changes from other tabs/pages
		const storageListener = (e: StorageEvent) => {
			if (e.key === 'theme') {
				applyTheme((e.newValue as Theme) || 'auto');
			}
		};

		media.addEventListener('change', listener);
		window.addEventListener('storage', storageListener);

		return () => {
			media.removeEventListener('change', listener);
			window.removeEventListener('storage', storageListener);
		};
	});
</script>

{@render children()}
