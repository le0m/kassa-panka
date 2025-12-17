import { defineRelations } from 'drizzle-orm';
import * as schema from './schema';

export const relations = defineRelations(schema, (r) => ({
	sounds: {
		tags: r.many.tags({
			from: r.sounds.id.through(r.soundsTags.soundId),
			to: r.tags.id.through(r.soundsTags.tagId)
		}),
		scenes: r.many.scenes({
			from: r.sounds.id.through(r.scenesSounds.soundId),
			to: r.scenes.id.through(r.scenesSounds.sceneId)
		})
	},
	scenes: {
		sounds: r.many.sounds()
	},
	tags: {
		sounds: r.many.sounds()
	}
}));
