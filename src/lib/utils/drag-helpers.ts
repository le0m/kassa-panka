import { SoundCategory } from '$lib';
import type { SceneSoundWithSoundFull, SoundFull } from '$lib/server/db';

/**
 * Gets the category of a sound
 */
export function getSoundCategory(sound: SoundFull): SoundCategory | undefined {
	return sound.categories[0]?.name as SoundCategory | undefined;
}

/**
 * Gets the category of a scene sound
 */
export function getSceneSoundCategory(
	sceneSound: SceneSoundWithSoundFull
): SoundCategory | undefined {
	return sceneSound.sound?.categories[0]?.name as SoundCategory | undefined;
}

/**
 * Checks if a dragged sound matches the target category
 */
export function matchesCategory(
	draggedCategory: SoundCategory | undefined,
	targetCategory: SoundCategory
): boolean {
	return draggedCategory === targetCategory;
}

/**
 * Parses drag data from a drag event
 */
export function parseDragData(event: DragEvent): {
	soundId?: string;
	sceneSoundId?: string;
	sound?: SoundFull;
} | null {
	if (!event.dataTransfer) return null;

	try {
		const jsonData = event.dataTransfer.getData('application/json');
		if (!jsonData) return null;
		return JSON.parse(jsonData);
	} catch {
		return null;
	}
}

/**
 * Creates optimistic scene sound for new sound being added
 */
export function createOptimisticSceneSound(
	sceneId: string,
	soundId: string,
	sound: SoundFull,
	position: number
): SceneSoundWithSoundFull {
	return {
		id: `optimistic-${Date.now()}`,
		sceneId,
		soundId,
		position,
		sound
	};
}

/**
 * Reorders an array by moving an item from one index to another
 */
export function reorderArray<T>(array: T[], fromIndex: number, toIndex: number): T[] {
	const result = [...array];
	const [removed] = result.splice(fromIndex, 1);
	result.splice(toIndex, 0, removed);
	return result;
}

/**
 * Updates positions for an array of scene sounds
 */
export function updatePositions(sounds: SceneSoundWithSoundFull[]): SceneSoundWithSoundFull[] {
	return sounds.map((sound, index) => ({
		...sound,
		position: index
	}));
}

/**
 * Creates display order for sounds considering drag state
 */
export function createDisplayOrder(
	categorySounds: SceneSoundWithSoundFull[],
	category: SoundCategory,
	options: {
		optimisticOrder: SceneSoundWithSoundFull[] | null;
		draggingSceneSound: SceneSoundWithSoundFull | null;
		draggingNewSound: SoundFull | null;
		dragOverIndex: number | null;
	}
): SceneSoundWithSoundFull[] {
	const { optimisticOrder, draggingSceneSound, draggingNewSound, dragOverIndex } = options;

	// Use optimistic order if available (after drop, before API response)
	if (optimisticOrder) {
		return optimisticOrder.filter((sceSo) =>
			matchesCategory(getSceneSoundCategory(sceSo), category)
		);
	}

	const sorted = [...categorySounds].sort((a, b) => a.position - b.position);

	// Show live reordering preview when dragging existing sound
	if (draggingSceneSound && dragOverIndex !== null) {
		const draggedCategory = getSceneSoundCategory(draggingSceneSound);
		if (matchesCategory(draggedCategory, category)) {
			const draggedIndex = sorted.findIndex((s) => s.id === draggingSceneSound.id);
			if (draggedIndex !== -1 && draggedIndex !== dragOverIndex) {
				return reorderArray(sorted, draggedIndex, dragOverIndex);
			}
		}
	}

	// Show placeholder when dragging new sound from sidebar
	if (draggingNewSound && dragOverIndex !== null) {
		const draggedCategory = getSoundCategory(draggingNewSound);
		if (matchesCategory(draggedCategory, category)) {
			const reordered = [...sorted];
			const placeholder: SceneSoundWithSoundFull = {
				id: 'placeholder',
				sceneId: sorted[0]?.sceneId ?? '',
				soundId: draggingNewSound.id,
				position: dragOverIndex,
				sound: draggingNewSound
			};
			reordered.splice(dragOverIndex, 0, placeholder);
			return reordered;
		}
	}

	return sorted;
}
