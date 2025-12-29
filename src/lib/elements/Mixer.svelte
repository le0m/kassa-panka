<script lang="ts">
	import { AudioChannel, AudioMixer } from '$lib/muses-mixer';
	import { type SceneFull } from '$lib/server/db';
	import { SoundCategory } from '$lib';
	import MixerChannel from './MixerChannel.svelte';
	import { logger } from '$lib/logger';

	interface Props {
		scene?: SceneFull;
	}

	let { scene }: Props = $props();

	let mixer: AudioMixer;
	let channels: Record<SoundCategory, AudioChannel> = $state({});
	let activeScene = $state<SceneFull | undefined>(undefined);

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
