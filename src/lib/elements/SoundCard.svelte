<script lang="ts">
	import { base } from '$app/paths';
	import IconEdit from './icons/IconEdit.svelte';
	import IconMusic from './icons/IconMusic.svelte';
	import IconSpinner from './icons/IconSpinner.svelte';
	import IconTrash from './icons/IconTrash.svelte';
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
	 * Handles drag start event - sets the sound data in the data transfer and custom drag image
	 * @param event - The drag event
	 */
	function handleDragStart(event: DragEvent) {
		isDragging = true;
		if (event.dataTransfer && cardElement) {
			event.dataTransfer.effectAllowed = 'copy';
			event.dataTransfer.setData('application/json', JSON.stringify({ soundId: sound.id, sound }));

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

<div
	bind:this={cardElement}
	role="button"
	tabindex="0"
	{draggable}
	ondragstart={handleDragStart}
	ondragend={handleDragEnd}
	class="m-4 flex flex-col gap-2 rounded-lg border border-slate-700 bg-slate-800 p-4 shadow-md transition-all hover:border-indigo-500/50 hover:bg-slate-800"
	class:cursor-grab={draggable}
	class:active:cursor-grabbing={draggable}
	class:opacity-50={isDragging}
>
	<div class="flex gap-2">
		<h3 class="flex-1 text-lg font-semibold text-slate-100">{sound.name}</h3>
		<div class="flex gap-2">
			{#if onedit}
				<button
					onclick={handleEditClick}
					class="rounded p-1 text-indigo-400 transition-colors hover:bg-slate-700 hover:text-indigo-300"
					aria-label="Edit sound"
					title="Edit sound"
				>
					<IconEdit />
				</button>
			{/if}
			{#if ondelete}
				<button
					onclick={handleDelete}
					disabled={deleting}
					class="rounded p-1 text-rose-400 transition-colors hover:bg-slate-700 hover:text-rose-300 disabled:cursor-not-allowed disabled:text-slate-600"
					aria-label="Delete sound"
					title="Delete sound"
				>
					{#if deleting}
						<IconSpinner />
					{:else}
						<IconTrash />
					{/if}
				</button>
			{/if}
		</div>
	</div>

	{#if sound.description}
		<p class="text-sm text-slate-400">{sound.description}</p>
	{/if}

	{#if sound.tags && sound.tags.length > 0}
		<div class="flex flex-wrap gap-2">
			{#each sound.tags as tag (tag.id)}
				<span
					class="rounded-full border border-cyan-700/50 bg-cyan-900/40 px-2.5 py-0.5 text-xs text-cyan-300"
				>
					{tag.name}
				</span>
			{/each}
		</div>
	{/if}

	{#if sound.mediaType}
		<audio controls class="w-full">
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
	<div class="flex items-center gap-2">
		<IconMusic class="h-4 w-4 shrink-0 text-indigo-400" />
		<h4 class="truncate text-sm font-semibold text-slate-100">{sound.name}</h4>
	</div>
	{#if sound.description}
		<p class="line-clamp-2 text-xs text-slate-400">{sound.description}</p>
	{/if}
</div>
