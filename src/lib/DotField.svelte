<script lang="ts">
	import { onMount } from 'svelte';

	let {
		dotRadius = 1.5,
		dotSpacing = 14,
		cursorRadius = 120,
		cursorForce = 0.1,
		bulgeOnly = true,
		bulgeStrength = 30,
		glowRadius = 160,
		sparkle = false,
		waveAmplitude = 0,
		gradientFrom = 'rgba(120, 101, 217, 0.25)',
		gradientTo = 'rgba(110, 108, 122, 0.12)',
		glowColor = '#7865d9',
		class: className = '',
		...restProps
	} = $props<{
		dotRadius?: number;
		dotSpacing?: number;
		cursorRadius?: number;
		cursorForce?: number;
		bulgeOnly?: boolean;
		bulgeStrength?: number;
		glowRadius?: number;
		sparkle?: boolean;
		waveAmplitude?: number;
		gradientFrom?: string;
		gradientTo?: string;
		glowColor?: string;
		class?: string;
		[key: string]: any;
	}>();

	const TWO_PI = Math.PI * 2;

	let canvasRef = $state<HTMLCanvasElement | null>(null);

	let dots: any[] = [];
	let mouse = { x: -9999, y: -9999, prevX: -9999, prevY: -9999, speed: 0 };
	let raf: number;
	let size = { w: 0, h: 0, offsetX: 0, offsetY: 0 };
	let engagement = 0;
	let frameCount = 0;

	$effect(() => {
		if (canvasRef && size.w > 0 && size.h > 0) {
			buildDots(size.w, size.h);
		}
	});

	function buildDots(w: number, h: number) {
		const step = dotRadius + dotSpacing;
		const cols = Math.floor(w / step);
		const rows = Math.floor(h / step);
		const padX = (w % step) / 2;
		const padY = (h % step) / 2;
		const newDots = new Array(rows * cols);
		let idx = 0;

		for (let row = 0; row < rows; row++) {
			for (let col = 0; col < cols; col++) {
				const ax = padX + col * step + step / 2;
				const ay = padY + row * step + step / 2;
				newDots[idx++] = { ax, ay, sx: ax, sy: ay, vx: 0, vy: 0, x: ax, y: ay };
			}
		}
		dots = newDots;
	}

	onMount(() => {
		const canvas = canvasRef;
		if (!canvas) return;

		const ctx = canvas.getContext('2d', { alpha: true });
		if (!ctx) return;

		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		let resizeTimer: any;

		function resize() {
			clearTimeout(resizeTimer);
			resizeTimer = setTimeout(doResize, 100);
		}

		function doResize() {
			if (!canvas || !ctx) return;
			const parent = canvas.parentElement;
			if (!parent) return;
			const rect = parent.getBoundingClientRect();
			const w = rect.width;
			const h = rect.height;

			canvas.width = w * dpr;
			canvas.height = h * dpr;
			canvas.style.width = `${w}px`;
			canvas.style.height = `${h}px`;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

			size = {
				w,
				h,
				offsetX: rect.left + window.scrollX,
				offsetY: rect.top + window.scrollY
			};

			buildDots(w, h);
		}

		function onMouseMove(e: MouseEvent) {
			mouse.x = e.pageX - size.offsetX;
			mouse.y = e.pageY - size.offsetY;
		}

		function updateMouseSpeed() {
			const dx = mouse.prevX - mouse.x;
			const dy = mouse.prevY - mouse.y;
			const dist = Math.sqrt(dx * dx + dy * dy);
			mouse.speed += (dist - mouse.speed) * 0.5;
			if (mouse.speed < 0.001) mouse.speed = 0;
			mouse.prevX = mouse.x;
			mouse.prevY = mouse.y;
		}

		const speedInterval = setInterval(updateMouseSpeed, 20);

		function tick() {
			if (!canvas || !ctx) return;
			frameCount++;
			const { w, h } = size;
			const len = dots.length;
			const t = frameCount * 0.02;

			const mouseActive = mouse.x > -9000 && mouse.y > -9000;

			const targetEngagement = mouseActive ? Math.min(0.2 + mouse.speed / 4, 1) : 0;
			engagement += (targetEngagement - engagement) * 0.06;
			if (engagement < 0.001) engagement = 0;

			ctx.clearRect(0, 0, w, h);

			const grad = ctx.createLinearGradient(0, 0, w, h);
			grad.addColorStop(0, gradientFrom);
			grad.addColorStop(1, gradientTo);
			ctx.fillStyle = grad;

			const crSq = cursorRadius * cursorRadius;
			const rad = dotRadius / 2;

			ctx.beginPath();

			for (let i = 0; i < len; i++) {
				const d = dots[i];
				const dx = mouse.x - d.ax;
				const dy = mouse.y - d.ay;
				const distSq = dx * dx + dy * dy;

				if (distSq < crSq && mouseActive) {
					const dist = Math.sqrt(distSq);
					if (bulgeOnly) {
						const factor = 1 - dist / cursorRadius;
						const push = factor * factor * bulgeStrength;
						const angle = Math.atan2(dy, dx);
						d.sx += (d.ax - Math.cos(angle) * push - d.sx) * 0.15;
						d.sy += (d.ay - Math.sin(angle) * push - d.sy) * 0.15;
					} else {
						const angle = Math.atan2(dy, dx);
						const move = (500 / dist) * (mouse.speed * cursorForce);
						d.vx += Math.cos(angle) * -move;
						d.vy += Math.sin(angle) * -move;
					}
				} else if (bulgeOnly) {
					d.sx += (d.ax - d.sx) * 0.1;
					d.sy += (d.ay - d.sy) * 0.1;
				}

				if (!bulgeOnly) {
					d.vx *= 0.9;
					d.vy *= 0.9;
					d.x = d.ax + d.vx;
					d.y = d.ay + d.vy;
					d.sx += (d.x - d.sx) * 0.1;
					d.sy += (d.y - d.sy) * 0.1;
				}

				let drawX = d.sx;
				let drawY = d.sy;
				if (waveAmplitude > 0) {
					drawY += Math.sin(d.ax * 0.03 + t) * waveAmplitude;
					drawX += Math.cos(d.ay * 0.03 + t * 0.7) * waveAmplitude * 0.5;
				}

				if (sparkle) {
					const hash = ((i * 2654435761) ^ (frameCount >> 3)) >>> 0;
					if (hash % 100 < 3) {
						ctx.moveTo(drawX + rad * 1.8, drawY);
						ctx.arc(drawX, drawY, rad * 1.8, 0, TWO_PI);
					} else {
						ctx.moveTo(drawX + rad, drawY);
						ctx.arc(drawX, drawY, rad, 0, TWO_PI);
					}
				} else {
					ctx.moveTo(drawX + rad, drawY);
					ctx.arc(drawX, drawY, rad, 0, TWO_PI);
				}
			}

			ctx.fill();

			raf = requestAnimationFrame(tick);
		}

		doResize();
		window.addEventListener('resize', resize);
		window.addEventListener('mousemove', onMouseMove, { passive: true });
		raf = requestAnimationFrame(tick);

		return () => {
			cancelAnimationFrame(raf);
			clearInterval(speedInterval);
			clearTimeout(resizeTimer);
			window.removeEventListener('resize', resize);
			window.removeEventListener('mousemove', onMouseMove);
		};
	});
</script>

<div class="dot-field-container {className}" {...restProps}>
	<canvas bind:this={canvasRef} style="position: absolute; inset: 0; width: 100%; height: 100%;"
	></canvas>
</div>

<style>
	.dot-field-container {
		position: relative;
		width: 100%;
		height: 100%;
	}
</style>
