<script lang="ts">
  import Dialog from './components/ui/Dialog.svelte';
  import Button from './components/ui/Button.svelte';

  interface Props {
    isOpen: boolean;
    title: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    onConfirm?: () => void;
    onCancel?: () => void;
    children?: import('svelte').Snippet;
  }

  let {
    isOpen = $bindable(false),
    title,
    message = '',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    isDestructive = false,
    onConfirm = () => {},
    onCancel = () => {},
    children,
  }: Props = $props();

  function close() {
    isOpen = false;
    onCancel();
  }

  function confirm() {
    isOpen = false;
    onConfirm();
  }
</script>

<Dialog
  bind:isOpen
  {title}
  description={message}
  onClose={close}>
  {#if children}
    {@render children()}
  {:else}
    {#snippet footer()}
      <Button variant="secondary" size="md" onclick={close}>
        {cancelLabel}
      </Button>
      <Button
        variant={isDestructive ? 'destructive' : 'primary'}
        size="md"
        onclick={confirm}>
        {confirmLabel || (isDestructive ? 'Delete' : 'Confirm')}
      </Button>
    {/snippet}
  {/if}
</Dialog>
