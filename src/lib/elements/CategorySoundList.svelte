<script lang="ts">
	import { SoundCategory } from '$lib';
	import type { SceneSoundFull, SoundFull } from '$lib/server/db';
	import {
		createDisplayOrder,
		createOptimisticSceneSound,
		getSoundCategory,
		getSceneSoundCategory,
		matchesCategory,
		parseDragData,
		reorderArray
	} from '$lib/drag-and-drop/drag-helpers';
	import SceneSoundCard from './SceneSoundCard.svelte';
	import IconPlus from './icons/IconPlus.svelte';

	interface Props {
		/** Scene ID for creating optimistic scene sounds */
		sceneId: string;
		/** Category name */
		category: SoundCategory;
		/** Display label for the category */
		label: string;
		/** Sounds in this category */
		sounds: SceneSoundFull[];
		/** ID of the scene sound currently being saved */
		savingId: string | null;
		/** Callback when a sound should be removed */
		onremove: (sceneSound: SceneSoundFull) => void;
		/** Callback when a sound should be added at a position */
		onaddsound: (soundId: string, position: number) => Promise<void>;
		/** Callback when sounds should be reordered */
		onreorder: (soundUpdates: Array<{ id: string; position: number }>) => Promise<void>;
	}

	let { sceneId, category, label, sounds, savingId, onremove, onaddsound, onreorder }: Props =
		$props();

	// Local drag state
	let draggingSceneSound = $state<SceneSoundFull | null>(null);
	let draggingNewSound = $state<SoundFull | null>(null);
	let dragOverIndex = $state<number | null>(null);
	let optimisticOrder = $state<SceneSoundFull[] | null>(null);

	// Computed display order considering drag state
	let displaySounds = $derived.by(() =>
		createDisplayOrder(sounds, category, {
			optimisticOrder,
			draggingSceneSound,
			draggingNewSound,
			dragOverIndex
		})
	);

	/**
	 * Clears all drag state
	 */
	function clearDragState() {
		draggingSceneSound = null;
		draggingNewSound = null;
		dragOverIndex = null;
	}

	/**
	 * Handles drag start
	 */
	function handleDragStart(event: DragEvent, sceneSound: SceneSoundFull) {
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
	 * Handles drag end
	 */
	function handleDragEnd() {
		clearDragState();
	}

	/**
	 * Handles drag over on list container
	 */
	function handleListDragOver(event: DragEvent) {
		event.preventDefault();
	}

	/**
	 * Handles drag leave on list container
	 */
	function handleListDragLeave(event: DragEvent) {
		const target = event.currentTarget as HTMLElement;
		const relatedTarget = event.relatedTarget as Node | null;

		if (!relatedTarget || !target.contains(relatedTarget)) {
			draggingNewSound = null;
			dragOverIndex = null;
		}
	}

	/**
	 * Handles drag over on individual sound
	 */
	function handleSoundDragOver(event: DragEvent, index: number) {
		event.preventDefault();
		event.stopPropagation();

		const data = parseDragData(event);
		if (!event.dataTransfer) return;

		if (data) {
			if (data.sceneSoundId) {
				// Reordering existing sound
				if (!draggingSceneSound) return;
				const draggedCategory = getSceneSoundCategory(draggingSceneSound);
				if (!matchesCategory(draggedCategory, category)) {
					event.dataTransfer.dropEffect = 'none';
					return;
				}
				event.dataTransfer.dropEffect = 'move';
			} else if (data.soundId && data.sound) {
				// New sound from sidebar
				const draggedCategory = getSoundCategory(data.sound);
				if (!matchesCategory(draggedCategory, category)) {
					event.dataTransfer.dropEffect = 'none';
					return;
				}
				draggingNewSound = data.sound;
				event.dataTransfer.dropEffect = 'copy';
			}
		} else {
			// Fallback when data parsing fails
			if (draggingSceneSound) {
				const draggedCategory = getSceneSoundCategory(draggingSceneSound);
				if (!matchesCategory(draggedCategory, category)) {
					event.dataTransfer.dropEffect = 'none';
					return;
				}
				event.dataTransfer.dropEffect = 'move';
			} else if (event.dataTransfer.types.includes('application/json')) {
				event.dataTransfer.dropEffect = 'copy';
			}
		}

		dragOverIndex = index;
	}

	/**
	 * Handles drop on individual sound or empty list
	 */
	async function handleDrop(event: DragEvent, targetIndex: number) {
		event.preventDefault();
		event.stopPropagation();

		const data = parseDragData(event);
		if (!data) return;

		// Handle new sound from sidebar
		if (data.soundId && !data.sceneSoundId && data.sound) {
			const draggedCategory = getSoundCategory(data.sound);
			if (!matchesCategory(draggedCategory, category)) return;

			const optimisticSceneSound = createOptimisticSceneSound(
				sceneId,
				data.soundId,
				data.sound,
				targetIndex
			);

			// Show optimistic update
			const sortedSounds = [...sounds].sort((a, b) => a.position - b.position);
			const newSoundsOrder = [...sortedSounds];
			newSoundsOrder.splice(targetIndex, 0, optimisticSceneSound);
			optimisticOrder = newSoundsOrder.map((sound, index) => ({
				...sound,
				position: index
			}));

			clearDragState();

			try {
				await onaddsound(data.soundId, targetIndex);
			} catch (error) {
				// Revert on error
				optimisticOrder = null;
				throw error;
			} finally {
				optimisticOrder = null;
			}
			return;
		}

		// Handle reordering existing sounds
		if (!draggingSceneSound) return;

		const sorted = [...sounds].sort((a, b) => a.position - b.position);
		const draggedIndex = sorted.findIndex((s) => s.id === draggingSceneSound!.id);

		if (draggedIndex === -1 || draggedIndex === targetIndex) {
			clearDragState();
			return;
		}

		// Show optimistic reorder
		const newOrder = reorderArray(sorted, draggedIndex, targetIndex);
		optimisticOrder = newOrder;

		const soundsToUpdate = newOrder.map((sound, index) => ({
			id: sound.id,
			position: index
		}));

		clearDragState();

		try {
			await onreorder(soundsToUpdate);
		} catch (error) {
			// Revert on error
			optimisticOrder = null;
			throw error;
		} finally {
			optimisticOrder = null;
		}
	}
</script>

<div class="flex flex-col">
	<h4 class="mb-2 text-xs font-medium tracking-wider text-slate-400 uppercase">
		{label} ({sounds.length})
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
				ondrop={(e) => handleDrop(e, index)}
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
						ondelete={onremove}
						draggable={true}
						ondragstart={(e) => handleDragStart(e, sceneSound)}
						ondragend={handleDragEnd}
						isDragging={draggingSceneSound?.id === sceneSound.id}
						isSaving={savingId === sceneSound.id}
					/>
				{/if}
			</div>
		{:else}
			<!-- Empty list drop zone -->
			<div
				role="button"
				tabindex="-1"
				ondragover={(e) => handleSoundDragOver(e, 0)}
				ondrop={(e) => handleDrop(e, 0)}
				class="col-span-4 flex min-h-24 items-center justify-center rounded-lg border-2 border-dashed border-slate-600 bg-slate-800 transition-colors hover:border-indigo-500/50 hover:bg-slate-800"
			>
				<span class="text-sm font-medium text-slate-500">Drop {label.toLowerCase()} sound here</span
				>
			</div>
		{/each}
	</div>
</div>
