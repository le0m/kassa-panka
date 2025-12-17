<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import SceneModal from '$lib/elements/SceneModal.svelte';
	import SceneCard from '$lib/elements/SceneCard.svelte';
	import type { SceneWithSounds } from '$lib/server/db';

	interface Props {
		scenes: SceneWithSounds[];
	}

	const { scenes }: Props = $props();

	let isModalOpen = $state(false);
	let editScene = $state<SceneWithSounds | null>(null);
	let deletingScene = $state<string | null>(null);

	/**
	 * Handles editing a scene
	 * @param scene - The scene data to edit
	 */
	function handleEditScene(scene: SceneWithSounds) {
		editScene = scene;
		isModalOpen = true;
	}

	/**
	 * Handles scene deletion with confirmation
	 * @param sceneId - The ID of the scene to delete
	 * @param sceneName - The name of the scene (for confirmation message)
	 */
	async function handleDeleteScene(sceneId: string, sceneName: string) {
		const confirmed = confirm(
			`Are you sure you want to delete "${sceneName}"?\n\nThis action can be undone by a database administrator.`
		);

		if (!confirmed) {
			return;
		}

		deletingScene = sceneId;

		try {
			const response = await fetch(`/api/scenes/${sceneId}`, {
				method: 'DELETE'
			});

			const result = await response.json();

			if (!response.ok) {
				alert(result.error || 'Failed to delete scene');
				return;
			}

			// Refresh the page data to remove the deleted scene
			await invalidateAll();
		} catch (error) {
			console.error('Delete error:', error);
			alert('Network error occurred while deleting scene');
		} finally {
			deletingScene = null;
		}
	}

	/**
	 * Opens the scene modal for creating a new scene
	 */
	function openModal() {
		editScene = null;
		isModalOpen = true;
	}

	/**
	 * Closes the scene modal
	 */
	function closeModal() {
		isModalOpen = false;
		editScene = null;
	}
</script>

<!-- Scene Modal -->
<SceneModal isOpen={isModalOpen} {editScene} onClose={closeModal} />

<div class="mb-4 flex items-center justify-between">
	<h2 class="text-2xl font-semibold text-slate-100">Scenes</h2>
	<button
		onclick={openModal}
		class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-colors hover:bg-indigo-700 hover:shadow-lg"
	>
		Create Scene
	</button>
</div>

{#if scenes.length === 0}
	<div class="rounded-lg border border-slate-700 bg-slate-800/30 p-8 text-center">
		<p class="mb-4 text-slate-400">No scenes yet. Create your first scene!</p>
	</div>
{:else}
	<div class="flex flex-col gap-4">
		{#each scenes as scene (scene.id)}
			<SceneCard
				{scene}
				deleting={deletingScene}
				ondelete={handleDeleteScene}
				onedit={handleEditScene}
			/>
		{/each}
	</div>
{/if}
