import { db } from '$lib/server/db';
import { scenes } from '$lib/server/db';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { desc, isNull } from 'drizzle-orm';
import { logger } from '$lib/logger';

/**
 * GET handler to fetch all non-deleted scenes
 */
export const GET: RequestHandler = async () => {
	try {
		const allScenes = await db
			.select()
			.from(scenes)
			.where(isNull(scenes.deletedAt))
			.orderBy(desc(scenes.createdAt));

		return json({ scenes: allScenes });
	} catch (error) {
		logger.error({ error }, 'Error fetching scenes');
		return json({ error: 'Failed to fetch scenes' }, { status: 500 });
	}
};

/**
 * POST handler to create a new scene
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		const { name, description } = data;

		if (!name?.trim()) {
			return json({ error: 'Scene name is required' }, { status: 400 });
		}

		const [newScene] = await db
			.insert(scenes)
			.values({
				name: name.trim(),
				description: description?.trim() || null
			})
			.returning();

		return json({ scene: newScene }, { status: 201 });
	} catch (error) {
		logger.error({ error }, 'Error creating scene');
		return json({ error: 'Failed to create scene' }, { status: 500 });
	}
};
