import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { sounds } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

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
