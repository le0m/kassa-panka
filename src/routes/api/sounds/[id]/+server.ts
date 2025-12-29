import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { sounds, soundsTags, tags, soundsCategories, soundsGenres } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';
import { logger } from '$lib/logger';

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
		const { name, description, tags: newTags, categoryId, genreId } = body;

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

		// Handle category if provided
		if (categoryId) {
			// Check if sound is already related to category
			const exists = await db.$count(
				soundsCategories,
				and(eq(soundsCategories.soundId, id), eq(soundsCategories.categoryId, categoryId))
			);

			// Add new category
			if (!exists) {
				await db.insert(soundsCategories).values({
					soundId: id,
					categoryId
				});
			}
		}

		// Handle genre if provided
		if (genreId) {
			// Check if sound is already related to genre
			const exists = await db.$count(
				soundsGenres,
				and(eq(soundsGenres.soundId, id), eq(soundsGenres.genreId, genreId))
			);

			// Add new genre
			if (!exists) {
				await db.insert(soundsGenres).values({
					soundId: id,
					genreId
				});
			}
		}

		return json({ success: true, message: 'Sound updated successfully', sound: result[0] });
	} catch (error) {
		logger.error({ error }, 'Error updating sound');
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
		logger.error({ error }, 'Error deleting sound');
		return json({ error: 'Failed to delete sound' }, { status: 500 });
	}
};
