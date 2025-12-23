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
