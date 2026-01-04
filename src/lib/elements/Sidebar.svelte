<script lang="ts">
	import { getContext } from 'svelte';
	import { browser } from '$app/environment';
	import SoundCard from '$lib/elements/SoundCard.svelte';
	import UploadModal from '$lib/elements/UploadModal.svelte';
	import type { SoundFull, TagEntity, CategoryEntity, GenreEntity } from '$lib/server/db';

	interface Props {
		sounds: SoundFull[];
		tags: TagEntity[];
		categories: CategoryEntity[];
		genres: GenreEntity[];
		onfilter: ({
			search,
			category,
			genre
		}: {
			search: string;
			category: string;
			genre: string;
		}) => void;
	}

	let { sounds = [], tags = [], categories = [], genres = [], onfilter }: Props = $props();

	let admin = getContext<() => boolean>('admin');
	let searchQuery = $state('');
	let selectedCategoryId = $state<string>(
		browser ? (new URLSearchParams(window.location.search).get('cat') ?? '') : ''
	);
	let selectedGenreId = $state<string>(
		browser ? (new URLSearchParams(window.location.search).get('gen') ?? '') : ''
	);
	let isModalOpen = $state(false);
	let editSound = $state<SoundFull | null>(null);

	let invalidateAll = getContext<() => Promise<void>>('invalidate');

	/**
	 * Initialize search query from URL on mount
	 */
	$effect(() => {
		if (typeof window !== 'undefined') {
			const url = new URL(window.location.href);
			searchQuery = url.searchParams.get('q') || '';
		}
	});

	/**
	 * Opens the upload modal
	 */
	function openModal() {
		editSound = null;
		isModalOpen = true;
	}

	/**
	 * Closes the upload modal
	 */
	function closeModal() {
		isModalOpen = false;
		editSound = null;
	}

	/**
	 * Handles editing a sound
	 * @param sound - The sound data to edit
	 */
	function handleEdit(sound: SoundFull) {
		editSound = sound;
		isModalOpen = true;
	}

	/**
	 * Handles sound deletion with confirmation
	 * @param soundId - The ID of the sound to delete
	 * @param soundName - The name of the sound (for confirmation message)
	 */
	async function handleDelete(soundId: string, soundName: string) {
		const confirmed = confirm(
			`Are you sure you want to delete "${soundName}"?\n\nThis action can be undone by a database administrator.`
		);

		if (!confirmed) return;

		const response = await fetch(`/api/sounds/${soundId}`, {
			method: 'DELETE'
		});

		const result = await response.json();

		if (!response.ok) {
			alert(result.error || 'Failed to delete sound');
			return;
		}

		// Refresh the page data to remove the deleted sound
		await invalidateAll();
	}

	/**
	 * Handles search input changes
	 */
	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		searchQuery = target.value;
	}

	/**
	 * Handles search when Enter is pressed
	 */
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			onfilter({
				search: searchQuery,
				category: selectedCategoryId,
				genre: selectedGenreId
			});
		}
	}

	/**
	 * Handles category and genre when changed.
	 */
	const handleChange = () => {
		onfilter({
			search: searchQuery,
			category: selectedCategoryId,
			genre: selectedGenreId
		});
	};
</script>

<!-- Upload Modal -->
<UploadModal isOpen={isModalOpen} {editSound} onclose={closeModal} {tags} {categories} {genres} />

<!-- Sidebar -->
<aside class="flex h-full flex-col border-r border-slate-700 bg-slate-800/50 backdrop-blur-sm">
	<!-- Header Section -->
	<div class="flex flex-col gap-2 border-b border-slate-700 p-4">
		<div class="flex items-center justify-center">
			<h2 class="flex-1 text-lg font-semibold text-slate-100">Sound Library</h2>

			{#if admin()}
				<!-- Upload Button -->
				<button
					onclick={openModal}
					class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-colors hover:bg-indigo-700 hover:shadow-lg"
				>
					New Sound
				</button>
			{/if}
		</div>

		<!-- Search -->
		<input
			type="text"
			bind:value={searchQuery}
			oninput={handleInput}
			onkeydown={handleKeydown}
			class="rounded-md border border-slate-700 bg-slate-900 text-sm text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
			placeholder="Search sounds..."
		/>

		<div class="flex gap-2">
			<!-- Category Filter -->
			<select
				bind:value={selectedCategoryId}
				onchange={handleChange}
				class="w-full rounded-md border border-slate-700 bg-slate-900 text-sm text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
			>
				<option value="">-- Category --</option>
				{#each categories as category (category.id)}
					<option value={category.id}>{category.name}</option>
				{/each}
			</select>

			<!-- Genre Filter -->
			<select
				bind:value={selectedGenreId}
				onchange={handleChange}
				class="w-full rounded-md border border-slate-700 bg-slate-900 text-sm text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
			>
				<option value="">-- Genre --</option>
				{#each genres as genre (genre.id)}
					<option value={genre.id}>{genre.name}</option>
				{/each}
			</select>
		</div>
	</div>

	<!-- Scrollable Sound List -->
	<div class="min-h-0 flex-1 overflow-y-auto">
		{#if sounds.length === 0}
			<div class="m-4 rounded-lg border border-slate-700 bg-slate-800 p-6 text-center">
				<p class="text-sm text-slate-400">No sounds yet. Upload your first sound!</p>
			</div>
		{:else}
			{#each sounds as sound (sound.id)}
				<SoundCard
					{sound}
					onedit={admin() ? handleEdit : undefined}
					ondelete={admin() ? handleDelete : undefined}
				/>
			{/each}
		{/if}
	</div>
</aside>
