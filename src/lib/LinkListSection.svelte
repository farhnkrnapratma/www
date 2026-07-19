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
  class="relative z-10 mx-auto w-full px-6 pt-10 pb-24 md:w-[70%] md:max-w-none md:pt-14 md:pb-28 lg:w-[45%]">
  <h1 class="text-3xl font-bold tracking-tight text-adwaita-text">{title}</h1>
  <p class="mt-2 text-sm text-adwaita-subtitle">{subtitle}</p>
  <div class="boxed-list mt-10">
    {#each items as item (item.label)}
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        title="Opens in a new tab"
        class="action-row group flex items-center justify-between gap-3">
        <div class="flex min-w-0 shrink-0 items-center gap-4">
          <i
            class="bi {item.icon} text-lg {item.color ||
              'text-adwaita-subtitle'} transition-colors group-hover:text-adwaita-accent"
            aria-hidden="true"></i>
          <span class="text-sm font-semibold whitespace-nowrap text-adwaita-text"
            >{item.label}</span>
        </div>
        <div class="flex min-w-0 items-center justify-end gap-3">
          <span class="hidden truncate text-sm font-medium text-adwaita-subtitle sm:inline">
            {item.value}
          </span>
          <span class="sr-only"> (opens in a new tab)</span>
          <i
            class="bi bi-chevron-right shrink-0 text-sm text-zinc-400 opacity-80 transition-all group-hover:translate-x-0.5 group-hover:text-adwaita-accent"
            aria-hidden="true"></i>
        </div>
      </a>
    {/each}
  </div>
</section>
