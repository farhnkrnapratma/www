<script lang="ts">
  interface ListItem {
    label: string;
    value: string;
    shortValue?: string;
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

<section
  class="mx-auto w-full md:w-[70%] lg:w-[45%] md:max-w-none px-6 pt-10 pb-24 md:pt-14 md:pb-28 relative z-10">
  <h1 class="text-3xl font-bold text-adwaita-text tracking-tight">{title}</h1>
  <p class="mt-2 text-sm text-adwaita-subtitle">{subtitle}</p>
  <div class="mt-10 boxed-list">
    {#each items as item (item.label)}
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        title="Opens in a new tab"
        class="action-row group flex items-center justify-between gap-3">
        <div class="flex items-center gap-4 min-w-0 shrink-0">
          <i
            class="bi {item.icon} text-lg {item.color ||
              'text-adwaita-subtitle'} transition-colors group-hover:text-adwaita-accent"
            aria-hidden="true"></i>
          <span class="text-sm font-semibold text-adwaita-text whitespace-nowrap"
            >{item.label}</span>
        </div>
        <div class="flex items-center justify-end gap-3 min-w-0">
          <span class="hidden text-sm font-medium text-adwaita-subtitle truncate sm:inline">
            {item.value}
          </span>
          <span class="sr-only"> (opens in a new tab)</span>
          <i
            class="bi bi-chevron-right text-sm text-zinc-400 opacity-80 transition-all group-hover:translate-x-0.5 group-hover:text-adwaita-accent shrink-0"
            aria-hidden="true"></i>
        </div>
      </a>
    {/each}
  </div>
</section>
