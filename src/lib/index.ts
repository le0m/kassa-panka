/**
 * Enums for sound categories and genres.
 */

export const SoundCategory = {
	Ambience: 'Ambience',
	Music: 'Music',
	SFX: 'SFX'
};
export type SoundCategory = (typeof SoundCategory)[keyof typeof SoundCategory];

export const SoundGenre = {
	Fantasy: 'Fantasy',
	'Sci-Fi': 'Sci-Fi',
	Modern: 'Modern'
};
export type SoundGenre = (typeof SoundGenre)[keyof typeof SoundGenre];

/**
 * Utilities
 */

/**
 * Convert milliseconds to a human-readable time interval string.
 *
 * @param ms milliseconds
 * @returns human time
 */
export const humanTimeInterval = (ms: number) => {
	const pad = (n: number) => `${n}`.padStart(2, '0');
	const q = [(ms / 3.6e6) | 0, ((ms % 3.6e6) / 6e4) | 0, ((ms % 6e4) / 1000) | 0];
	while (q.length > 2 && q[0] === 0) q.shift();

	return `${q.map(pad).join(':')}${q.length ? '' : `${pad((ms % 1000) | 0)} ms`}`;
};
