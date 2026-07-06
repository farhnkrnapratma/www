<script lang="ts">
	interface ListItem {
		label: string;
		value: string;
		href: string;
		icon: string;
		color?: string;
	}

	const { title, subtitle, items } = $props<{
		title: string;
		subtitle: string;
		items: ListItem[];
	}>();
</script>

<section class="mx-auto max-w-3xl px-6 py-20">
	<h1 class="text-3xl font-bold text-adwaita-text tracking-tight">{title}</h1>
	<p class="mt-2 text-sm text-adwaita-subtitle">{subtitle}</p>
	<div class="mt-10 boxed-list">
		{#each items as item (item.label)}
			<a
				href={item.href}
				target="_blank"
				rel="noopener noreferrer"
				title="Opens in a new tab"
				class="action-row group flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
			>
				<div class="flex items-center gap-4">
					<i
						class="bi {item.icon} text-lg {item.color ||
							'text-adwaita-subtitle'} transition-colors group-hover:text-adwaita-blue"
						aria-hidden="true"
					></i>
					<span class="text-sm font-semibold text-adwaita-text">{item.label}</span>
				</div>
				<div class="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
					<span class="text-sm font-medium text-adwaita-subtitle break-all sm:break-normal"
						>{item.value}</span
					>
					<i
						class="bi bi-chevron-right text-sm text-zinc-400 opacity-80 transition-all group-hover:translate-x-0.5 group-hover:text-adwaita-blue"
						aria-hidden="true"
					></i>
				</div>
			</a>
		{/each}
	</div>
</section>
