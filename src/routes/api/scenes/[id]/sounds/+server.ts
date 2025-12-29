import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { scenesSounds, scenes, sounds } from '$lib/server/db';
import { eq, and, isNull, desc } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { logger } from '$lib/logger';

/**
 * Add a sound to a scene (create relation in scenes_sounds table)
 */
export const POST: RequestHandler = async ({ params, request }) => {
	const sceneId = params.id;
	const { soundId, position } = await request.json();

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

		// Determine position
		let insertPosition: number;
		if (position !== undefined && position !== null) {
			// Position specified - we'll need to shift existing sounds
			insertPosition = position;

			// Get all sounds at or after this position
			const existingSounds = await db
				.select()
				.from(scenesSounds)
				.where(eq(scenesSounds.sceneId, sceneId))
				.orderBy(scenesSounds.position);

			// Shift positions of sounds at or after the insert position
			for (const existingSound of existingSounds) {
				if (existingSound.position >= insertPosition) {
					await db
						.update(scenesSounds)
						.set({ position: existingSound.position + 1 })
						.where(eq(scenesSounds.id, existingSound.id));
				}
			}
		} else {
			// No position specified - add at the end
			const latestSound = await db
				.select({ position: scenesSounds.position })
				.from(scenesSounds)
				.where(eq(scenesSounds.sceneId, sceneId))
				.orderBy(desc(scenesSounds.position))
				.limit(1);

			insertPosition = (latestSound?.[0]?.position ?? -1) + 1;
		}

		// Create the relation
		await db.insert(scenesSounds).values({
			sceneId,
			soundId,
			position: insertPosition
		});

		return json({ success: true, sceneId, soundId });
	} catch (error) {
		logger.error({ error }, 'Error linking sound to scene');
		return json({ error: 'Failed to link sound to scene' }, { status: 500 });
	}
};

/**
 * Update positions of sounds in a scene
 */
export const PATCH: RequestHandler = async ({ params, request }) => {
	const sceneId = params.id;
	const { sounds: soundsToUpdate } = await request.json();

	if (!soundsToUpdate || !Array.isArray(soundsToUpdate)) {
		return json({ error: 'Sounds array is required' }, { status: 400 });
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

		// Update each sound's position
		for (const sound of soundsToUpdate) {
			await db
				.update(scenesSounds)
				.set({ position: sound.position })
				.where(eq(scenesSounds.id, sound.id));
		}

		return json({ success: true, sceneId });
	} catch (error) {
		logger.error({ error }, 'Error updating sound positions');
		return json({ error: 'Failed to update sound positions' }, { status: 500 });
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
		logger.error({ error }, 'Error removing sound from scene');
		return json({ error: 'Failed to remove sound from scene' }, { status: 500 });
	}
};
