<script lang="ts">
	let {
		as = 'button',
		class: className = '',
		color = '#7865d9',
		speed = '6s',
		thickness = 1,
		children,
		style = '',
		...restProps
	} = $props<{
		as?: string;
		class?: string;
		color?: string;
		speed?: string;
		thickness?: number;
		children?: any;
		style?: string;
		[key: string]: any;
	}>();
</script>

<svelte:element
	this={as}
	class="star-border-container {className}"
	style="padding: {thickness}px 0; {style}"
	{...restProps}
>
	<div
		class="border-gradient-bottom"
		style="background: radial-gradient(circle, {color}, transparent 10%); animation-duration: {speed};"
	></div>
	<div
		class="border-gradient-top"
		style="background: radial-gradient(circle, {color}, transparent 10%); animation-duration: {speed};"
	></div>
	<div class="inner-content">
		{@render children?.()}
	</div>
</svelte:element>

<style>
	.star-border-container {
		display: inline-block;
		position: relative;
		border-radius: 12px;
		overflow: hidden;
		border: none;
		background: transparent;
		padding: 0;
		cursor: pointer;
		text-decoration: none;
	}

	.border-gradient-bottom {
		position: absolute;
		width: 300%;
		height: 50%;
		opacity: 0.8;
		bottom: -12px;
		right: -250%;
		border-radius: 50%;
		animation: star-movement-bottom linear infinite alternate;
		z-index: 0;
		will-change: transform, opacity;
		transform: translate3d(0, 0, 0);
	}

	.border-gradient-top {
		position: absolute;
		opacity: 0.8;
		width: 300%;
		height: 50%;
		top: -12px;
		left: -250%;
		border-radius: 50%;
		animation: star-movement-top linear infinite alternate;
		z-index: 0;
		will-change: transform, opacity;
		transform: translate3d(0, 0, 0);
	}

	.inner-content {
		position: relative;
		border: 1px solid var(--color-adwaita-border);
		background: var(--color-adwaita-card);
		color: var(--color-adwaita-text);
		font-size: 0.875rem;
		font-weight: 600;
		text-align: center;
		padding: 8px 20px;
		border-radius: 12px;
		z-index: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		width: 100%;
		height: 100%;
		transition:
			background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1),
			border-color 0.25s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.star-border-container:hover .inner-content {
		background: var(--color-adwaita-hover);
	}

	@keyframes star-movement-bottom {
		0% {
			transform: translate(0%, 0%);
			opacity: 1;
		}
		100% {
			transform: translate(-100%, 0%);
			opacity: 0;
		}
	}

	@keyframes star-movement-top {
		0% {
			transform: translate(0%, 0%);
			opacity: 1;
		}
		100% {
			transform: translate(100%, 0%);
			opacity: 0;
		}
	}
</style>
