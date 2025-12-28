<script lang="ts">
	import { humanTimeInterval } from '$lib';
	import type { SceneSoundWithSoundFull, SoundFull } from '$lib/server/db';

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
		/** List of scene sound currently playing */
		activeSoundIds: string[];
		/** Callback to handle click of sound card */
		onsoundclick: (sceneSound: SceneSoundWithSoundFull) => void;
	}

	let { name, color, sceneSounds = [], activeSoundIds = [], onsoundclick }: Props = $props();

	/** Complete Tailwind class strings based on color prop */
	const colorClasses = $derived(
		{
			amber: {
				border: 'border-amber-700',
				bg: 'bg-amber-800/30',
				active: 'bg-amber-500/50',
				hover: 'hover:bg-amber-500/20',
				activeHover: 'hover:bg-amber-500/40'
			},
			purple: {
				border: 'border-purple-700',
				bg: 'bg-purple-800/30',
				active: 'bg-purple-500/50',
				hover: 'hover:bg-purple-500/20',
				activeHover: 'hover:bg-purple-500/40'
			},
			emerald: {
				border: 'border-emerald-700',
				bg: 'bg-emerald-800/30',
				active: 'bg-emerald-500/50',
				hover: 'hover:bg-emerald-500/20',
				activeHover: 'hover:bg-emerald-500/40'
			}
		}[color] ?? {
			border: 'border-neutral-700',
			bg: 'bg-neutral-800/30',
			active: 'bg-neutral-500/50',
			hover: 'hover:bg-neutral-500/20',
			activeHover: 'hover:bg-neutral-500/40'
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
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class={[
							'h-[80px] w-[80px] cursor-pointer rounded border p-2',
							colorClasses.border,
							activeSoundIds.includes(sceneSound.id) ? colorClasses.active : colorClasses.bg,
							activeSoundIds.includes(sceneSound.id) ? colorClasses.activeHover : colorClasses.hover
						]}
						onclick={() => onsoundclick(sceneSound)}
					>
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
