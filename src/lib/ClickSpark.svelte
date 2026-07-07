<script lang="ts">
	import { onMount } from 'svelte';

	let {
		sparkColor = '#7865d9',
		sparkSize = 10,
		sparkRadius = 15,
		sparkCount = 8,
		duration = 400,
		easing = 'ease-out',
		extraScale = 1.0,
		children,
		class: className = '',
		...restProps
	} = $props<{
		sparkColor?: string;
		sparkSize?: number;
		sparkRadius?: number;
		sparkCount?: number;
		duration?: number;
		easing?: string;
		extraScale?: number;
		children?: any;
		class?: string;
		[key: string]: any;
	}>();

	let canvasRef = $state<HTMLCanvasElement | null>(null);
	let sparks = $state<any[]>([]);
	let startTime: number | null = null;
	let animationId: number;

	function easeFunc(t: number) {
		switch (easing) {
			case 'linear':
				return t;
			case 'ease-in':
				return t * t;
			case 'ease-in-out':
				return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
			default:
				return t * (2 - t);
		}
	}

	onMount(() => {
		const canvas = canvasRef;
		if (!canvas) return;
		const parent = canvas.parentElement;
		if (!parent) return;

		let resizeTimeout: any;

		const resizeCanvas = () => {
			const rect = parent.getBoundingClientRect();
			if (canvas.width !== rect.width || canvas.height !== rect.height) {
				canvas.width = rect.width;
				canvas.height = rect.height;
			}
		};

		const handleResize = () => {
			clearTimeout(resizeTimeout);
			resizeTimeout = setTimeout(resizeCanvas, 100);
		};

		const ro = new ResizeObserver(handleResize);
		ro.observe(parent);
		resizeCanvas();
		parent.addEventListener('click', handleClick);

		const ctx = canvas.getContext('2d');
		if (!ctx) {
			return () => {
				ro.disconnect();
				parent.removeEventListener('click', handleClick);
				clearTimeout(resizeTimeout);
			};
		}

		const draw = (timestamp: number) => {
			if (!startTime) {
				startTime = timestamp;
			}
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			sparks = sparks.filter((spark) => {
				const elapsed = timestamp - spark.startTime;
				if (elapsed >= duration) {
					return false;
				}

				const progress = elapsed / duration;
				const eased = easeFunc(progress);

				const distance = eased * sparkRadius * extraScale;
				const lineLength = sparkSize * (1 - eased);

				const x1 = spark.x + distance * Math.cos(spark.angle);
				const y1 = spark.y + distance * Math.sin(spark.angle);
				const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
				const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

				ctx.strokeStyle = sparkColor;
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.moveTo(x1, y1);
				ctx.lineTo(x2, y2);
				ctx.stroke();

				return true;
			});

			animationId = requestAnimationFrame(draw);
		};

		animationId = requestAnimationFrame(draw);

		return () => {
			ro.disconnect();
			parent.removeEventListener('click', handleClick);
			clearTimeout(resizeTimeout);
			cancelAnimationFrame(animationId);
		};
	});

	function handleClick(e: MouseEvent) {
		const canvas = canvasRef;
		if (!canvas) return;
		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		const now = performance.now();
		const newSparks = Array.from({ length: sparkCount }, (_, i) => ({
			x,
			y,
			angle: (2 * Math.PI * i) / sparkCount,
			startTime: now
		}));

		sparks.push(...newSparks);
	}
</script>

<div
	class="click-spark-container {className}"
	style="position: relative; width: 100%; height: 100%;"
	{...restProps}
>
	<canvas
		bind:this={canvasRef}
		style="width: 100%; height: 100%; display: block; user-select: none; position: absolute; top: 0; left: 0; pointer-events: none; z-index: 50;"
	></canvas>
	{@render children?.()}
</div>
