<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { base } from '$app/paths';
	import type { PageData } from './$types';
	import SoundCard from '$lib/elements/SoundCard.svelte';
	import UploadModal from '$lib/elements/UploadModal.svelte';
	import Sidebar from '$lib/elements/Sidebar.svelte';

	let { data }: { data: PageData } = $props();

	let isModalOpen = $state(false);
	let uploading = $state(false);
	let uploadError = $state<string | null>(null);
	let uploadSuccess = $state(false);
	let tagInput = $state('');
	let selectedTags = $state<string[]>([]);
	let availableTags = $state<string[]>([]);
	let showTagSuggestions = $state(false);
	let selectedSuggestionIndex = $state(-1);
	let searchQuery = $state('');
	let deleting = $state<string | null>(null);
	let editSound = $state<{
		id: string;
		name: string;
		description?: string | null;
		tags?: string[];
	} | null>(null);

	/**
	 * Handles search input when Enter is pressed
	 */
	async function handleSearch(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			const params = new URLSearchParams();
			if (searchQuery.trim()) {
				params.set('q', searchQuery.trim());
			}
			const queryString = params.toString();
			await goto(queryString ? `?${queryString}` : '/', {
				replaceState: false,
				invalidateAll: true
			});
		}
	}

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
	 * Loads available tags from the database
	 */
	async function loadTags() {
		try {
			const response = await fetch('/api/tags');
			const result = await response.json();
			if (result.tags) {
				availableTags = result.tags.map((tag: { name: string }) => tag.name);
			}
		} catch (error) {
			console.error('Error loading tags:', error);
		}
	}

	/**
	 * Opens the upload modal
	 */
	function openModal() {
		editSound = null;
		isModalOpen = true;
		uploadError = null;
		uploadSuccess = false;
		selectedTags = [];
		tagInput = '';
		loadTags();
	}

	/**
	 * Closes the upload modal
	 */
	function closeModal() {
		isModalOpen = false;
		editSound = null;
		uploadError = null;
		uploadSuccess = false;
		selectedTags = [];
		tagInput = '';
		showTagSuggestions = false;
		selectedSuggestionIndex = -1;
	}

	/**
	 * Handles editing a sound
	 * @param sound - The sound data to edit
	 */
	function handleEdit(sound: {
		id: string;
		name: string;
		description?: string | null;
		tags?: string[];
	}) {
		editSound = sound;
		isModalOpen = true;
	}

	/**
	 * Adds a tag to the selected tags list
	 */
	function addTag(tag: string) {
		const trimmedTag = tag.trim().toLowerCase();
		if (trimmedTag && !selectedTags.includes(trimmedTag)) {
			selectedTags = [...selectedTags, trimmedTag];
			tagInput = '';
			selectedSuggestionIndex = -1;
		}
	}

	/**
	 * Removes a tag from the selected tags list
	 */
	function removeTag(tag: string) {
		selectedTags = selectedTags.filter((t) => t !== tag);
	}

	/**
	 * Handles tag input keypress with keyboard navigation
	 */
	function handleTagInput(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < filteredTags.length) {
				// Add the selected suggestion
				addTag(filteredTags[selectedSuggestionIndex]);
			} else if (tagInput.trim()) {
				// Add the typed tag
				addTag(tagInput);
			}
		} else if (event.key === 'ArrowDown') {
			event.preventDefault();
			if (filteredTags.length > 0) {
				selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, filteredTags.length - 1);
			}
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			if (selectedSuggestionIndex > 0) {
				selectedSuggestionIndex--;
			} else {
				// Back to input
				selectedSuggestionIndex = -1;
			}
		} else {
			// Reset selection when user types (any other key)
			selectedSuggestionIndex = -1;
		}
	}

	/**
	 * Filtered tag suggestions based on input
	 */
	let filteredTags = $derived(
		availableTags
			.filter(
				(tag) =>
					tag.toLowerCase().includes(tagInput.toLowerCase()) &&
					!selectedTags.includes(tag.toLowerCase())
			)
			.slice(0, 5)
	);

	/**
	 * Handles the form submission for uploading a new sound file
	 */
	async function handleUpload(event: Event) {
		event.preventDefault();
		const form = event.target as HTMLFormElement;
		const formData = new FormData(form);

		// Add tags to form data
		if (selectedTags.length > 0) {
			formData.append('tags', JSON.stringify(selectedTags));
		}

		uploading = true;
		uploadError = null;
		uploadSuccess = false;

		try {
			const response = await fetch('/api/sounds/upload', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (!response.ok) {
				uploadError = result.error || 'Upload failed';
				return;
			}

			uploadSuccess = true;
			form.reset();

			// Refresh the page data to show the new sound
			await invalidateAll();

			// Close modal after successful upload
			setTimeout(() => {
				closeModal();
			}, 500);
		} catch (error) {
			uploadError = 'Network error occurred';
			console.error('Upload error:', error);
		} finally {
			uploading = false;
		}
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

		if (!confirmed) {
			return;
		}

		deleting = soundId;

		try {
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
		} catch (error) {
			console.error('Delete error:', error);
			alert('Network error occurred while deleting sound');
		} finally {
			deleting = null;
		}
	}
</script>

<!-- Upload Modal -->
<UploadModal isOpen={isModalOpen} {editSound} onClose={closeModal} />

<div class="flex h-screen">
	<!-- Sidebar -->
	<Sidebar>
		{#if data.sounds.length === 0}
			<div class="rounded-lg border border-slate-700 bg-slate-800 p-6 text-center">
				<p class="mb-4 text-sm text-slate-400">No sounds yet. Upload your first sound!</p>
				<button
					onclick={openModal}
					class="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white transition-colors hover:bg-indigo-700"
				>
					Upload Sound
				</button>
			</div>
		{:else}
			{#each data.sounds as sound (sound.id)}
				<SoundCard {sound} {deleting} ondelete={handleDelete} onedit={handleEdit} />
			{/each}
		{/if}
	</Sidebar>

	<!-- Main Content -->
	<main class="flex flex-1 flex-col overflow-y-auto">
		<div class="container">
			<header class="mb-8 flex items-center justify-between">
				<div>
					<h1 class="mb-2 text-4xl font-bold text-indigo-400">Kassa Panka</h1>
					<p class="text-slate-400">Sound effects for your tabletop gaming sessions</p>
				</div>
				<button
					onclick={openModal}
					class="rounded-md bg-indigo-600 px-6 py-3 font-medium text-white shadow-md transition-colors hover:bg-indigo-700 hover:shadow-lg"
				>
					Upload Sound
				</button>
			</header>

			<!-- Search -->
			<section class="mb-6">
				<div class="relative">
					<input
						type="text"
						bind:value={searchQuery}
						onkeydown={handleSearch}
						class="w-full rounded-md border border-slate-700 bg-slate-800 px-4 py-2 pl-10 text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
						placeholder="Search sounds by name or tags... (press Enter)"
					/>
					<svg
						class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						></path>
					</svg>
				</div>
			</section>

			<!-- Main content area for future features -->
			<section class="rounded-lg border border-slate-700 bg-slate-800/30 p-8 text-center">
				<p class="text-slate-400">Select a sound from the sidebar to play it</p>
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
