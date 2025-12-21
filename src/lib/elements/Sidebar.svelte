<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import SoundCard from '$lib/elements/SoundCard.svelte';
	import UploadModal from '$lib/elements/UploadModal.svelte';
	import IconSearch from './icons/IconSearch.svelte';
	import type { SoundWithTags, TagEntity } from '$lib/server/db';

	interface Props {
		sounds: SoundWithTags[];
		tags: TagEntity[];
		onsearch: (query: string) => void;
	}

	let { sounds = [], tags = [], onsearch }: Props = $props();

	let searchQuery = $state('');
	let isModalOpen = $state(false);
	let editSound = $state<SoundWithTags | null>(null);

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
	function handleEdit(sound: SoundWithTags) {
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
			onsearch(searchQuery);
		}
	}
</script>

<!-- Upload Modal -->
<UploadModal isOpen={isModalOpen} {editSound} onclose={closeModal} {tags} />

<aside class="flex h-full w-80 flex-col border-r border-slate-700 bg-slate-800/50 backdrop-blur-sm">
	<!-- Fixed Header Section -->
	<div class="border-b border-slate-700 p-4">
		<h2 class="mb-3 text-lg font-semibold text-slate-100">Sound Library</h2>

		<!-- Upload Button -->
		<button
			onclick={openModal}
			class="mb-3 w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-colors hover:bg-indigo-700 hover:shadow-lg"
		>
			Upload Sound
		</button>

		<!-- Search -->
		<div class="relative">
			<input
				type="text"
				bind:value={searchQuery}
				oninput={handleInput}
				onkeydown={handleKeydown}
				class="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 pl-9 text-sm text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
				placeholder="Search sounds..."
			/>
			<IconSearch class="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
			<div class="flex flex-col gap-3">
				{#if sounds.length === 0}
					<div class="rounded-lg border border-slate-700 bg-slate-800 p-6 text-center">
						<p class="mb-4 text-sm text-slate-400">No sounds yet. Upload your first sound!</p>
					</div>
				{:else}
					{#each sounds as sound (sound.id)}
						<SoundCard {sound} onedit={handleEdit} ondelete={handleDelete} />
					{/each}
				{/if}
			</div>
		</div>
	</div>
</aside>
