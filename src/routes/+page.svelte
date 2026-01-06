<script lang="ts">
	import { setContext } from 'svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';
	import type { SceneFull } from '$lib/server/db';
	import Sidebar from '$lib/elements/Sidebar.svelte';
	import Scenes from '$lib/elements/Scenes.svelte';
	import Mixer from '$lib/elements/Mixer.svelte';
	import { logger } from '$lib/logger';

	let { data }: { data: PageData } = $props();

	let admin = $derived(data.admin);
	setContext('admin', () => admin);
	setContext('invalidate', () => invalidateAll());
	let activeScene = $state<SceneFull | undefined>(undefined);

	/**
	 * Handles search when triggered from Sidebar
	 * @param query - The search query string
	 */
	const handleFilter = async ({
		search,
		category,
		genre
	}: {
		search: string;
		category: string;
		genre: string;
	}) => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const params = new URLSearchParams(window.location.search);

		if (search.trim()) {
			params.set('q', search.trim());
		} else {
			params.delete('q');
		}

		if (category.trim()) {
			params.set('cat', category.trim());
		} else {
			params.delete('cat');
		}

		if (genre.trim()) {
			params.set('gen', genre.trim());
		} else {
			params.delete('gen');
		}

		const queryString = params.toString();
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		await goto(queryString ? `?${queryString}` : '/', {
			replaceState: false,
			invalidateAll: true
		});
	};

	const handleSceneClick = (scene: SceneFull) => (activeScene = scene);

	let indexing = $state(false);
	let progress = $state({ total: 0, current: { success: 0, fail: 0 } });
	let progressValue = $derived(
		progress.total ? 100 * ((progress.current.success + progress.current.fail) / progress.total) : 0
	);
	const handleSearchIndex = async () => {
		if (!admin || indexing) {
			return;
		}

		indexing = true;

		const response = await fetch('/api/search/index');
		const reader = response.body!.pipeThrough(new TextDecoderStream()).getReader();
		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				break;
			}

			// Handle multiple messages in one read, use last
			const messages = value.split('}{');
			let message = messages[messages.length - 1];
			if (messages.length > 1) {
				message = `{${message}`;
			} else {
				message = messages[0];
			}

			try {
				progress = JSON.parse(message) as {
					total: number;
					current: { success: number; fail: number };
				};
			} catch (error) {
				logger.error({ error }, 'Error receiving import update');
			}
		}

		indexing = false;
	};
</script>

<div class="grid h-screen grid-cols-[minmax(200px,30%)_1fr] grid-rows-[1fr_auto]">
	<!-- Sidebar (left, spanning top row only) -->
	<div class="overflow-hidden">
		<Sidebar
			onfilter={handleFilter}
			sounds={data.sounds}
			tags={data.tags}
			categories={data.categories}
			genres={data.genres}
		></Sidebar>
	</div>

	<!-- Main Content (right, spanning top row only) -->
	<main class="flex flex-col overflow-hidden">
		<div class="p-4">
			<header>
				<h1
					class="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-4xl font-bold text-transparent"
				>
					Kassa Panka
				</h1>
				<p class="text-slate-400">Sound effects for your tabletop gaming sessions</p>
				{#if admin}
					<button
						class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-colors hover:bg-indigo-700 hover:shadow-lg"
						disabled={indexing}
						onclick={handleSearchIndex}>index search</button
					>
					<progress class={{ hidden: !indexing }} max="100" value={progressValue}></progress>
					<div>
						<span class="text-xs text-emerald-500/60">Success: {progress.current.success}</span> |
						<span class="text-xs text-rose-500/60">Fail: {progress.current.fail}</span> |
						<span class="text-xs text-sky-500/60">Total: {progress.total}</span>
					</div>
				{/if}
			</header>
		</div>

		<section class="min-h-0 flex-1 overflow-hidden">
			<Scenes scenes={data.scenes} onsceneclick={handleSceneClick} />
		</section>
	</main>

	<!-- Mixer (bottom, spanning both columns) -->
	<div class="col-span-2">
		<Mixer scene={activeScene} />
	</div>
</div>
