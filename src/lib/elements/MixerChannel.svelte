<script lang="ts">
	import type { AudioChannel } from '$lib/muses-mixer';
	import type { SceneSoundWithSoundFull } from '$lib/server/db';
	import MixerPlaylist from './MixerPlaylist.svelte';
	import MixerVolume from './MixerVolume.svelte';

	/**
	 * Control the audio channel for sounds of a specific type.
	 */
	interface Props {
		/** Channel name to display */
		name: string;
		/** Tailwind color class for the label and slider thumb (e.g., 'amber', 'purple', 'emerald') */
		color: string;
		/** The channel connected to the mixer */
		channel?: AudioChannel;
		/** Array of scene sounds to display */
		sceneSounds?: SceneSoundWithSoundFull[];
	}

	let { name, color, channel, sceneSounds }: Props = $props();

	const handleChannelVolumeChange = (name: string, volume: number) => {
		if (!channel) {
			return;
		}

		channel.volume = volume;
	};

	/** Complete Tailwind class strings based on color prop */
	const colorClasses = $derived(
		{
			amber: { text: 'text-amber-400' },
			purple: { text: 'text-purple-400' },
			emerald: { text: 'text-emerald-400' }
		}[color] ?? {
			text: 'text-neutral-400'
		}
	);
</script>

<div class="flex items-center gap-4">
	<span class="w-16 text-xs font-medium tracking-wide uppercase {colorClasses.text}">{name}</span>
	<div class="min-w-0 flex-1">
		<MixerPlaylist {name} {color} {sceneSounds} />
	</div>
	<div class="">
		<MixerVolume {name} {color} onvolumechange={handleChannelVolumeChange} />
	</div>
</div>
