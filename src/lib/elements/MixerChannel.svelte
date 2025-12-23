<script lang="ts">
	import type { AudioChannel } from '$lib/muses-mixer';
	import type { SceneSoundWithTags } from '$lib/server/db';
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
		sceneSounds?: SceneSoundWithTags[];
	}

	let { name, color, channel, sceneSounds }: Props = $props();

	const handleChannelVolumeChange = (name: string, volume: number) => {
		if (!channel) {
			return;
		}

		channel.volume = volume;
	};
</script>

<div>
	<MixerPlaylist {name} {color} {sceneSounds} />
	<MixerVolume {name} {color} onvolumechange={handleChannelVolumeChange} />
</div>
