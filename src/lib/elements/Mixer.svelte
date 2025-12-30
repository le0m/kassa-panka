<script lang="ts">
	import { AudioChannel, AudioMixer } from '$lib/muses-mixer';
	import { type SceneFull } from '$lib/server/db';
	import { SoundCategory } from '$lib';
	import MixerChannel from './MixerChannel.svelte';
	import MixerVolume from './MixerVolume.svelte';
	import { logger } from '$lib/logger';
	import IconPause from './icons/IconPause.svelte';
	import IconPlay from './icons/IconPlay.svelte';

	interface Props {
		scene?: SceneFull;
	}

	let { scene }: Props = $props();

	let mixer: AudioMixer;
	let channels: Record<SoundCategory, AudioChannel> = $state({});
	let activeScene = $state<SceneFull | undefined>(undefined);
	let playing = $state(true);

	let ambienceSounds = $derived(
		activeScene?.sceneSounds.filter((sceSo) =>
			sceSo.sound?.categories.some((c) => c.name === SoundCategory.Ambience)
		) ?? []
	);
	let musicSounds = $derived(
		activeScene?.sceneSounds.filter((sceSo) =>
			sceSo.sound?.categories.some((c) => c.name === SoundCategory.Music)
		) ?? []
	);
	let sfxSounds = $derived(
		activeScene?.sceneSounds.filter((sceSo) =>
			sceSo.sound?.categories.some((c) => c.name === SoundCategory.SFX)
		) ?? []
	);

	$effect(() => {
		if (!scene || scene.id === activeScene?.id) {
			return;
		}

		logger.debug('Active scene changed, creating new mixer');
		activeScene = scene;
		if (mixer) {
			mixer.close();
		}

		createMixer();
	});

	const handleVolumeChange = (name: string, volume: number) => {
		if (!mixer) {
			return;
		}

		mixer.volume = volume;
	};

	const handleToggle = () => {
		if (!mixer) {
			return;
		}

		for (const channel of mixer.channels) {
			channel.pause();
		}

		/* TODO: fix reactivity of "playing"
		let playing = mixer.channels.some((channel) => channel.playing);
		for (const channel of mixer.channels) {
			if (playing) {
				channel.pause();
			} else {
				channel.play();
			}
		}
		*/
	};

	// Initialize mixer and channels on first user gesture, as required by WebAudioAPI
	const handleUserGesture = () => {
		if (mixer) {
			return;
		}

		logger.debug('Initializing mixer');
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

<!-- Player -->
<div class="flex flex-col gap-4 border-neutral-700 bg-neutral-900 p-4">
	<div class="flex items-center gap-4">
		<span class="w-16 text-xs font-medium tracking-wide text-cyan-400 uppercase">
			Master
			{#if playing}
				<IconPause onclick={handleToggle} />
			{:else}
				<IconPlay onclick={handleToggle} />
			{/if}
		</span>

		<div class="min-w-0 flex-1"></div>

		<div class="">
			<MixerVolume name="master" color="cyan" onvolumechange={handleVolumeChange} />
		</div>
	</div>

	<MixerChannel
		name="Ambience"
		color="amber"
		channel={channels['ambience']}
		sceneSounds={ambienceSounds}
		sequential={false}
	/>
	<MixerChannel
		name="Music"
		color="purple"
		channel={channels['music']}
		sceneSounds={musicSounds}
		sequential={true}
	/>
	<MixerChannel
		name="SFX"
		color="emerald"
		channel={channels['sfx']}
		sceneSounds={sfxSounds}
		sequential={false}
	/>
</div>
