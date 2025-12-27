<script lang="ts">
	import { humanTimeInterval } from '$lib';
	import type { SceneSoundWithSoundFull } from '$lib/server/db';

	/**
	 * Horizontal playlist display for a specific channel
	 */
	interface Props {
		/** Channel name to display */
		name: string;
		/** Tailwind color class for the border (e.g., 'amber', 'purple', 'emerald') */
		color: string;
		/** Array of scene sounds to display */
		sceneSounds?: SceneSoundWithSoundFull[];
	}

	let { name, color, sceneSounds = [] }: Props = $props();

	/** Complete Tailwind class strings based on color prop */
	const colorClasses = $derived(
		{
			amber: {
				border: 'border-amber-700',
				bg: 'bg-amber-800/30'
			},
			purple: {
				border: 'border-purple-700',
				bg: 'bg-purple-800/30'
			},
			emerald: {
				border: 'border-emerald-700',
				bg: 'bg-emerald-800/30'
			}
		}[color] ?? {
			border: 'border-neutral-700',
			bg: 'bg-neutral-800/30'
		}
	);
</script>

<div class="flex items-center gap-2">
	<div class="flex gap-2 overflow-x-auto">
		{#if sceneSounds.length === 0}
			<div
				class="h-[80px] w-[80px] justify-center rounded border px-3 py-2 text-xs {colorClasses.border} {colorClasses.bg}"
			>
				No sounds
			</div>
		{:else}
			{#each sceneSounds as sceneSound (sceneSound.id)}
				{@const sound = sceneSound.sound}
				{#if sound}
					<div class="h-[80px] w-[80px] rounded border p-2 {colorClasses.border} {colorClasses.bg}">
						<h4 class="text-xs font-medium text-ellipsis text-white">{sound.name}</h4>
						<p class="font-mono text-xs text-slate-300">
							{humanTimeInterval(sound.duration * 1000)}
						</p>
					</div>
				{/if}
			{/each}
		{/if}
	</div>
</div>
