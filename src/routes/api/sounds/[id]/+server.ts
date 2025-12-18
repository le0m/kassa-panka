import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { sounds, soundsTags, tags } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';

/**
 * PATCH endpoint to update a sound by ID
 * Handles updating name, description, and tags
 */
export const PATCH: RequestHandler = async ({ params, request }) => {
	try {
		const { id } = params;

		if (!id) {
			return json({ error: 'Sound ID is required' }, { status: 400 });
		}

		const body = await request.json();
		const { name, description, tags: newTags } = body;

		// Update sound basic info
		const updateData: { name?: string; description?: string; updatedAt: string } = {
			updatedAt: new Date().toISOString()
		};

		if (name) updateData.name = name;
		if (description !== undefined) updateData.description = description;

		const result = await db.update(sounds).set(updateData).where(eq(sounds.id, id)).returning();

		if (result.length === 0) {
			return json({ error: 'Sound not found' }, { status: 404 });
		}

		// Handle tags if provided
		if (newTags && Array.isArray(newTags)) {
			// Remove existing tags
			await db.delete(soundsTags).where(eq(soundsTags.soundId, id));

			// Add new tags
			for (const tagName of newTags) {
				const trimmedTag = tagName.trim().toLowerCase();
				if (!trimmedTag) continue;

				// Find or create tag
				let tag = await db.query.tags.findFirst({
					where: { name: trimmedTag }
				});

				if (!tag) {
					const newTagResult = await db.insert(tags).values({ name: trimmedTag }).returning();
					tag = newTagResult[0];
				}

				// Link tag to sound
				await db.insert(soundsTags).values({
					soundId: id,
					tagId: tag.id
				});
			}
		}

		return json({ success: true, message: 'Sound updated successfully', sound: result[0] });
	} catch (error) {
		console.error('Error updating sound:', error);
		return json({ error: 'Failed to update sound' }, { status: 500 });
	}
};

/**
 * DELETE endpoint to soft-delete a sound by ID
 * Sets the deletedAt timestamp instead of physically removing the record
 */
export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;

		if (!id) {
			return json({ error: 'Sound ID is required' }, { status: 400 });
		}

		// Soft delete by setting deletedAt timestamp
		const result = await db
			.update(sounds)
			.set({ deletedAt: new Date().toISOString() })
			.where(eq(sounds.id, id))
			.returning();

		if (result.length === 0) {
			return json({ error: 'Sound not found' }, { status: 404 });
		}

		return json({ success: true, message: 'Sound deleted successfully' });
	} catch (error) {
		console.error('Error deleting sound:', error);
		return json({ error: 'Failed to delete sound' }, { status: 500 });
	}
};
