<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import type { PageData } from './$types';

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
		uploadError = null;
		uploadSuccess = false;
		selectedTags = [];
		tagInput = '';
		showTagSuggestions = false;
		selectedSuggestionIndex = -1;
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
</script>

<div class="container">
	<header class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="mb-2 text-4xl font-bold">Kassa Panka</h1>
			<p class="text-gray-600">Sound effects for your tabletop gaming sessions</p>
		</div>
		<button
			onclick={openModal}
			class="rounded-md bg-blue-600 px-6 py-3 font-medium text-white shadow-md transition-colors hover:bg-blue-700 hover:shadow-lg"
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
				class="w-full rounded-md border border-gray-300 px-4 py-2 pl-10 focus:ring-2 focus:ring-blue-500 focus:outline-none"
				placeholder="Search sounds by name or tags... (press Enter)"
			/>
			<svg
				class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400"
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

	<!-- Upload Modal -->
	{#if isModalOpen}
		<div
			class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4"
			onclick={closeModal}
			onkeydown={(e) => e.key === 'Escape' && closeModal()}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<div
				class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => e.stopPropagation()}
				role="document"
				tabindex="0"
			>
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-2xl font-semibold">Upload New Sound</h2>
					<button
						onclick={closeModal}
						class="text-2xl leading-none text-gray-400 hover:text-gray-600"
						aria-label="Close modal"
					>
						&times;
					</button>
				</div>

				<form onsubmit={handleUpload} class="space-y-4">
					<div>
						<label for="name" class="mb-1 block text-sm font-medium text-gray-700">
							Sound Name *
						</label>
						<input
							type="text"
							id="name"
							name="name"
							required
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							placeholder="e.g., Thunder Strike"
						/>
					</div>

					<div>
						<label for="description" class="mb-1 block text-sm font-medium text-gray-700">
							Description
						</label>
						<textarea
							id="description"
							name="description"
							rows={3}
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							placeholder="Optional description..."
						></textarea>
					</div>

					<div>
						<label for="file" class="mb-1 block text-sm font-medium text-gray-700">
							Audio File *
						</label>
						<input
							type="file"
							id="file"
							name="file"
							accept="audio/*"
							required
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
						/>
					</div>

					<div>
						<label for="tags" class="mb-1 block text-sm font-medium text-gray-700"> Tags </label>
						<div class="relative">
							<input
								type="text"
								id="tags"
								bind:value={tagInput}
								onkeydown={handleTagInput}
								onfocus={() => (showTagSuggestions = true)}
								onblur={() => setTimeout(() => (showTagSuggestions = false), 200)}
								class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
								placeholder="Type and press Enter to add tags..."
							/>

							{#if showTagSuggestions && filteredTags.length > 0 && tagInput.length >= 3}
								<div
									class="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg"
								>
									{#each filteredTags as tag, index (tag)}
										<button
											type="button"
											class="w-full px-3 py-2 text-left text-sm transition-colors {selectedSuggestionIndex ===
											index
												? 'bg-blue-100'
												: 'hover:bg-gray-100'}"
											onclick={() => addTag(tag)}
										>
											{tag}
										</button>
									{/each}
								</div>
							{/if}
						</div>

						{#if selectedTags.length > 0}
							<div class="mt-2 flex flex-wrap gap-2">
								{#each selectedTags as tag (tag)}
									<span
										class="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
									>
										{tag}
										<button
											type="button"
											onclick={() => removeTag(tag)}
											class="text-blue-600 hover:text-blue-800"
											aria-label="Remove tag"
										>
											×
										</button>
									</span>
								{/each}
							</div>
						{/if}
					</div>

					{#if uploadError}
						<div class="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
							{uploadError}
						</div>
					{/if}

					{#if uploadSuccess}
						<div class="rounded border border-green-200 bg-green-50 px-4 py-3 text-green-700">
							Sound uploaded successfully!
						</div>
					{/if}

					<div class="flex gap-3">
						<button
							type="button"
							onclick={closeModal}
							class="flex-1 rounded-md bg-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-300"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={uploading}
							class="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
						>
							{uploading ? 'Uploading...' : 'Upload'}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- Sound List -->
	<section>
		<h2 class="mb-4 text-2xl font-semibold">Sound Library</h2>

		{#if data.sounds.length === 0}
			<div class="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
				<p class="mb-4 text-gray-500">No sounds yet. Upload your first sound!</p>
				<button
					onclick={openModal}
					class="rounded-md bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
				>
					Upload Sound
				</button>
			</div>
		{:else}
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each data.sounds as sound (sound.id)}
					<div class="rounded-lg bg-white p-4 shadow-md transition-shadow hover:shadow-lg">
						<h3 class="mb-2 text-lg font-semibold">{sound.name}</h3>

						{#if sound.description}
							<p class="mb-3 text-sm text-gray-600">{sound.description}</p>
						{/if}

						{#if sound.tags && sound.tags.length > 0}
							<div class="mb-3 flex flex-wrap gap-1.5">
								{#each sound.tags as tag (tag)}
									<span
										class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs text-blue-800"
									>
										{tag}
									</span>
								{/each}
							</div>
						{/if}

						<audio controls class="mb-2 w-full">
							<source src="{base}/sounds/{sound.fileName}" type={sound.mediaType} />
							Your browser does not support the audio element.
						</audio>

						<div class="mt-2 text-xs text-gray-500">
							<div>Size: {(sound.fileSize / 1024).toFixed(2)} KB</div>
							<div>Added: {new Date(sound.createdAt).toLocaleDateString()}</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}
</style>
