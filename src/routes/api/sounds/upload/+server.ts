import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { sounds, tags, soundsTags, soundsCategories, soundsGenres } from '$lib/server/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { eq } from 'drizzle-orm';
import { logger } from '$lib/logger';

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
		const tagsJson = formData.get('tags') as string | null;
		const categoryId = formData.get('categoryId') as string | null;
		const genreId = formData.get('genreId') as string | null;
		const duration = formData.get('duration') as string | null;

		if (!file) {
			return json({ error: 'No file provided' }, { status: 400 });
		}

		if (!name) {
			return json({ error: 'Name is required' }, { status: 400 });
		}

		if (!duration) {
			return json({ error: 'Duration is required' }, { status: 400 });
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
		const [newSound] = await db
			.insert(sounds)
			.values({
				name,
				description: description || null,
				fileName,
				fileSize: file.size,
				duration: parseInt(duration, 10),
				mediaType: file.type
			})
			.returning();

		// Handle tags if provided
		if (tagsJson) {
			try {
				const tagNames: string[] = JSON.parse(tagsJson);

				if (tagNames.length > 0) {
					const tagIds: string[] = [];

					// Process each tag
					for (const tagName of tagNames) {
						const trimmedTag = tagName.trim().toLowerCase();
						if (!trimmedTag) continue;

						// Check if tag already exists
						const existingTags = await db
							.select()
							.from(tags)
							.where(eq(tags.name, trimmedTag))
							.limit(1);

						let tagId: string;

						if (existingTags.length > 0) {
							// Use existing tag
							tagId = existingTags[0].id;
						} else {
							// Create new tag
							const [newTag] = await db
								.insert(tags)
								.values({
									name: trimmedTag
								})
								.returning();
							tagId = newTag.id;
						}

						tagIds.push(tagId);
					}

					// Create associations between sound and tags
					if (tagIds.length > 0) {
						await db.insert(soundsTags).values(
							tagIds.map((tagId) => ({
								soundId: newSound.id,
								tagId
							}))
						);
					}
				}
			} catch (error) {
				logger.error({ error }, 'Error processing tags');
				// Continue without tags rather than failing the entire upload
			}
		}

		// Handle category if provided
		if (categoryId) {
			try {
				await db.insert(soundsCategories).values({
					soundId: newSound.id,
					categoryId
				});
			} catch (error) {
				logger.error({ error }, 'Error associating category');
				// Continue without category rather than failing the entire upload
			}
		}

		// Handle genre if provided
		if (genreId) {
			try {
				await db.insert(soundsGenres).values({
					soundId: newSound.id,
					genreId
				});
			} catch (error) {
				logger.error({ error }, 'Error associating genre');
				// Continue without genre rather than failing the entire upload
			}
		}

		return json({ success: true, sound: newSound }, { status: 201 });
	} catch (error) {
		logger.error({ error }, 'Error uploading sound');
		return json({ error: 'Failed to upload sound' }, { status: 500 });
	}
};
