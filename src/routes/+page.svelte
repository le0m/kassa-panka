<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import Sidebar from '$lib/elements/Sidebar.svelte';
	import Scenes from '$lib/elements/Scenes.svelte';
	import Mixer from '$lib/elements/Mixer.svelte';

	let { data }: { data: PageData } = $props();

	/**
	 * Handles search when triggered from Sidebar
	 * @param query - The search query string
	 */
	async function handleSearch(query: string) {
		const params = new URLSearchParams();
		if (query.trim()) {
			params.set('q', query.trim());
		}
		const queryString = params.toString();
		await goto(queryString ? `?${queryString}` : '/', {
			replaceState: false,
			invalidateAll: true
		});
	}

	/** FUNCTIONALITY CURRENTLY DISABLED */
	let importing = $state(false);
	let perc = $state(0);
	const handleImport = async () => {
		if (importing) {
			return;
		}

		importing = true;

		const response = await fetch('/api/sounds/import');
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
				const progress = JSON.parse(message) as { count: number; total: number };
				perc = (progress.count * 100) / progress.total;
			} catch (e) {
				console.error('Error receiving import update', e);
			}
		}

		importing = false;
	};
</script>

<div class="grid h-screen grid-cols-[minmax(200px,25%)_1fr] grid-rows-[1fr_auto]">
	<!-- Sidebar (left, spanning top row only) -->
	<div class="overflow-hidden">
		<Sidebar onsearch={handleSearch} sounds={data.sounds} tags={data.tags}></Sidebar>
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
				<!-- FUNCTIONALITY CURRENTLY DISABLED -->
				<button disabled={importing} onclick={handleImport}>import</button>
				<progress class={{ hidden: !importing }} max="100" value={perc}></progress>
			</header>
		</div>

		<section class="min-h-0 flex-1 overflow-hidden">
			<Scenes scenes={data.scenes} />
		</section>
	</main>

	<!-- Mixer (bottom, spanning both columns) -->
	<div class="col-span-2">
		<Mixer scene={data.scenes.find((s) => s.sceneSounds.length > 0)} />
	</div>
</div>
