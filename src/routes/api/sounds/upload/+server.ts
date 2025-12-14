import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { sounds } from '$lib/server/db/schema';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

/**
 * POST endpoint to upload a new sound file
 * Saves the file to static/sounds/ and creates a database record
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File | null;
		const name = formData.get('name') as string | null;
		const description = formData.get('description') as string | null;

		if (!file) {
			return json({ error: 'No file provided' }, { status: 400 });
		}

		if (!name) {
			return json({ error: 'Name is required' }, { status: 400 });
		}

		// Validate file type (audio only)
		if (!file.type.startsWith('audio/')) {
			return json({ error: 'File must be an audio file' }, { status: 400 });
		}

		// Generate a unique filename to avoid collisions
		const timestamp = Date.now();
		const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
		const fileName = `${timestamp}_${sanitizedOriginalName}`;
		const filePath = join('static', 'sounds', fileName);

		// Ensure the sounds directory exists
		await mkdir(join('static', 'sounds'), { recursive: true });

		// Save file to disk
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		await writeFile(filePath, buffer);

		// Create database record
		const [newSound] = await db.insert(sounds).values({
			name,
			description: description || null,
			fileName,
			fileSize: file.size,
			mediaType: file.type,
		}).returning();

		return json({ success: true, sound: newSound }, { status: 201 });
	} catch (error) {
		console.error('Error uploading sound:', error);
		return json({ error: 'Failed to upload sound' }, { status: 500 });
	}
};
