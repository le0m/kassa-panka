<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import Sidebar from '$lib/elements/Sidebar.svelte';
	import Scenes from './Scenes.svelte';

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

<div class="flex h-screen">
	<!-- Sidebar -->
	<Sidebar onsearch={handleSearch} sounds={data.sounds} tags={data.tags}></Sidebar>

	<!-- Main Content -->
	<main class="flex flex-1 flex-col overflow-y-auto">
		<div class="container">
			<header class="mb-8">
				<h1
					class="mb-2 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-4xl font-bold text-transparent"
				>
					Kassa Panka
				</h1>
				<p class="text-slate-400">Sound effects for your tabletop gaming sessions</p>
			</header>

			<!-- Scenes Section -->
			<section>
				<Scenes scenes={data.scenes} />
			</section>
		</div>
	</main>
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}
</style>
