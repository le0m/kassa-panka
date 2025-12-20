<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import SceneSoundCard from './SceneSoundCard.svelte';
	import type { SceneSoundWithTags, SceneWithSoundsFull, SoundWithTags } from '$lib/server/db';

	interface Props {
		scene: SceneWithSoundsFull;
		deleting: string | null;
		ondelete: (id: string, name: string) => void;
		onedit: (scene: SceneWithSoundsFull) => void;
		updateSuccess?: boolean;
		updateError?: boolean;
	}

	let {
		scene,
		deleting,
		ondelete,
		onedit,
		updateSuccess = false,
		updateError = false
	}: Props = $props();

	let draggingSceneSound: SceneSoundWithTags | null = $state(null);
	let draggingNewSound: SoundWithTags | null = $state(null); // sound data when dragging from sidebar
	let dragOverIndex: number | null = $state(null);
	let optimisticOrder: SceneSoundWithTags[] | null = $state(null);
	let savingSound: string | null = $state(null); // ID of sound being saved via API
	let saveSuccess: boolean = $state(false);
	let saveError: boolean = $state(false);
	let removingSound: string | null = $state(null); // ID of sound being removed

	// Computed: reordered sounds for display during drag or optimistic update
	let displaySounds = $derived.by(() => {
		// If we have an optimistic order (after drop, before API response), use it
		if (optimisticOrder) {
			return optimisticOrder;
		}

		const sorted = [...scene.sceneSounds].sort((a, b) => a.position - b.position);

		// If dragging an existing sound, show live reordering preview
		if (draggingSceneSound && dragOverIndex !== null) {
			const draggedIndex = sorted.findIndex((s) => s.id === draggingSceneSound!.id);
			if (draggedIndex !== -1 && draggedIndex !== dragOverIndex) {
				const reordered = [...sorted];
				const [removed] = reordered.splice(draggedIndex, 1);
				reordered.splice(dragOverIndex, 0, removed);
				return reordered;
			}
		}

		// If dragging a new sound from sidebar, show placeholder with sound data
		if (draggingNewSound && dragOverIndex !== null) {
			const reordered = [...sorted];
			// Insert a placeholder at the dragOverIndex with full sound data
			reordered.splice(dragOverIndex, 0, {
				id: 'placeholder',
				sceneId: scene.id,
				soundId: draggingNewSound.id,
				position: dragOverIndex,
				sound: draggingNewSound
			} as SceneSoundWithTags);
			return reordered;
		}

		return sorted;
	});

	/**
	 * Handles the delete button click
	 */
	function handleDeleteClick() {
		ondelete(scene.id, scene.name);
	}

	/**
	 * Handles the edit button click
	 */
	function handleEditClick() {
		onedit(scene);
	}

	/**
	 * Handles drag over event for the sounds list container
	 * @param event - The drag event
	 */
	function handleListDragOver(event: DragEvent) {
		event.preventDefault();
		// Don't set dragOverIndex here - let individual cards handle it
	}

	/**
	 * Handles drag leave event for the sounds list container
	 * Clears the placeholder when drag leaves the list area
	 * @param event - The drag event
	 */
	function handleListDragLeave(event: DragEvent) {
		const target = event.currentTarget as HTMLElement;
		const relatedTarget = event.relatedTarget as Node | null;

		// Only clear if we're truly leaving the container (not moving to a child element)
		if (!relatedTarget || !target.contains(relatedTarget)) {
			draggingNewSound = null;
			dragOverIndex = null;
		}
	}

	/**
	 * Handles drop event on the empty list area (when there are no sounds yet)
	 * @param event - The drag event
	 */
	async function handleEmptyListDrop(event: DragEvent) {
		event.preventDefault();

		if (!event.dataTransfer) return;

		try {
			const data = JSON.parse(event.dataTransfer.getData('application/json'));

			// Check if it's a new sound from sidebar (has soundId and sound data)
			if (data.soundId && !data.sceneSoundId && data.sound) {
				// Create optimistic entry for new sound
				const optimisticId = `optimistic-${Date.now()}`;
				const optimisticSceneSound: SceneSoundWithTags = {
					id: optimisticId,
					sceneId: scene.id,
					soundId: data.soundId,
					position: 0,
					sound: data.sound
				};

				// Set optimistic order and clear drag state
				optimisticOrder = [optimisticSceneSound];
				draggingNewSound = null;
				dragOverIndex = null;
				savingSound = optimisticId;

				// Make API call
				try {
					await addSoundToScene(data.soundId, 0);
					// Show success state
					saveSuccess = true;
					setTimeout(() => {
						saveSuccess = false;
					}, 1000);
				} catch (error) {
					// Revert optimistic update on error
					optimisticOrder = null;
					// Show error state
					saveError = true;
					throw error;
				} finally {
					// Clear optimistic order and saving state after server confirms
					optimisticOrder = null;
					savingSound = null;
				}
			}
		} catch (error) {
			console.error('Error processing drop:', error);
			draggingNewSound = null;
			dragOverIndex = null;
		}
	}

	/**
	 * Adds a sound to the scene at the specified position
	 * @param soundId - The ID of the sound to add
	 * @param position - The position to insert the sound at
	 */
	async function addSoundToScene(soundId: string, position: number) {
		try {
			const response = await fetch(`/api/scenes/${scene.id}/sounds`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ soundId, position })
			});

			const result = await response.json();

			if (!response.ok) {
				alert(result.error || 'Failed to link sound to scene');
				return;
			}

			// Refresh the data to show the new link
			await invalidateAll();
		} catch (error) {
			console.error('Error linking sound to scene:', error);
			alert('Failed to link sound to scene');
		}
	}

	/**
	 * Handles removing a sound from the scene
	 * @param sceneSound - The scene-sound relation to remove
	 */
	async function handleRemoveSound(sceneSound: SceneSoundWithTags) {
		const confirmed = confirm(
			`Remove "${sceneSound.sound!.name}" from "${scene.name}"?\n\nThis will not delete the sound, only remove it from this scene.`
		);

		if (!confirmed) return;

		removingSound = sceneSound.id;
		saveError = false;

		try {
			const response = await fetch(`/api/scenes/${scene.id}/sounds?sceneSoundId=${sceneSound.id}`, {
				method: 'DELETE'
			});

			const result = await response.json();

			if (!response.ok) {
				saveError = true;
				console.error('Failed to remove sound:', result.error);
				return;
			}

			// Show success state
			saveSuccess = true;
			setTimeout(() => {
				saveSuccess = false;
			}, 1000);

			// Refresh the data to remove the link
			await invalidateAll();
		} catch (error) {
			console.error('Error removing sound from scene:', error);
			saveError = true;
		} finally {
			removingSound = null;
		}
	}

	/**
	 * Handles drag start for reordering scene sounds
	 * @param event - The drag event
	 * @param sceneSound - The scene sound being dragged
	 */
	function handleSoundDragStart(event: DragEvent, sceneSound: SceneSoundWithTags) {
		draggingSceneSound = sceneSound;
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
			event.dataTransfer.setData(
				'application/json',
				JSON.stringify({ sceneSoundId: sceneSound.id })
			);
		}
	}

	/**
	 * Handles drag end for reordering scene sounds
	 */
	function handleSoundDragEnd() {
		draggingSceneSound = null;
		dragOverIndex = null;
	}

	/**
	 * Handles drag over event for reordering - determines drop position
	 * @param event - The drag event
	 * @param index - The index being hovered over
	 */
	function handleSoundDragOver(event: DragEvent, index: number) {
		event.preventDefault();
		event.stopPropagation();

		if (!event.dataTransfer) return;

		// Check what kind of drag this is
		const dataTypes = event.dataTransfer.types;

		// Try to parse the data to determine if it's a new sound or reorder
		try {
			const jsonData = event.dataTransfer.getData('application/json');
			if (jsonData) {
				const data = JSON.parse(jsonData);

				if (data.sceneSoundId) {
					// Reordering existing sound
					if (!draggingSceneSound) return;
					event.dataTransfer.dropEffect = 'move';
				} else if (data.soundId && data.sound) {
					// New sound from sidebar - store full sound data
					draggingNewSound = data.sound;
					event.dataTransfer.dropEffect = 'copy';
				}
			}
		} catch (e) {
			// getData might not work during dragover in some browsers
			// In that case, check if we already know what's being dragged
			if (draggingSceneSound) {
				event.dataTransfer.dropEffect = 'move';
			} else if (dataTypes.includes('application/json')) {
				// Assume it's a new sound from sidebar
				event.dataTransfer.dropEffect = 'copy';
			}
		}

		dragOverIndex = index;
	}

	/**
	 * Handles drop event for reordering or adding - updates positions
	 * @param event - The drag event
	 * @param targetIndex - The index where the sound was dropped
	 */
	async function handleSoundDrop(event: DragEvent, targetIndex: number) {
		event.preventDefault();
		event.stopPropagation();

		if (!event.dataTransfer) return;

		try {
			const data = JSON.parse(event.dataTransfer.getData('application/json'));

			// Check if it's a new sound from sidebar
			if (data.soundId && !data.sceneSoundId && data.sound) {
				// Create optimistic entry for new sound
				const sortedSounds = [...scene.sceneSounds].sort((a, b) => a.position - b.position);
				const newSoundsOrder = [...sortedSounds];

				// Insert new sound at target position
				const optimisticId = `optimistic-${Date.now()}`;
				const optimisticSceneSound: SceneSoundWithTags = {
					id: optimisticId,
					sceneId: scene.id,
					soundId: data.soundId,
					position: targetIndex,
					sound: data.sound
				};
				newSoundsOrder.splice(targetIndex, 0, optimisticSceneSound);

				// Update positions for all sounds after insertion
				for (let i = 0; i < newSoundsOrder.length; i++) {
					newSoundsOrder[i] = { ...newSoundsOrder[i], position: i };
				}

				// Set optimistic order and clear drag state
				optimisticOrder = newSoundsOrder;
				draggingNewSound = null;
				dragOverIndex = null;
				savingSound = optimisticId;

				// Make API call
				try {
					await addSoundToScene(data.soundId, targetIndex);
					// Show success state
					saveSuccess = true;
					setTimeout(() => {
						saveSuccess = false;
					}, 1000);
				} catch (error) {
					// Revert optimistic update on error
					optimisticOrder = null;
					// Show error state
					saveError = true;
					throw error;
				} finally {
					// Clear optimistic order and saving state after server confirms
					optimisticOrder = null;
					savingSound = null;
				}
				return;
			}

			// Otherwise, handle reordering existing sounds
			if (!draggingSceneSound) return;

			const sorted = [...scene.sceneSounds].sort((a, b) => a.position - b.position);
			const draggedIndex = sorted.findIndex((s) => s.id === draggingSceneSound!.id);

			if (draggedIndex === -1 || draggedIndex === targetIndex) {
				draggingSceneSound = null;
				dragOverIndex = null;
				return;
			}

			// Create new array with reordered sounds
			const newOrder = [...sorted];
			const [removed] = newOrder.splice(draggedIndex, 1);
			newOrder.splice(targetIndex, 0, removed);

			// Optimistically update the UI immediately
			optimisticOrder = newOrder;
			const movedSoundId = draggingSceneSound.id;
			draggingSceneSound = null;
			dragOverIndex = null;
			savingSound = movedSoundId;

			// Update positions (0-indexed)
			const soundsToUpdate = newOrder.map((sound, index) => ({
				id: sound.id,
				position: index
			}));

			const response = await fetch(`/api/scenes/${scene.id}/sounds`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sounds: soundsToUpdate })
			});

			const result = await response.json();

			if (!response.ok) {
				alert(result.error || 'Failed to reorder sounds');
				// Revert optimistic update on error
				optimisticOrder = null;
				savingSound = null;
				// Show error state
				saveError = true;
				return;
			}

			// Show success state
			saveSuccess = true;
			setTimeout(() => {
				saveSuccess = false;
			}, 1000);

			// Refresh the data to show the new order from server
			await invalidateAll();
			// Clear optimistic order and saving state after server confirms
			optimisticOrder = null;
			savingSound = null;
		} catch (error) {
			console.error('Error handling drop:', error);
			alert('Failed to update scene');
			// Revert optimistic update on error
			optimisticOrder = null;
			draggingSceneSound = null;
			draggingNewSound = null;
			dragOverIndex = null;
		}
	}
