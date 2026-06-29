<script lang="ts">
</script>

<svelte:head>
	<title>Farhan Kurnia Pratama — Linux/Unix, FOSS, and Cybersecurity</title>
	<meta
		name="description"
		content="Security-focused Software Engineer with expertise in Linux/Unix and FOSS, dedicated to building reliable, maintainable, and privacy-centric systems."
	/>
	<meta name="robots" content="noindex, nofollow" />
	<link rel="canonical" href="https://fkp.my.id/" />
	<meta property="og:title" content="Farhan Kurnia Pratama — Linux/Unix, FOSS, and Cybersecurity" />
	<meta
		property="og:description"
		content="Security-focused Software Engineer with expertise in Linux/Unix and FOSS, dedicated to building reliable, maintainable, and privacy-centric systems."
	/>
	<meta property="og:type" content="profile" />
	<meta property="og:url" content="https://fkp.my.id/" />
	<meta property="og:site_name" content="fkp.my.id" />
	<meta property="og:image" content="https://fkp.my.id/hero.png" />
	<meta property="og:image:secure_url" content="https://fkp.my.id/hero.png" />
	<meta property="og:image:type" content="image/png" />
	<meta property="og:image:width" content="1280" />
	<meta property="og:image:height" content="640" />
	<meta
		property="og:image:alt"
		content="Farhan Kurnia Pratama — Security-focused Software Engineer specializing in Linux/Unix, FOSS, and Cybersecurity."
	/>
	<meta property="og:locale" content="en_US" />
	<meta property="og:locale:alternate" content="id_ID" />
	<meta property="profile:first_name" content="Farhan Kurnia" />
	<meta property="profile:last_name" content="Pratama" />
	<meta property="profile:username" content="farhnkrnapratma" />
	<meta property="profile:gender" content="male" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta
		name="twitter:title"
		content="Farhan Kurnia Pratama — Linux/Unix, FOSS, and Cybersecurity"
	/>
	<meta
		name="twitter:description"
		content="Security-focused Software Engineer with expertise in Linux/Unix and FOSS, dedicated to building reliable, maintainable, and privacy-centric systems."
	/>
	<meta name="twitter:image" content="https://fkp.my.id/hero.png" />
	<link
		rel="alternate"
		type="application/rss+xml"
		title="Farhan Kurnia Pratama — Linux/Unix, FOSS, and Cybersecurity"
		href="https://blog.fkp.my.id/rss.xml"
	/>
</svelte:head>

