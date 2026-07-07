<script lang="ts">
	let {
		text,
		disabled = false,
		speed = 2,
		className = '',
		color = '#b5b5b5',
		shineColor = '#ffffff',
		spread = 120,
		yoyo = false,
		pauseOnHover = false,
		direction = 'left',
		delay = 0,
		...restProps
	} = $props<{
		text: string;
		disabled?: boolean;
		speed?: number;
		className?: string;
		color?: string;
		shineColor?: string;
		spread?: number;
		yoyo?: boolean;
		pauseOnHover?: boolean;
		direction?: 'left' | 'right';
		delay?: number;
		[key: string]: any;
	}>();
</script>

<span
	class="shiny-text {className}"
	class:disabled
	class:pause-on-hover={pauseOnHover}
	class:direction-left={direction === 'left'}
	class:direction-right={direction === 'right'}
	class:yoyo
	style="
		--color: {color};
		--shine-color: {shineColor};
		--spread: {spread}deg;
		--speed: {speed}s;
		--delay: {delay}s;
		--anim-direction: {yoyo ? 'alternate' : 'normal'};
		--anim-name: {direction === 'left' ? 'shiny-text-left' : 'shiny-text-right'};
	"
	{...restProps}
>
	{text}
</span>

<style>
	.shiny-text {
		display: inline-block;
		background-image: linear-gradient(
			var(--spread),
			var(--color) 0%,
			var(--color) 35%,
			var(--shine-color) 50%,
			var(--color) 65%,
			var(--color) 100%
		);
		background-size: 200% auto;
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
		animation-name: var(--anim-name);
		animation-duration: var(--speed);
		animation-delay: var(--delay);
		animation-iteration-count: infinite;
		animation-timing-function: linear;
		animation-direction: var(--anim-direction);
	}

	.shiny-text.disabled {
		background-image: none !important;
		-webkit-text-fill-color: initial !important;
		color: var(--color) !important;
		animation: none !important;
	}

	.shiny-text.pause-on-hover:hover {
		animation-play-state: paused;
	}

	@keyframes shiny-text-left {
		0% {
			background-position: 150% center;
		}
		100% {
			background-position: -50% center;
		}
	}

	@keyframes shiny-text-right {
		0% {
			background-position: -50% center;
		}
		100% {
			background-position: 150% center;
		}
	}
</style>