</script>

<div
	class="rounded-lg border border-slate-700 bg-slate-800/50 p-4 transition-all hover:border-indigo-500/50 hover:bg-slate-800"
>
	<div class="flex items-start justify-between">
		<div class="flex-1">
			<div class="flex items-center gap-2">
				<h3 class="text-lg font-semibold text-slate-100">{scene.name}</h3>
				{#if saveError || updateError}
					<!-- Error X icon -->
					<svg class="h-4 w-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						></path>
					</svg>
				{:else if savingSound || removingSound}
					<!-- Loading spinner -->
					<svg
						class="h-4 w-4 animate-spin text-indigo-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
						></path>
					</svg>
				{:else if saveSuccess || updateSuccess}
					<!-- Success floppy disk icon -->
					<svg
						class="h-4 w-4 text-emerald-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4z"
						></path>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M7 3v4h8V3M7 21v-6h10v6"
						></path>
					</svg>
				{/if}
			</div>
			{#if scene.description}
				<p class="mt-1 text-sm text-slate-400">{scene.description}</p>
			{/if}
		</div>
		<div class="flex gap-1">
			<button
				onclick={handleEditClick}
				class="rounded p-1 text-indigo-400 transition-colors hover:bg-slate-700 hover:text-indigo-300"
				aria-label="Edit scene"
				title="Edit scene"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
					></path>
				</svg>
			</button>
			<button
				onclick={handleDeleteClick}
				disabled={deleting === scene.id}
				class="ml-2 rounded p-1 text-rose-400 transition-colors hover:bg-slate-700 hover:text-rose-300 disabled:cursor-not-allowed disabled:text-slate-600"
				aria-label="Delete scene"
				title="Delete scene"
			>
				{#if deleting === scene.id}
					<svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
				{:else}
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
						></path>
					</svg>
				{/if}
			</button>
		</div>
	</div>

	<!-- Linked Sounds List -->
	{#if displaySounds.length > 0 || draggingNewSound}
		<div class="mt-4">
			<h4 class="mb-2 text-xs font-medium tracking-wider text-slate-400 uppercase">
				Linked Sounds ({scene.sceneSounds.length})
			</h4>
			<div
				role="group"
				class="grid grid-cols-5 gap-2"
				ondragover={handleListDragOver}
				ondragleave={handleListDragLeave}
			>
				{#if displaySounds.length === 0 && draggingNewSound}
					<!-- Empty list drop zone when dragging new sound -->
					<div
						role="button"
						tabindex="-1"
						ondragover={(e) => handleSoundDragOver(e, 0)}
						ondrop={handleEmptyListDrop}
						class="col-span-5 flex min-h-24 items-center justify-center rounded-lg border-2 border-dashed border-indigo-500 bg-indigo-900/20 transition-colors"
					>
						<span class="text-sm font-medium text-indigo-400">Drop sound here</span>
					</div>
				{:else}
					{#each displaySounds as sceneSound, index (sceneSound.id)}
						<div
							role="button"
							tabindex="-1"
							ondragover={(e) => handleSoundDragOver(e, index)}
							ondrop={(e) => handleSoundDrop(e, index)}
						>
							{#if sceneSound.id === 'placeholder'}
								<!-- Placeholder for new sound being dragged -->
								<div
									class="rounded-lg border-2 border-dashed border-indigo-500 bg-indigo-900/20 p-4 opacity-50"
								>
									<div class="mb-2 flex items-center justify-center">
										<svg
											class="h-8 w-8 text-indigo-400"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M12 4v16m8-8H4"
											></path>
										</svg>
									</div>
									<p class="text-center text-xs text-indigo-400">Add sound</p>
								</div>
							{:else}
								<SceneSoundCard
									{sceneSound}
									ondelete={handleRemoveSound}
									draggable={true}
									ondragstart={handleSoundDragStart}
									ondragend={handleSoundDragEnd}
									isDragging={draggingSceneSound?.id === sceneSound.id}
									isSaving={savingSound === sceneSound.id}
								/>
							{/if}
						</div>
					{/each}
				{/if}
			</div>
		</div>
	{:else}
		<!-- Empty state with drop target -->
		<div class="mt-4">
			<h4 class="mb-2 text-xs font-medium tracking-wider text-slate-400 uppercase">
				Linked Sounds (0)
			</h4>
			<div
				role="button"
				tabindex="0"
				ondragover={(e) => {
					e.preventDefault();
					if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
				}}
				ondrop={handleEmptyListDrop}
				class="flex min-h-24 items-center justify-center rounded-lg border-2 border-dashed border-slate-600 bg-slate-800 transition-colors hover:border-indigo-500/50 hover:bg-slate-800"
			>
				<div class="flex items-center gap-2 text-slate-500">
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
						></path>
					</svg>
					<span class="text-sm font-medium">Drop sounds here</span>
				</div>
			</div>
		</div>
	{/if}
</div>
