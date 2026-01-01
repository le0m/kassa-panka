<script lang="ts">
	import IconEdit from './icons/IconEdit.svelte';
	import IconMusic from './icons/IconMusic.svelte';
	import IconSpinner from './icons/IconSpinner.svelte';
	import IconTrash from './icons/IconTrash.svelte';
	import type { SoundFull } from '$lib/server/db';
	import { humanTimeInterval, SoundCategory } from '$lib';
	import { playSound } from '$lib/play-sound.svelte';

	interface Props {
		sound: SoundFull;
		onedit?: (sound: SoundFull) => void;
		ondelete?: (soundId: string, soundName: string) => Promise<void> | void;
		draggable?: boolean;
	}

	let { sound, onedit, ondelete, draggable = true }: Props = $props();

	/**
	 * Gets the first category from the sound's categories array
	 */
	const firstCategory = $derived(sound.categories?.[0]?.name);

	/**
	 * Gets the first genre from the sound's genres array
	 */
	const firstGenre = $derived(sound.genres?.[0]?.name);

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
			active: 'bg-indigo-500/20',
			hover: 'hover:bg-indigo-500/50'
		}
	);

	/**
	 * Color scheme for genre chip
	 */
	const genreColors = $derived(
		{
			Fantasy: {
				border: 'border-pink-700/50',
				bg: 'bg-pink-900/40'
			},
			'Sci-Fi': {
				border: 'border-sky-700/50',
				bg: 'bg-sky-900/40'
			},
			Modern: {
				border: 'border-lime-700/50',
				bg: 'bg-lime-900/40'
			}
		}[firstGenre ?? ''] ?? {
			border: 'border-slate-700/50',
			bg: 'bg-slate-900/40'
		}
	);

	let isDragging = $state<boolean>(false);
	let deleting = $state<boolean>(false);
	let cardElement: HTMLDivElement;
	let dragImageElement: HTMLDivElement;
	let playing = $state(false);

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

	/**
	 * Handle sound card click for playing sound.
	 */
	const handleClick = async () => {
		playing = true;
		playing = await playSound(sound);
	};
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	bind:this={cardElement}
	role="button"
	tabindex="0"
	{draggable}
	onclick={handleClick}
	ondragstart={handleDragStart}
	ondragend={handleDragEnd}
	class={[
		'm-4 flex flex-col gap-2 rounded-lg border p-4 shadow-md transition-all',
		categoryColors.border,
		playing ? categoryColors.active : categoryColors.bg,
		categoryColors.hover
	]}
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

	{#if firstGenre}
		<div class="flex gap-2">
			<span
				class="rounded-full border px-2.5 py-0.5 text-xs font-medium {genreColors.border} {genreColors.bg}"
			>
				{firstGenre}
			</span>
		</div>
	{/if}

	{#if sound.description}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		<p class="text-sm text-slate-400">{@html sound.description}</p>
	{/if}

	<p class="font-mono text-sm text-slate-300">{humanTimeInterval(sound.duration * 1000)}</p>

	{#if sound.tags && sound.tags.length > 0}
		<div class="flex flex-wrap gap-2">
			{#each sound.tags as tag (tag.id)}
				<span class="rounded-full border border-cyan-700 bg-cyan-900 px-2.5 py-0.5 text-xs">
					{tag.name}
				</span>
			{/each}
		</div>
	{/if}
</div>

<!-- Hidden drag image: smaller, transparent copy that follows the cursor -->
<div
	bind:this={dragImageElement}
	class="pointer-events-none fixed top-[-9999px] left-[-9999px] w-48 scale-75 rounded-lg border {categoryColors.border} {categoryColors.bg} p-3 opacity-70 shadow-xl"
>
	<div class="flex items-center gap-2">
		<IconMusic class="h-4 w-4 shrink-0 text-indigo-400" />
		<h4 class="truncate text-sm font-semibold text-slate-100">{sound.name}</h4>
	</div>
	{#if sound.description}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		<p class="line-clamp-2 text-xs text-slate-400">{@html sound.description}</p>
	{/if}
</div>
