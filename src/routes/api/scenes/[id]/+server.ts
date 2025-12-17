import { db } from '$lib/server/db';
import { scenes } from '$lib/server/db';
import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

/**
 * PATCH handler to update an existing scene
 */
export const PATCH: RequestHandler = async ({ params, request }) => {
	try {
		const { id } = params;
		const data = await request.json();
		const { name, description } = data;

		if (!name?.trim()) {
			return json({ error: 'Scene name is required' }, { status: 400 });
		}

		const [updatedScene] = await db
			.update(scenes)
			.set({
				name: name.trim(),
				description: description?.trim() || null,
				updatedAt: new Date().toISOString()
			})
			.where(eq(scenes.id, id))
			.returning();

		if (!updatedScene) {
			return json({ error: 'Scene not found' }, { status: 404 });
		}

		return json({ scene: updatedScene });
	} catch (error) {
		console.error('Error updating scene:', error);
		return json({ error: 'Failed to update scene' }, { status: 500 });
	}
};

/**
 * DELETE handler to soft-delete a scene
 */
export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;

		const [deletedScene] = await db
			.update(scenes)
			.set({
				deletedAt: new Date().toISOString()
			})
			.where(eq(scenes.id, id))
			.returning();

		if (!deletedScene) {
			return json({ error: 'Scene not found' }, { status: 404 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting scene:', error);
		return json({ error: 'Failed to delete scene' }, { status: 500 });
	}
};
