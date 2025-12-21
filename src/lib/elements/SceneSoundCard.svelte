<script lang="ts">
	import { base } from '$app/paths';
	import IconMusic from './icons/IconMusic.svelte';
	import IconPause from './icons/IconPause.svelte';
	import IconPlay from './icons/IconPlay.svelte';
	import IconSpinner from './icons/IconSpinner.svelte';
	import IconTrash from './icons/IconTrash.svelte';
	import type { SoundWithTags, SceneSoundWithTags } from '$lib/server/db';

	interface Props {
		sceneSound: SceneSoundWithTags;
		ondelete?: (sceneSound: SceneSoundWithTags) => Promise<void> | void;
		draggable?: boolean;
		ondragstart?: (event: DragEvent, sceneSound: SceneSoundWithTags) => void;
		ondragend?: () => void;
		isDragging?: boolean;
		isSaving?: boolean;
	}

	let {
		sceneSound,
		ondelete,
		draggable = false,
		ondragstart,
		ondragend,
		isDragging = false,
		isSaving = false
	}: Props = $props();

	let deleting = $state<boolean>(false);
	let audioElement: HTMLAudioElement | undefined = $state();
	let isPlaying = $state<boolean>(false);
	let currentTime = $state<number>(0);
	let duration = $state<number>(0);
	let cardElement: HTMLDivElement;
	let dragImageElement: HTMLDivElement;

	$effect(() => {
		if (audioElement) {
			duration = audioElement.duration;
			currentTime = audioElement.currentTime;
		}
	});

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
	 * Toggles play/pause state of the audio
	 */
	function togglePlayPause() {
		if (!audioElement) return;

		if (isPlaying) {
			audioElement.pause();
		} else {
			audioElement.play();
		}
	}

	/**
	 * Handles audio time update
	 */
	function handleTimeUpdate() {
		if (audioElement) {
			currentTime = audioElement.currentTime;
		}
	}

	/**
	 * Handles audio play event
	 */
	function handlePlay() {
		isPlaying = true;
	}

	/**
	 * Handles audio pause event
	 */
	function handlePause() {
		isPlaying = false;
	}

	/**
	 * Formats time in seconds to MM:SS format
	 * @param seconds - Time in seconds
	 * @returns Formatted time string
	 */
	function formatTime(seconds: number): string {
		if (!isFinite(seconds)) return '0:00';
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

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
<div
	bind:this={cardElement}
	role="button"
	tabindex="0"
	{draggable}
	ondragstart={handleDragStart}
	ondragend={handleDragEnd}
	onclick={togglePlayPause}
	onkeydown={(e) => (e.key === 'Enter' || e.key === ' ' ? togglePlayPause() : null)}
	class="cursor-pointer rounded-lg border border-slate-700 bg-slate-800 p-4 shadow-md transition-all hover:border-indigo-500/50 hover:bg-slate-800"
	class:cursor-grab={draggable}
	class:active:cursor-grabbing={draggable}
	class:opacity-50={isDragging || isSaving}
>
	<div class="mb-2 flex items-start justify-between">
		<h3 class="flex-1 text-lg font-semibold text-slate-100">{sceneSound.sound!.name}</h3>
		<div class="flex gap-1">
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
		<p class="mb-3 text-sm text-slate-400">{sceneSound.sound.description}</p>
	{/if}

	{#if sceneSound.sound?.tags && sceneSound.sound.tags.length > 0}
		<div class="mb-3 flex flex-wrap gap-1.5">
			{#each sceneSound.sound.tags as tag (tag.id)}
				<span
					class="inline-flex items-center rounded-full border border-cyan-700/50 bg-cyan-900/40 px-2.5 py-0.5 text-xs text-cyan-300"
				>
					{tag.name}
				</span>
			{/each}
		</div>
	{/if}

	{#if sceneSound.sound?.mediaType}
		<!-- Hidden audio element -->
		<audio
			bind:this={audioElement}
			ontimeupdate={handleTimeUpdate}
			onplay={handlePlay}
			onpause={handlePause}
			onended={handlePause}
			class="hidden"
		>
			<source src="{base}/sounds/{sceneSound.sound.fileName}" type={sceneSound.sound.mediaType} />
			Your browser does not support the audio element.
		</audio>

		<!-- Custom timing display -->
		<div class="flex items-center justify-between text-sm text-slate-400">
			<div class="flex items-center gap-2">
				<div class="flex h-6 w-6 items-center justify-center">
					{#if isPlaying}
						<IconPause class="h-5 w-5 text-indigo-400" />
					{:else}
						<IconPlay class="h-5 w-5 text-slate-400" />
					{/if}
				</div>
				<span class="font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
			</div>
		</div>
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
