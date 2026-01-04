import type { RequestHandler } from './$types';
import { indexSounds } from '$lib/server/opensearch';
import { error } from '@sveltejs/kit';
import { logger } from '$lib/logger';

export const GET: RequestHandler = async () => {
	if (!indexSounds) {
		error(500, 'Search not configured');
	}

	// Stream indexing progress
	const itr = indexSounds();
	const stream = new ReadableStream({
		async pull(controller) {
			try {
				const sounds = await itr.next();

				if (sounds.done) {
					controller.close();

					return;
				}

				controller.enqueue(JSON.stringify(sounds.value));
			} catch (e) {
				logger.error(
					{ error: (e as Error).message ?? (e as Error).toString() },
					'Error indexing sound files'
				);
				controller.error(e);
			}
		}
	});

	return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } });
};
