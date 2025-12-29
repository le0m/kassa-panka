import type { SceneSoundFull, SoundFull } from '$lib/server/db';

/**
 * Manages drag-and-drop state for scene sounds
 */
export class DragState {
	/** The scene sound currently being dragged (for reordering) */
	draggingSceneSound = $state<SceneSoundFull | null>(null);

	/** New sound being dragged from sidebar */
	draggingNewSound = $state<SoundFull | null>(null);

	/** Index where the drop would occur */
	dragOverIndex = $state<number | null>(null);

	/** Optimistic order shown during/after drag operations */
	optimisticOrder = $state<SceneSoundFull[] | null>(null);

	/** ID of sound currently being saved via API */
	savingSound = $state<string | null>(null);

	/** ID of sound currently being removed */
	removingSound = $state<string | null>(null);

	/** Success state for save operations */
	saveSuccess = $state(false);

	/** Error state for save operations */
	saveError = $state(false);

	/**
	 * Resets all drag-related state
	 */
	clearDragState() {
		this.draggingSceneSound = null;
		this.draggingNewSound = null;
		this.dragOverIndex = null;
	}

	/**
	 * Resets optimistic update state
	 */
	clearOptimisticState() {
		this.optimisticOrder = null;
		this.savingSound = null;
	}

	/**
	 * Shows success state briefly
	 */
	showSuccess() {
		this.saveSuccess = true;
		setTimeout(() => {
			this.saveSuccess = false;
		}, 1000);
	}

	/**
	 * Shows error state
	 */
	showError() {
		this.saveError = true;
	}

	/**
	 * Hides error state
	 */
	clearError() {
		this.saveError = false;
	}
}
