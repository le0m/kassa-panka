export * from './utils.ts';

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
