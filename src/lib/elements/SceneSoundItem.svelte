<script lang="ts">
	import { base } from '$app/paths';

	interface Props {
		sound: {
			id: string;
			name: string;
			description?: string | null;
			fileName: string;
		};
		onremove: (soundId: string, soundName: string) => void;
	}

	let { sound, onremove }: Props = $props();

	/**
	 * Handles the remove button click
	 */
	function handleRemove() {
		onremove(sound.id, sound.name);
	}
</script>

<div
	class="group flex items-center gap-2 rounded border border-slate-700 bg-slate-800/50 p-2 transition-colors hover:border-slate-600"
>
	<button
		onclick={handleRemove}
		class="shrink-0 rounded p-1 text-rose-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-slate-700 hover:text-rose-300"
		aria-label="Remove sound from scene"
		title="Remove sound from scene"
	>
		<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"
			></path>
		</svg>
	</button>
	<div class="min-w-0 flex-1">
		<p class="truncate text-sm font-medium text-slate-200">{sound.name}</p>
		{#if sound.description}
			<p class="truncate text-xs text-slate-400">{sound.description}</p>
		{/if}
	</div>
	<button
		class="shrink-0 rounded p-1 text-indigo-400 transition-colors hover:bg-slate-700 hover:text-indigo-300"
		aria-label="Play sound"
		title="Play sound"
		onclick={() => {
			const audio = new Audio(`${base}/sounds/${sound.fileName}`);
			audio.play();
		}}
	>
		<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
			></path>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
			></path>
		</svg>
	</button>
</div>
