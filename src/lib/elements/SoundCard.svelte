<script lang="ts">
	import { base } from '$app/paths';
	import type { SoundWithTags } from '$lib/server/db';

	interface Props {
		sound: SoundWithTags;
		onedit?: (sound: SoundWithTags) => void;
		ondelete?: (soundId: string, soundName: string) => Promise<void> | void;
		draggable?: boolean;
	}

	let { sound, onedit, ondelete, draggable = true }: Props = $props();

	let isDragging = $state<boolean>(false);
	let deleting = $state<boolean>(false);
	let cardElement: HTMLDivElement;
	let dragImageElement: HTMLDivElement;

	/**
	 * Handles the delete button click - delegates to parent
	 */
	async function handleDelete() {
		if (ondelete) {
			deleting = true;
			try {
				await ondelete(sound.id, sound.name);
			} finally {
				deleting = false;
			}
		}
	}

	/**
	 * Handles the edit button click - delegates to parent
	 */
	function handleEditClick() {
		if (onedit) {
			onedit(sound);
		}
	}

	/**
	 * Handles drag start event - sets the sound ID in the data transfer and custom drag image
	 * @param event - The drag event
	 */
	function handleDragStart(event: DragEvent) {
		isDragging = true;
		if (event.dataTransfer && cardElement) {
			event.dataTransfer.effectAllowed = 'copy';
			event.dataTransfer.setData('application/json', JSON.stringify({ soundId: sound.id }));

			// Create a smaller, transparent copy of the card as drag image
			if (dragImageElement) {
				// Set the drag image with offset to center it on cursor
				event.dataTransfer.setDragImage(dragImageElement, 100, 50);
			}
		}
	}

	/**
	 * Handles drag end event - resets the dragging state
	 */
	function handleDragEnd() {
		isDragging = false;
	}
</script>

<!-- Unified layout for all instances -->
<div
	bind:this={cardElement}
	role="button"
	tabindex="0"
	{draggable}
	ondragstart={handleDragStart}
	ondragend={handleDragEnd}
	class="rounded-lg border border-slate-700 bg-slate-800 p-4 shadow-md transition-all hover:border-indigo-500/50 hover:bg-slate-800"
	class:cursor-grab={draggable}
	class:active:cursor-grabbing={draggable}
	class:opacity-50={isDragging}
>
	<div class="mb-2 flex items-start justify-between">
		<h3 class="flex-1 text-lg font-semibold text-slate-100">{sound.name}</h3>
		<div class="flex gap-1">
			{#if onedit}
				<button
					onclick={handleEditClick}
					class="rounded p-1 text-indigo-400 transition-colors hover:bg-slate-700 hover:text-indigo-300"
					aria-label="Edit sound"
					title="Edit sound"
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
			{/if}
			{#if ondelete}
				<button
					onclick={handleDelete}
					disabled={deleting}
					class="ml-2 rounded p-1 text-rose-400 transition-colors hover:bg-slate-700 hover:text-rose-300 disabled:cursor-not-allowed disabled:text-slate-600"
					aria-label="Delete sound"
					title="Delete sound"
				>
					{#if deleting}
						<svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
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
			{/if}
		</div>
	</div>

	{#if sound.description}
		<p class="mb-3 text-sm text-slate-400">{sound.description}</p>
	{/if}

	{#if sound.tags && sound.tags.length > 0}
		<div class="mb-3 flex flex-wrap gap-1.5">
			{#each sound.tags as tag (tag.id)}
				<span
					class="inline-flex items-center rounded-full border border-cyan-700/50 bg-cyan-900/40 px-2.5 py-0.5 text-xs text-cyan-300"
				>
					{tag.name}
				</span>
			{/each}
		</div>
	{/if}

	{#if sound.mediaType}
		<audio controls class="mb-2 w-full">
			<source src="{base}/sounds/{sound.fileName}" type={sound.mediaType} />
			Your browser does not support the audio element.
		</audio>
	{/if}
</div>

<!-- Hidden drag image: smaller, transparent copy that follows the cursor -->
<div
	bind:this={dragImageElement}
	class="pointer-events-none fixed top-[-9999px] left-[-9999px] w-48 scale-75 rounded-lg border border-slate-500 bg-slate-800 p-3 opacity-70 shadow-xl"
>
	<div class="mb-1 flex items-center gap-2">
		<svg
			class="h-4 w-4 shrink-0 text-indigo-400"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
			></path>
		</svg>
		<h4 class="truncate text-sm font-semibold text-slate-100">{sound.name}</h4>
	</div>
	{#if sound.description}
		<p class="line-clamp-2 text-xs text-slate-400">{sound.description}</p>
	{/if}
</div>
