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

/**
 * Get an audio file's duration, in seconds.
 *
 * @param buffer audio file buffer
 * @param type audio file media type
 * @returns the duration
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
