import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { scenesSounds } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

/**
 * Update a scene-sound relation (e.g., loop property)
 */
export const PATCH: RequestHandler = async ({ params, request }) => {
	const sceneSoundId = params.id;
	const body = await request.json();

	try {
		// Build the update object with only the provided fields
		const updateData: { loop?: boolean } = {};

		if (body.loop !== undefined) {
			updateData.loop = body.loop;
		}

		if (Object.keys(updateData).length === 0) {
			return json({ error: 'No update data provided' }, { status: 400 });
		}

		// Update the scene-sound relation
		const result = await db
			.update(scenesSounds)
			.set(updateData)
			.where(eq(scenesSounds.id, sceneSoundId))
			.returning();

		if (result.length === 0) {
			return json({ error: 'Scene-sound not found' }, { status: 404 });
		}

		return json({ success: true, sceneSound: result[0] });
	} catch (error) {
		console.error('Error updating scene-sound:', error);
		return json({ error: 'Failed to update scene-sound' }, { status: 500 });
	}
};
