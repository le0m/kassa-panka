<script lang="ts">
	import { invalidateAll } from '$app/navigation';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
		editSound?: {
			id: string;
			name: string;
			description?: string | null;
			tags?: string[];
		} | null;
	}

	let { isOpen, onClose, editSound = null }: Props = $props();

	let uploading = $state(false);
	let uploadError = $state<string | null>(null);
	let uploadSuccess = $state(false);
	let tagInput = $state('');
	let selectedTags = $state<string[]>([]);
	let availableTags = $state<string[]>([]);
	let showTagSuggestions = $state(false);
	let selectedSuggestionIndex = $state(-1);
	let formName = $state('');
	let formDescription = $state('');

	let isEditMode = $derived(editSound !== null);

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

	/**	 * Handles clicking outside the modal to close it
	 */
	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			handleClose();
		}
	}

	/**	 * Handles the form submission for uploading or updating a sound file
	 */
	async function handleUpload(event: Event) {
		event.preventDefault();
		const form = event.target as HTMLFormElement;

		uploading = true;
		uploadError = null;
		uploadSuccess = false;

		try {
			if (isEditMode && editSound) {
				// Edit mode: send JSON with updated data
				const response = await fetch(`/api/sounds/${editSound.id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						name: formName,
						description: formDescription,
						tags: selectedTags
					})
				});

				const result = await response.json();

				if (!response.ok) {
					uploadError = result.error || 'Update failed';
					return;
				}

				uploadSuccess = true;
			} else {
				// Create mode: send FormData with file
				const formData = new FormData(form);

				// Add tags to form data
				if (selectedTags.length > 0) {
					formData.append('tags', JSON.stringify(selectedTags));
				}

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
			}

			// Refresh the page data
			await invalidateAll();

			// Close modal after successful operation
			setTimeout(() => {
				handleClose();
			}, 500);
		} catch (error) {
			uploadError = 'Network error occurred';
			console.error('Upload/update error:', error);
		} finally {
			uploading = false;
		}
	}

	/**
	 * Handles modal close and resets state
	 */
	function handleClose() {
		uploadError = null;
		uploadSuccess = false;
		selectedTags = [];
		tagInput = '';
		showTagSuggestions = false;
		selectedSuggestionIndex = -1;
		formName = '';
		formDescription = '';
		onClose();
	}

	/**
	 * Load tags and populate form when modal opens
	 */
	$effect(() => {
		if (isOpen) {
			loadTags();

			// Populate form with edit data if in edit mode
			if (editSound) {
				formName = editSound.name;
				formDescription = editSound.description || '';
				selectedTags = editSound.tags || [];
			} else {
				formName = '';
				formDescription = '';
				selectedTags = [];
			}
		}
	});
</script>

{#if isOpen}
	<!-- svelte-ignore a11y_interactive_supports_focus -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
		onclick={handleBackdropClick}
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
	>
		<div class="w-full max-w-md rounded-lg border border-slate-700 bg-slate-800 p-6 shadow-xl">
			<h2 id="modal-title" class="mb-4 text-2xl font-semibold text-slate-100">
				{isEditMode ? 'Edit Sound' : 'Upload New Sound'}
			</h2>

			<form onsubmit={handleUpload} class="space-y-4">
				<div>
					<label for="name" class="mb-1 block text-sm font-medium text-slate-300">
						Sound Name <span class="text-rose-400">*</span>
					</label>
					<input
						type="text"
						id="name"
						name="name"
						bind:value={formName}
						required
						disabled={uploading}
						class="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
						placeholder="Enter sound name"
					/>
				</div>

				<div>
					<label for="description" class="mb-1 block text-sm font-medium text-slate-300">
						Description
					</label>
					<textarea
						id="description"
						name="description"
						bind:value={formDescription}
						disabled={uploading}
						rows={3}
						class="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
						placeholder="Enter description (optional)"
					></textarea>
				</div>

				{#if !isEditMode}
					<div>
						<label for="file" class="mb-1 block text-sm font-medium text-slate-300">
							Audio File <span class="text-rose-400">*</span>
						</label>
						<input
							type="file"
							id="file"
							name="file"
							accept="audio/*"
							required
							disabled={uploading}
							class="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 file:mr-4 file:rounded file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-indigo-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
						/>
					</div>
				{/if}

				<div>
					<label for="tags" class="mb-1 block text-sm font-medium text-slate-300"> Tags </label>
					<div class="relative">
						<input
							type="text"
							id="tags"
							bind:value={tagInput}
							onkeydown={handleTagInput}
							onfocus={() => (showTagSuggestions = true)}
							onblur={() => setTimeout(() => (showTagSuggestions = false), 200)}
							disabled={uploading}
							class="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
							placeholder="Type and press Enter to add tags..."
						/>

						{#if showTagSuggestions && filteredTags.length > 0 && tagInput.length >= 3}
							<div
								class="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-md border border-slate-700 bg-slate-800 shadow-lg"
							>
								{#each filteredTags as tag, index (tag)}
									<button
										type="button"
										class="w-full px-3 py-2 text-left text-sm text-slate-100 transition-colors {selectedSuggestionIndex ===
										index
											? 'bg-indigo-600'
											: 'hover:bg-slate-600'}"
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
									class="inline-flex items-center gap-1 rounded-full border border-cyan-700/50 bg-cyan-900/40 px-3 py-1 text-sm text-cyan-300"
								>
									{tag}
									<button
										type="button"
										onclick={() => removeTag(tag)}
										class="text-cyan-300 hover:text-cyan-100"
										aria-label="Remove tag"
									>
										×
									</button>
								</span>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Error Message -->
				{#if uploadError}
					<div
						class="rounded-md border border-rose-400/50 bg-rose-900/20 p-3 text-sm text-rose-400"
					>
						{uploadError}
					</div>
				{/if}

				<!-- Success Message -->
				{#if uploadSuccess}
					<div
						class="rounded-md border border-emerald-400/50 bg-emerald-900/20 p-3 text-sm text-emerald-400"
					>
						{isEditMode ? 'Sound updated successfully!' : 'Sound uploaded successfully!'}
					</div>
				{/if}

				<!-- Form Actions -->
				<div class="flex justify-end gap-3">
					<button
						type="button"
						onclick={handleClose}
						disabled={uploading}
						class="rounded-md border border-slate-700 px-4 py-2 text-slate-300 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={uploading}
						class="rounded-md bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if uploading}
							{isEditMode ? 'Saving...' : 'Uploading...'}
						{:else}
							{isEditMode ? 'Save Sound' : 'Upload Sound'}
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
