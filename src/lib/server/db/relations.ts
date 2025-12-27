import { defineRelations } from 'drizzle-orm';
import * as schema from './schema';

export const relations = defineRelations(schema, (r) => ({
	sounds: {
		tags: r.many.tags({
			from: r.sounds.id.through(r.soundsTags.soundId),
			to: r.tags.id.through(r.soundsTags.tagId)
		}),
		categories: r.many.categories({
			from: r.sounds.id.through(r.soundsCategories.soundId),
			to: r.categories.id.through(r.soundsCategories.categoryId)
		}),
		genres: r.many.genres({
			from: r.sounds.id.through(r.soundsGenres.soundId),
			to: r.genres.id.through(r.soundsGenres.genreId)
		}),
		scenes: r.many.scenes({
			from: r.sounds.id.through(r.scenesSounds.soundId),
			to: r.scenes.id.through(r.scenesSounds.sceneId)
		}),
		soundScenes: r.many.scenesSounds() // this is the junction table, which has metadata
	},
	scenes: {
		sounds: r.many.sounds(),
		sceneSounds: r.many.scenesSounds() // this is the junction table, which has metadata
	},
	tags: {
		sounds: r.many.sounds()
	},
	categories: {
		sounds: r.many.sounds()
	},
	genres: {
		sounds: r.many.sounds()
	},
	scenesSounds: {
		scene: r.one.scenes({
			from: r.scenesSounds.sceneId,
			to: r.scenes.id
		}),
		sound: r.one.sounds({
			from: r.scenesSounds.soundId,
			to: r.sounds.id
		})
	}
}));
