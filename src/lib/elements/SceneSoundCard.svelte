<script lang="ts">
	import IconMusic from './icons/IconMusic.svelte';
	import IconSpinner from './icons/IconSpinner.svelte';
	import IconTrash from './icons/IconTrash.svelte';
	import type { SceneSoundFull, SoundFull } from '$lib/server/db';
	import { humanTimeInterval, SoundCategory } from '$lib';

	interface Props {
		sceneSound: SceneSoundFull;
		ondelete?: (sceneSound: SceneSoundFull) => Promise<void> | void;
		ondragstart?: (event: DragEvent, sceneSound: SceneSoundFull) => void;
		ondragend?: () => void;
		onplaysound?: (sound: SoundFull) => void;
		draggable?: boolean;
		isDragging?: boolean;
		isSaving?: boolean;
		active?: boolean;
	}

	let {
		sceneSound,
		ondelete,
		ondragstart,
		ondragend,
		onplaysound,
		draggable = false,
		isDragging = false,
		isSaving = false,
		active = false
	}: Props = $props();

	let deleting = $state<boolean>(false);
	let dragImageElement: HTMLDivElement;

	/**
	 * Gets the first category from the sound's categories array
	 */
	const firstCategory = $derived(sceneSound.sound?.categories?.[0]?.name);

	/**
	 * Color scheme for card border and background based on category
	 * Matches MixerChannel colors: Music -> amber, SFX -> purple, Ambience -> emerald
	 */
	const categoryColors = $derived(
		{
			[SoundCategory.Ambience]: {
				border: 'border-amber-700',
				bg: 'bg-amber-800/30',
				active: 'bg-amber-500/20',
				hover: 'hover:bg-amber-500/20'
			},
			[SoundCategory.Music]: {
				border: 'border-purple-700',
				bg: 'bg-purple-800/30',
				active: 'bg-purple-500/20',
				hover: 'hover:bg-purple-500/20'
			},
			[SoundCategory.SFX]: {
				border: 'border-emerald-700',
				bg: 'bg-emerald-800/30',
				active: 'bg-emerald-500/20',
				hover: 'hover:bg-emerald-500/20'
			}
		}[firstCategory ?? ''] ?? {
			border: 'border-slate-700',
			bg: 'bg-slate-800',
			active: 'bg-indigo-500/50',
			hover: 'hover:bg-indigo-500/50'
		}
	);

	/**
	 * Handles the delete button click - delegates to parent
	 */
	async function handleDelete() {
		if (ondelete) {
			deleting = true;
			try {
				await ondelete(sceneSound);
			} finally {
				deleting = false;
			}
		}
	}

	/**
	 * Handle sound card click for playing sound.
	 */
	const handleClick = () => sceneSound.sound && onplaysound?.(sceneSound.sound);

	/**
	 * Handles drag start event - sets the sceneSound data and custom drag image
	 * @param event - The drag event
	 */
	function handleDragStart(event: DragEvent) {
		if (ondragstart) {
			ondragstart(event, sceneSound);

			// Create a smaller, transparent copy of the card as drag image
			if (event.dataTransfer && dragImageElement) {
				event.dataTransfer.effectAllowed = 'move';
				// Set the drag image with offset to center it on cursor
				event.dataTransfer.setDragImage(dragImageElement, 100, 50);
			}
		}
	}

	/**
	 * Handles drag end event - resets the dragging state
	 */
	function handleDragEnd() {
		if (ondragend) {
			ondragend();
		}
	}
</script>

<!-- Unified layout for all instances -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	role="button"
	tabindex="0"
	{draggable}
	ondragstart={handleDragStart}
	ondragend={handleDragEnd}
	onclick={handleClick}
	class={[
		'flex cursor-pointer flex-col gap-4 rounded-lg border p-4 shadow-md transition-all',
		categoryColors.border,
		active ? categoryColors.active : categoryColors.bg,
		categoryColors.hover
	]}
	class:cursor-grab={draggable}
	class:active:cursor-grabbing={draggable}
	class:opacity-50={isDragging || isSaving}
>
	<div class="flex gap-2">
		<h3 class="flex-1 text-lg font-semibold text-slate-100">{sceneSound.sound!.name}</h3>
		<div class="flex">
			{#if ondelete}
				<button
					onclick={(e) => {
						e.stopPropagation();
						handleDelete();
					}}
					disabled={deleting}
					class="ml-2 rounded p-1 text-rose-400 transition-colors hover:bg-slate-700 hover:text-rose-300 disabled:cursor-not-allowed disabled:text-slate-600"
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

	{#if sceneSound.sound?.description}
		<p class="text-sm text-slate-400">{@html sceneSound.sound.description}</p>
	{/if}

	{#if sceneSound.sound}
		<p class="font-mono text-xs text-slate-300">
			{humanTimeInterval(sceneSound.sound.duration * 1000)}
		</p>
	{/if}
</div>

<!-- Hidden drag image: smaller, transparent copy that follows the cursor -->
<div
	bind:this={dragImageElement}
	class="pointer-events-none fixed top-[-9999px] left-[-9999px] w-48 scale-75 rounded-lg border border-slate-500 bg-slate-800 p-3 opacity-70 shadow-xl"
>
	<div class="mb-1 flex items-center gap-2">
		<IconMusic class="h-4 w-4 shrink-0 text-indigo-400" />
		<h4 class="truncate text-sm font-semibold text-slate-100">
			{sceneSound.sound?.name || 'Sound'}
		</h4>
	</div>
	{#if sceneSound.sound?.description}
		<p class="line-clamp-2 text-xs text-slate-400">{sceneSound.sound.description}</p>
	{/if}
</div>