<div class="dev-banner-container">
	<div class="glow-bg"></div>
	<div class="grid-overlay"></div>

	<div class="badge-wrapper" role="status" aria-label="Site status: active development">
		<span class="pulse-dot" aria-hidden="true"></span>
		<span class="badge-text">STATUS: ACTIVE DEVELOPMENT</span>
	</div>

	<main class="content">
		<div class="icon-sphere" aria-hidden="true">
			<span class="material-symbols-outlined code-icon">deployed_code</span>
		</div>

		<h1 class="title">
			Site Under <span class="gradient-text animate-gradient">Development</span>
		</h1>

		<p class="description">
			I'm crafting my new personal space on the web. A place to share my thoughts, projects, and
			everything in between.
		</p>

		<div class="progress-container" role="group" aria-label="Development progress">
			<div
				class="progress-track"
				role="progressbar"
				aria-valuenow={15}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-label="Development progress: 15%"
			>
				<div class="progress-fill"></div>
			</div>
			<div class="progress-labels" aria-hidden="true">
				<span class="label-left">Designing layout &amp; styling components...</span>
				<span class="label-right animate-pulse">15%</span>
			</div>
		</div>

		<div class="tech-stack">
			<span class="tech-tag">Svelte 5</span>
			<span class="tech-divider"></span>
			<span class="tech-tag">Vite</span>
			<span class="tech-divider"></span>
			<span class="tech-tag">Cloudflare Pages</span>
		</div>
	</main>

	<footer class="footer">
		<code>&copy; {new Date().getFullYear()} Farhan Kurnia Pratama</code>
	</footer>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		background: #09090b;
		color: #fafafa;
		font-family:
			'Albert Sans',
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			Roboto,
			Helvetica,
			Arial,
			sans-serif;
		overflow: hidden;
	}

	.dev-banner-container {
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		min-height: 100vh;
		width: 100vw;
		padding: 1.5rem;
		box-sizing: border-box;
		background: radial-gradient(circle at center, #18181b 0%, #09090b 100%);
		overflow: hidden;
	}

	.glow-bg {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: min(500px, 90vw);
		height: min(500px, 90vw);
		background: radial-gradient(
			circle,
			rgba(236, 72, 153, 0.08) 0%,
			rgba(99, 102, 241, 0.05) 50%,
			transparent 100%
		);
		filter: blur(60px);
		pointer-events: none;
		z-index: 1;
		animation: float-glow 10s ease-in-out infinite alternate;
	}

	.grid-overlay {
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
		background-size: 40px 40px;
		background-position: center;
		mask-image: radial-gradient(circle at center, black 40%, transparent 90%);
		pointer-events: none;
		z-index: 0;
	}

	.badge-wrapper {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: rgba(24, 24, 27, 0.8);
		border: 1px solid rgba(255, 255, 255, 0.08);
		padding: 0.5rem 1rem;
		border-radius: 9999px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(8px);
		margin-bottom: 2rem;
		z-index: 2;
		animation: fade-in-down 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	.pulse-dot {
		width: 8px;
		height: 8px;
		background-color: #10b981;
		border-radius: 50%;
		box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
		animation: pulse 1.6s infinite;
	}

	.badge-text {
		font-family: 'Fira Code', monospace;
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.05em;
		color: #a1a1aa;
	}

	.content {
		position: relative;
		text-align: center;
		width: 100%;
		max-width: 580px;
		z-index: 2;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.icon-sphere {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		width: 80px;
		height: 80px;
		border-radius: 50%;
		background: linear-gradient(
			135deg,
			rgba(255, 255, 255, 0.03) 0%,
			rgba(255, 255, 255, 0.08) 100%
		);
		border: 1px solid rgba(255, 255, 255, 0.1);
		margin-bottom: 1.75rem;
		box-shadow:
			0 10px 30px rgba(0, 0, 0, 0.5),
			inset 0 1px 1px rgba(255, 255, 255, 0.2);
		animation: float-slow 4s ease-in-out infinite;
	}

	.code-icon {
		font-size: 32px;
		color: #fafafa;
		animation: pulse-icon 3s ease-in-out infinite alternate;
	}

	.title {
		font-size: clamp(2rem, 8vw, 2.75rem);
		font-weight: 800;
		letter-spacing: -0.03em;
		line-height: 1.15;
		margin: 0 0 1rem 0;
		color: #ffffff;
		animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
		opacity: 0;
	}

	.gradient-text {
		background: linear-gradient(to right, #ec4899, #8b5cf6, #3b82f6);
		background-size: 200% auto;
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		color: transparent;
	}

	.animate-gradient {
		animation: gradient-flow 6s linear infinite;
	}

	.description {
		font-family: 'Libertinus Serif', serif;
		font-style: italic;
		font-size: clamp(1rem, 4vw, 1.125rem);
		line-height: 1.6;
		color: #a1a1aa;
		margin: 0 auto 2rem auto;
		max-width: 480px;
		animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
		opacity: 0;
	}

	.progress-container {
		width: min(300px, 100%);
		margin-bottom: 2.5rem;
		animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards;
		opacity: 0;
	}

	.progress-track {
		position: relative;
		height: 4px;
		width: 100%;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 9999px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		width: 15%;
		background: linear-gradient(90deg, #ec4899, #8b5cf6);
		border-radius: 9999px;
		position: relative;
		overflow: hidden;
	}

	.progress-fill::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
		transform: translateX(-100%);
		animation: sheen 2.5s infinite;
	}

	.progress-labels {
		display: flex;
		justify-content: space-between;
		font-family: 'Fira Code', monospace;
		font-size: 0.65rem;
		color: #71717a;
		margin-top: 0.5rem;
		letter-spacing: -0.01em;
		gap: 1rem;
	}

	.animate-pulse {
		animation: pulse-light 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	.tech-stack {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.75rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.04);
		padding: 0.4rem 1rem;
		border-radius: 99px;
		font-family: 'Fira Code', monospace;
		font-size: 0.7rem;
		color: #71717a;
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
		animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards;
		opacity: 0;
	}

	.tech-tag {
		transition: color 0.2s;
		white-space: nowrap;
	}

	.tech-tag:hover {
		color: #e4e4e7;
	}

	.tech-divider {
		width: 4px;
		height: 4px;
		background: rgba(255, 255, 255, 0.15);
		border-radius: 50%;
	}

	.footer {
		position: absolute;
		bottom: 1.5rem;
		font-size: 0.75rem;
		color: #3f3f46;
		z-index: 2;
		text-align: center;
		padding: 0 1rem;
		animation: fade-in 1.2s ease-out forwards;
	}

	@keyframes pulse {
		0% {
			transform: scale(0.95);
			box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
		}
		70% {
			transform: scale(1);
			box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
		}
		100% {
			transform: scale(0.95);
			box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
		}
	}

	@keyframes float-glow {
		0% {
			transform: translate(-50%, -50%) scale(0.9);
			opacity: 0.7;
		}
		100% {
			transform: translate(-50%, -50%) scale(1.1);
			opacity: 1;
		}
	}

	@keyframes float-slow {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-8px);
		}
	}

	@keyframes pulse-icon {
		0% {
			transform: scale(0.95);
			opacity: 0.8;
		}
		100% {
			transform: scale(1.05);
			opacity: 1;
		}
	}

	@keyframes gradient-flow {
		0% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
		100% {
			background-position: 0% 50%;
		}
	}

	@keyframes sheen {
		100% {
			transform: translateX(100%);
		}
	}

	@keyframes pulse-light {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	@keyframes fade-in-down {
		from {
			opacity: 0;
			transform: translateY(-12px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes fade-in-up {
		from {
			opacity: 0;
			transform: translateY(16px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
