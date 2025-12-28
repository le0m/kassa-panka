<script lang="ts">
	import { asset } from '$app/paths';
	import { AudioTrack, type AudioChannel } from '$lib/muses-mixer';
	import type { SceneSoundWithSoundFull, SoundFull } from '$lib/server/db';
	import IconPause from './icons/IconPause.svelte';
	import IconPlay from './icons/IconPlay.svelte';
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
		/** Whether the sounds in this channel should be played sequentially (one at a time) or not (multiple concurrent sounds) */
		sequential: boolean;
	}

	let { name, color, channel, sceneSounds, sequential }: Props = $props();

	let activeSoundIds = $state<string[]>([]);
	let sortedSceneSounds = $derived(sceneSounds?.sort((a, b) => a.position - b.position) ?? []);
	let playing = $state(false);

	const handleChannelVolumeChange = (name: string, volume: number) => {
		if (!channel) {
			return;
		}

		channel.volume = volume;
	};

	/**
	 * Create new track from sceneSound, attaching listeners for playback events.
	 * @param sceneSound
	 */
	const createTrack = (sceneSound: SceneSoundWithSoundFull) => {
		if (!channel || !sceneSound.sound) {
			return undefined;
		}

		const track = channel.input(asset(`/sounds/${sceneSound.sound.fileName}`)) as AudioTrack;
		track.id = sceneSound.id;

		const removeEvents: (keyof HTMLMediaElementEventMap)[] = ['pause', 'error', 'abort'];
		removeEvents.forEach((event) =>
			track!.on(event, () => {
				// Remove from active sounds
				let idx = activeSoundIds.findIndex((id) => id === track!.id);
				if (idx !== -1) {
					activeSoundIds.splice(idx, 1);
				}
			})
		);
		track.on('play', () => {
			// Add to active sounds
			if (!activeSoundIds.includes(track!.id)) {
				activeSoundIds.push(track!.id);
			}
		});
		track.on('ended', () => {
			// Remove from active sounds if channel is not sequential
			if (!sequential && !track.loop) {
				console.log(`Ended sound "${sceneSound.sound!.name}" in channel "${channel.id}"`);
				let idx = activeSoundIds.findIndex((id) => id === track!.id);
				if (idx !== -1) {
					activeSoundIds.splice(idx, 1);
				}

				return;
			}

			// Otherwise play next sound
			if (!sortedSceneSounds.length) {
				return;
			}

			console.log(
				`Playing next sound after "${sceneSound.sound!.name}" in channel "${channel.id}"`
			);
			let nextSceneSound = sortedSceneSounds.find((sceSo) => sceSo.position > sceneSound.position);
			if (nextSceneSound === undefined) {
				nextSceneSound = sortedSceneSounds.at(0) as SceneSoundWithSoundFull;
			}

			handleSoundClick(nextSceneSound);
		});

		return track;
	};

	/**
	 * Handle user clicking on sound cards directly.
	 *
	 * @param sceneSound - The clicked sceneSound.
	 */
	const handleSoundClick = async (sceneSound: SceneSoundWithSoundFull) => {
		playing = false;

		if (!channel || !sceneSound.sound) {
			return;
		}

		let track = channel.findTrack(sceneSound.id);
		if (!track) {
			console.log(`Adding sound "${sceneSound.sound.name}" to channel "${channel.id}"`);
			track = createTrack(sceneSound);
			if (track === undefined) {
				console.warn(
					{ channel: !!channel, sound: sceneSound.sound },
					`Can't create track for scene sound "${sceneSound.id}" in channel "${channel.id}"`
				);

				return;
			}
		}

		if (!track.playing) {
			console.log(`Resuming sound "${sceneSound.sound.name}" in channel "${channel.id}"`);
			playing = true;
			await track.play();

			return;
		}

		console.log(`Pausing sound "${sceneSound.sound.name}" in channel "${channel.id}"`);
		track.pause();
		playing = channel.playing;
	};

	/**
	 * Handle play/pause of the whole channel.
	 */
	const handleToggle = () => {
		playing = false;

		if (!channel) {
			return Promise.resolve(void 0);
		}

		// Pause channel if it was playing
		if (channel.playing) {
			console.log(`Pausing channel "${channel.id}"`);
			channel.pause();

			return Promise.resolve(void 0);
		}

		// Resume channel if it was paused
		if (channel.tracks.some((track) => track.paused)) {
			console.log(`Resuming channel "${channel.id}"`);
			playing = true;
			channel.play();

			return Promise.resolve(void 0);
		}

		if (!sortedSceneSounds.length) {
			console.log(`No sounds to play in channel "${channel.id}"`);

			return Promise.resolve(void 0);
		}

		// Start first sound if this is the first interaction
		const sceneSound = sortedSceneSounds[0];
		const track = createTrack(sceneSound);
		if (track === undefined) {
			console.warn(
				{ channel: !!channel, sound: sceneSound.sound },
				`Can't create track for scene sound "${sceneSound.id}" in channel "${channel.id}"`
			);

			return Promise.resolve(void 0);
		}

		console.log(`Playing channel "${channel.id}"`);
		playing = true;

		return track.play();
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
	<span class="w-16 text-xs font-medium tracking-wide uppercase {colorClasses.text}">
		{name}
		{#if playing}
			<IconPause onclick={handleToggle} />
		{:else}
			<IconPlay onclick={handleToggle} />
		{/if}
	</span>
	<div class="min-w-0 flex-1">
		<MixerPlaylist
			{name}
			{color}
			sceneSounds={sortedSceneSounds}
			onsoundclick={handleSoundClick}
			{activeSoundIds}
		/>
	</div>
	<div class="">
		<MixerVolume {name} {color} onvolumechange={handleChannelVolumeChange} />
	</div>
</div>
