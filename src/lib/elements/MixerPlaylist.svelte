<script lang="ts">
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
				text: 'text-amber-400',
				border: 'border-amber-700',
				bg: 'bg-amber-800/30',
				tagBorder: 'border-amber-700/50',
				tagBg: 'bg-amber-900/40',
				tagText: 'text-amber-300'
			},
			purple: {
				text: 'text-purple-400',
				border: 'border-purple-700',
				bg: 'bg-purple-800/30',
				tagBorder: 'border-purple-700/50',
				tagBg: 'bg-purple-900/40',
				tagText: 'text-purple-300'
			},
			emerald: {
				text: 'text-emerald-400',
				border: 'border-emerald-700',
				bg: 'bg-emerald-800/30',
				tagBorder: 'border-emerald-700/50',
				tagBg: 'bg-emerald-900/40',
				tagText: 'text-emerald-300'
			}
		}[color] ?? {
			text: 'text-neutral-400',
			border: 'border-neutral-700',
			bg: 'bg-neutral-800/30',
			tagBorder: 'border-neutral-700/50',
			tagBg: 'bg-neutral-900/40',
			tagText: 'text-neutral-300'
		}
	);
</script>

<div class="flex items-center gap-2">
	<div class="flex gap-2 overflow-x-auto">
		{#if sceneSounds.length === 0}
			<div
				class="flex min-w-[120px] justify-center rounded border px-3 py-2 text-xs {colorClasses.border} {colorClasses.bg} {colorClasses.text}"
			>
				No sounds
			</div>
		{:else}
			{#each sceneSounds as sceneSound (sceneSound.id)}
				{@const sound = sceneSound.sound}
				{#if sound}
					<div
						class="flex min-w-[120px] flex-col gap-1 rounded border p-2 {colorClasses.border} {colorClasses.bg}"
					>
						<h4 class="text-xs font-medium text-white">{sound.name}</h4>
						{#if sound.tags && sound.tags.length > 0}
							<div class="flex flex-wrap gap-1">
								{#each sound.tags.slice(0, 2) as tag}
									<span
										class="rounded-full border px-2.5 py-0.5 text-xs {colorClasses.tagBorder} {colorClasses.tagBg} {colorClasses.tagText}"
									>
										{tag.name}
									</span>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			{/each}
		{/if}
	</div>
</div>
