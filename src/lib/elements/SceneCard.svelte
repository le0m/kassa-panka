<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import SceneSoundCard from './SceneSoundCard.svelte';
	import type { SceneSoundWithTags, SceneWithSoundsFull } from '$lib/server/db';

	interface Props {
		scene: SceneWithSoundsFull;
		deleting: string | null;
		ondelete: (id: string, name: string) => void;
		onedit: (scene: SceneWithSoundsFull) => void;
	}

	let { scene, deleting, ondelete, onedit }: Props = $props();

	let isDragOver = $state<boolean>(false);
	let isAddingSound = $state<boolean>(false);
	let draggingSceneSound: SceneSoundWithTags | null = $state(null);
	let dragOverIndex: number | null = $state(null);
	let optimisticOrder: SceneSoundWithTags[] | null = $state(null);

	// Computed: reordered sounds for display during drag or optimistic update
	let displaySounds = $derived.by(() => {
		// If we have an optimistic order (after drop, before API response), use it
		if (optimisticOrder) {
			return optimisticOrder;
		}

		const sorted = [...scene.sceneSounds].sort((a, b) => a.position - b.position);

		// If dragging, show live reordering preview
		if (draggingSceneSound && dragOverIndex !== null) {
			const draggedIndex = sorted.findIndex((s) => s.id === draggingSceneSound!.id);
			if (draggedIndex !== -1 && draggedIndex !== dragOverIndex) {
				const reordered = [...sorted];
				const [removed] = reordered.splice(draggedIndex, 1);
				reordered.splice(dragOverIndex, 0, removed);
				return reordered;
			}
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
	 * Handles drag over event - allows dropping and provides visual feedback
	 * @param event - The drag event
	 */
	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'copy';
		}
		isDragOver = true;
	}

	/**
	 * Handles drag leave event - removes visual feedback
	 */
	function handleDragLeave() {
		isDragOver = false;
	}

	/**
	 * Handles drop event - links the sound to the scene
	 * @param event - The drag event
	 */
	async function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;

		if (!event.dataTransfer) return;

		try {
			const data = JSON.parse(event.dataTransfer.getData('application/json'));
			const { soundId } = data;

			if (!soundId) return;

			isAddingSound = true;

			const response = await fetch(`/api/scenes/${scene.id}/sounds`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ soundId })
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
		} finally {
			isAddingSound = false;
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

		const response = await fetch(`/api/scenes/${scene.id}/sounds?sceneSoundId=${sceneSound.id}`, {
			method: 'DELETE'
		});

		const result = await response.json();

		if (!response.ok) {
			alert(result.error || 'Failed to remove sound from scene');
			return;
		}

		// Refresh the data to remove the link
		await invalidateAll();
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
		if (!draggingSceneSound) return;
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
		dragOverIndex = index;
	}

	/**
	 * Handles drop event for reordering - updates positions
	 * @param event - The drag event
	 * @param targetIndex - The index where the sound was dropped
	 */
	async function handleSoundDrop(event: DragEvent, targetIndex: number) {
		event.preventDefault();
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
		draggingSceneSound = null;
		dragOverIndex = null;

		// Update positions (0-indexed)
		const soundsToUpdate = newOrder.map((sound, index) => ({
			id: sound.id,
			position: index
		}));

		try {
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
				return;
			}

			// Refresh the data to show the new order from server
			await invalidateAll();
			// Clear optimistic order after server confirms
			optimisticOrder = null;
		} catch (error) {
			console.error('Error reordering sounds:', error);
			alert('Failed to reorder sounds');
			// Revert optimistic update on error
			optimisticOrder = null;
		}
	}
</script>

<div
	class="rounded-lg border border-slate-700 bg-slate-800/50 p-4 transition-all hover:border-indigo-500/50 hover:bg-slate-800"
>
	<div class="flex items-start justify-between">
		<div class="flex-1">
			<h3 class="text-lg font-semibold text-slate-100">{scene.name}</h3>
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
	{#if displaySounds.length > 0}
		<div class="mt-4">
			<h4 class="mb-2 text-xs font-medium tracking-wider text-slate-400 uppercase">
				Linked Sounds ({displaySounds.length})
			</h4>
			<div class="grid grid-cols-5 gap-2">
				{#each displaySounds as sceneSound, index (sceneSound.id)}
					<div
						role="button"
						tabindex="-1"
						ondragover={(e) => handleSoundDragOver(e, index)}
						ondrop={(e) => handleSoundDrop(e, index)}
					>
						<SceneSoundCard
							{sceneSound}
							ondelete={handleRemoveSound}
							draggable={true}
							ondragstart={handleSoundDragStart}
							ondragend={handleSoundDragEnd}
							isDragging={draggingSceneSound?.id === sceneSound.id}
						/>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Drop Zone -->
	<div
		role="button"
		tabindex="0"
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		ondrop={handleDrop}
		class="mt-4 flex min-h-24 items-center justify-center rounded-lg border-2 border-dashed transition-colors"
		class:border-slate-600={!isDragOver && !isAddingSound}
		class:bg-slate-800={!isDragOver && !isAddingSound}
		class:border-indigo-500={isDragOver}
		class:bg-indigo-900={isDragOver}
		class:border-emerald-500={isAddingSound}
		class:bg-emerald-900={isAddingSound}
	>
		{#if isAddingSound}
			<div class="flex items-center gap-2 text-emerald-400">
				<svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
				<span class="text-sm font-medium">Linking sound...</span>
			</div>
		{:else}
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
		{/if}
	</div>
</div>
