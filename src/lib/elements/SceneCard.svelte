<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import SceneSoundCard from './SceneSoundCard.svelte';
	import IconEdit from './icons/IconEdit.svelte';
	import IconPlus from './icons/IconPlus.svelte';
	import IconSave from './icons/IconSave.svelte';
	import IconSpinner from './icons/IconSpinner.svelte';
	import IconTrash from './icons/IconTrash.svelte';
	import IconUpload from './icons/IconUpload.svelte';
	import IconX from './icons/IconX.svelte';
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
	class="m-4 flex flex-col gap-4 rounded-lg border border-slate-700 bg-slate-800/50 p-4 transition-all hover:border-indigo-500/50 hover:bg-slate-800"
>
	<div class="flex flex-col gap-2">
		<!-- Header -->
		<div class="flex">
			<div class="flex flex-1 gap-2">
				<h3 class="text-lg font-semibold text-slate-100">{scene.name}</h3>
				{#if saveError || updateError}
					<!-- Error X icon -->
					<IconX class="h-4 w-4 text-rose-400" />
				{:else if savingSound || removingSound}
					<!-- Loading spinner -->
					<IconSpinner class="h-4 w-4 animate-spin text-indigo-400" />
				{:else if saveSuccess || updateSuccess}
					<!-- Success floppy disk icon -->
					<IconSave class="h-4 w-4 text-emerald-400" />
				{/if}
			</div>

			<div class="flex gap-2">
				<button
					onclick={handleEditClick}
					class="rounded p-1 text-indigo-400 transition-colors hover:bg-slate-700 hover:text-indigo-300"
					aria-label="Edit scene"
					title="Edit scene"
				>
					<IconEdit />
				</button>
				<button
					onclick={handleDeleteClick}
					disabled={deleting === scene.id}
					class="ml-2 rounded p-1 text-rose-400 transition-colors hover:bg-slate-700 hover:text-rose-300 disabled:cursor-not-allowed disabled:text-slate-600"
					aria-label="Delete scene"
					title="Delete scene"
				>
					{#if deleting === scene.id}
						<IconSpinner />
					{:else}
						<IconTrash />
					{/if}
				</button>
			</div>
		</div>

		<!-- Description -->
		{#if scene.description}
			<p class="mt-1 text-sm text-slate-400">{scene.description}</p>
		{/if}
	</div>

	<!-- Linked Sounds List -->
	<div class="flex flex-col">
		<h4 class="mb-2 text-xs font-medium tracking-wider text-slate-400 uppercase">
			Linked Sounds ({scene.sceneSounds.length})
		</h4>

		<div
			role="group"
			class="grid grid-cols-4 gap-2"
			ondragover={handleListDragOver}
			ondragleave={handleListDragLeave}
		>
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
							<div class="flex items-center justify-center">
								<IconPlus class="h-8 w-8 text-indigo-400" />
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
			{:else}
				<!-- Empty list drop zone when dragging new sound -->
				<div
					role="button"
					tabindex="-1"
					ondragover={(e) => handleSoundDragOver(e, 0)}
					ondrop={handleEmptyListDrop}
					class="col-span-5 flex min-h-24 items-center justify-center rounded-lg border-2 border-dashed border-slate-600 bg-slate-800 transition-colors hover:border-indigo-500/50 hover:bg-slate-800"
				>
					<span class="text-sm font-medium text-slate-500">Drop sound here</span>
				</div>
			{/each}
		</div>
	</div>
</div>
