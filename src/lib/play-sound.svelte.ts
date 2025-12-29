import { asset } from '$app/paths';
import { logger } from './logger';
import type { SoundEntity } from './server/db';
import { createAudio } from './utils';

let currentAudio = $state<HTMLAudioElement | undefined>();

/**
 * Play sound, replacing the current one if any.
 * Pause if the same sound is clicked again while playing.
 * @param sound
 * @returns
 */
export const playSound = (sound: SoundEntity): Promise<boolean> =>
	new Promise((res) => {
		if (currentAudio && currentAudio.dataset.sound === sound.id) {
			if (currentAudio.paused) {
				currentAudio.play();
				res(true);
			} else {
				currentAudio.pause();
				res(false);
			}

			return;
		}

		if (currentAudio && !currentAudio.paused && !currentAudio.ended) {
			logger.debug(`Pausing previous sound to play "${sound.name}"`);
			currentAudio.pause();
		} else {
			logger.debug(`Playing sound "${sound.name}"`);
		}

		currentAudio = createAudio(asset(`/sounds/${sound.fileName}`));
		currentAudio.dataset.sound = sound.id;
		for (const event of ['pause', 'ended', 'error', 'abort']) {
			currentAudio.addEventListener(event, () => {
				logger.debug(`Event "${event}" for sound "${sound.name}"`);
				res(false);
			});
		}
	});
