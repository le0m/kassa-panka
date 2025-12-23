<script lang="ts">
	import IconPlay from './icons/IconPlay.svelte';
	import IconPause from './icons/IconPause.svelte';
	import IconSkipBack from './icons/IconSkipBack.svelte';
	import IconSkipForward from './icons/IconSkipForward.svelte';

	/**
	 * Audio player controls component
	 */
	type Props = {
		/** Whether audio is currently playing */
		isPlaying?: boolean;
		/** Callback when play/pause button is clicked */
		onplaypause?: () => void;
		/** Callback when skip back button is clicked */
		onskipback?: () => void;
		/** Callback when skip forward button is clicked */
		onskipforward?: () => void;
	};

	let { isPlaying = false, onplaypause, onskipback, onskipforward }: Props = $props();
</script>

<button
	class="rounded-full bg-neutral-700 p-2 transition-colors hover:bg-neutral-600"
	aria-label="Previous track"
	onclick={onskipback}
>
	<IconSkipBack class="h-4 w-4 text-neutral-300" />
</button>

<button
	class="rounded-full bg-neutral-700 p-3 transition-colors hover:bg-neutral-600"
	aria-label={isPlaying ? 'Pause' : 'Play'}
	onclick={onplaypause}
>
	{#if isPlaying}
		<IconPause />
	{:else}
		<IconPlay />
	{/if}
</button>

<button
	class="rounded-full bg-neutral-700 p-2 transition-colors hover:bg-neutral-600"
	aria-label="Next track"
	onclick={onskipforward}
>
	<IconSkipForward class="h-4 w-4 text-neutral-300" />
</button>
