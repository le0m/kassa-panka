import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { scenesSounds, scenes, sounds } from '$lib/server/db';
import { eq, and, isNull } from 'drizzle-orm';
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

		// Check if relation already exists
		const existing = await db
			.select()
			.from(scenesSounds)
			.where(and(eq(scenesSounds.sceneId, sceneId), eq(scenesSounds.soundId, soundId)))
			.limit(1);

		if (existing.length > 0) {
			return json({ error: 'Sound already linked to this scene' }, { status: 400 });
		}

		// Create the relation
		await db.insert(scenesSounds).values({
			sceneId,
			soundId
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
	const sceneId = params.id;
	const soundId = url.searchParams.get('soundId');

	if (!soundId) {
		return json({ error: 'Sound ID is required' }, { status: 400 });
	}

	try {
		// Delete the relation
		const result = await db
			.delete(scenesSounds)
			.where(and(eq(scenesSounds.sceneId, sceneId), eq(scenesSounds.soundId, soundId)))
			.returning();

		if (result.length === 0) {
			return json({ error: 'Relation not found' }, { status: 404 });
		}

		return json({ success: true, sceneId, soundId });
	} catch (error) {
		console.error('Error removing sound from scene:', error);
		return json({ error: 'Failed to remove sound from scene' }, { status: 500 });
	}
};
