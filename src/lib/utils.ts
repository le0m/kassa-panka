/**
 * Convert milliseconds to a human-readable time interval string.
 *
 * @param ms milliseconds
 * @returns {string} human time
 */
export const humanTimeInterval = (ms: number): string => {
	const pad = (n: number) => `${n}`.padStart(2, '0');
	const q = [(ms / 3.6e6) | 0, ((ms % 3.6e6) / 6e4) | 0, ((ms % 6e4) / 1000) | 0];
	while (q.length > 2 && q[0] === 0) q.shift();

	return `${q.map(pad).join(':')}${q.length ? '' : `${pad((ms % 1000) | 0)} ms`}`;
};

/**
 * Get an audio file's duration, in seconds.
 *
 * @param buffer audio file buffer
 * @param type audio file media type
 * @returns {number} the duration
 */
export const getAudioDuration = (blob: Blob, type: string): Promise<number> =>
	new Promise((res, rej) => {
		const url = window.URL.createObjectURL(blob);
		const audio = new Audio();
		audio.addEventListener('error', (event) => {
			console.error({ error: event.error }, 'Error loading audio file');
			rej(event.error);
		});
		audio.addEventListener('loadedmetadata', () => {
			const duration = audio.duration;
			window.URL.revokeObjectURL(url);
			res(duration);
		});
		audio.src = url;
	});

/**
 * Create HTML audio element from URL.
 *
 * @param url Audio file URL
 * @returns {HTMLAudioElement}
 */
export const createAudio = (url: string | URL): HTMLAudioElement => {
	const audio = new Audio();
	audio.addEventListener('error', (e) =>
		console.error({ error: e.message ?? e.toString() }, 'Error reading audio file')
	);
	audio.addEventListener('canplay', () => audio?.play());
	audio.src = url.toString();

	return audio;
};
