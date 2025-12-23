<script lang="ts">
	import { AudioChannel, AudioMixer } from '$lib/muses-mixer';
	import type { SceneWithSoundsFull, SoundType } from '$lib/server/db';
	import MixerChannel from './MixerChannel.svelte';
	import MixerPlayer from './MixerPlayer.svelte';
	import MixerPlaylist from './MixerPlaylist.svelte';

	interface Props {
		scene?: SceneWithSoundsFull;
	}

	let { scene }: Props = $props();

	let ambienceSounds = $derived(
		scene?.sceneSounds.filter((sceSo) => sceSo.sound?.type === 'ambience') ?? []
	);
	let musicSounds = $derived(
		scene?.sceneSounds.filter((sceSo) => sceSo.sound?.type === 'music') ?? []
	);
	let sfxSounds = $derived(scene?.sceneSounds.filter((sceSo) => sceSo.sound?.type === 'sfx') ?? []);

	let mixer: AudioMixer;
	let channels: Record<SoundType, AudioChannel> = {};

	// Placeholder state for UI preview
	let isPlaying = $state(false);

	const handleChannelVolumeChange = (channel: string, volume: number) => {
		if (!channels[channel]) {
			return;
		}

		channels[channel].volume = volume;
	};

	// Initialize mixer and channels on first user gesture, as required by WebAudioAPI
	const handleUserGesture = () => {
		if (mixer) {
			return;
		}

		console.log('Initializing mixer');
		createMixer();
	};

	// Helper method to create the mixer and channels
	const createMixer = () => {
		mixer = new AudioMixer();
		channels = {};
		for (const name of ['ambience', 'music', 'sfx']) {
			channels[name] = mixer.addChannel(name);
		}
	};
</script>

<svelte:document onclick={handleUserGesture} />

<!-- Fixed bottom player -->
<div
	class="fixed right-0 bottom-0 left-0 flex h-[15vh] items-stretch border-t border-neutral-700 bg-neutral-900"
>
	<!-- Left: Audio controls, IGNORE FOR NOW -->
	<!--<div class="flex min-w-fit items-center gap-3 px-6">
		<MixerPlayer {isPlaying} />
	</div>-->

	<!-- Center: Current sound metadata -->
	<div class="flex min-w-0 flex-1 flex-col justify-center gap-3 overflow-hidden px-6">
		<MixerPlaylist name="Ambience" color="amber" sceneSounds={ambienceSounds} />
		<MixerPlaylist name="Music" color="purple" sceneSounds={musicSounds} />
		<MixerPlaylist name="SFX" color="emerald" sceneSounds={sfxSounds} />
	</div>

	<!-- Right: Volume controls for 3 channels -->
	<div class="flex min-w-[300px] flex-col justify-center gap-2 px-6">
		<MixerChannel name="Ambience" color="amber" onvolumechange={handleChannelVolumeChange} />
		<MixerChannel name="Music" color="purple" onvolumechange={handleChannelVolumeChange} />
		<MixerChannel name="SFX" color="emerald" onvolumechange={handleChannelVolumeChange} />
	</div>
</div>
