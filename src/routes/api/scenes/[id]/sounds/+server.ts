import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { scenesSounds, scenes, sounds } from '$lib/server/db';
import { eq, and, isNull, desc } from 'drizzle-orm';
import type { RequestHandler } from './$types';

/**
 * Add a sound to a scene (create relation in scenes_sounds table)
 */
export const POST: RequestHandler = async ({ params, request }) => {
	const sceneId = params.id;
	const { soundId } = await request.json();

	if (!soundId) {
		return json({ error: 'Sound ID is required' }, { status: 400 });
	}

	try {
		// Verify scene exists and is not deleted
		const scene = await db
			.select()
			.from(scenes)
			.where(and(eq(scenes.id, sceneId), isNull(scenes.deletedAt)))
			.limit(1);

		if (scene.length === 0) {
			return json({ error: 'Scene not found' }, { status: 404 });
		}

		// Verify sound exists and is not deleted
		const sound = await db
			.select()
			.from(sounds)
			.where(and(eq(sounds.id, soundId), isNull(sounds.deletedAt)))
			.limit(1);

		if (sound.length === 0) {
			return json({ error: 'Sound not found' }, { status: 404 });
		}

		// Get latest sound position
		const latestSound = await db
			.select({ position: scenesSounds.position })
			.from(scenesSounds)
			.where(eq(scenesSounds.sceneId, sceneId))
			.orderBy(desc(scenesSounds.position))
			.limit(1);

		// Create the relation
		await db.insert(scenesSounds).values({
			sceneId,
			soundId,
			position: latestSound?.[0].position ?? 0
		});

		return json({ success: true, sceneId, soundId });
	} catch (error) {
		console.error('Error linking sound to scene:', error);
		return json({ error: 'Failed to link sound to scene' }, { status: 500 });
	}
};

/**
 * Remove a sound from a scene (delete relation from scenes_sounds table)
 */
export const DELETE: RequestHandler = async ({ params, url }) => {
	const sceneSoundId = url.searchParams.get('sceneSoundId');

	if (!sceneSoundId) {
		return json({ error: 'Scene-Sound ID is required' }, { status: 400 });
	}

	try {
		// Delete the relation
		const result = await db
			.delete(scenesSounds)
			.where(eq(scenesSounds.id, sceneSoundId))
			.returning();

		if (result.length === 0) {
			return json({ error: 'Relation not found' }, { status: 404 });
		}

		return json({ success: true, sceneSoundId });
	} catch (error) {
		console.error('Error removing sound from scene:', error);
		return json({ error: 'Failed to remove sound from scene' }, { status: 500 });
	}
};
