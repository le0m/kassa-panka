<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import SceneModal from '$lib/elements/SceneModal.svelte';
	import SceneCard from '$lib/elements/SceneCard.svelte';
	import type { SceneWithSoundsFull } from '$lib/server/db';

	interface Props {
		scenes: SceneWithSoundsFull[];
	}

	const { scenes }: Props = $props();

	let isModalOpen = $state(false);
	let editScene = $state<SceneWithSoundsFull | null>(null);
	let deletingScene = $state<string | null>(null);
	let sceneSuccess = $state<string | null>(null); // ID of scene that was successfully saved
	let sceneError = $state<string | null>(null); // ID of scene that had an error

	/**
	 * Handles editing a scene
	 * @param scene - The scene data to edit
	 */
	function handleEditScene(scene: SceneWithSoundsFull) {
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

	/**
	 * Handles successful scene save/update
	 * @param sceneId - The ID of the saved scene
	 */
	function handleSceneSuccess(sceneId: string) {
		sceneSuccess = sceneId;
		sceneError = null;
		setTimeout(() => {
			sceneSuccess = null;
		}, 1000);
	}

	/**
	 * Handles scene save/update error
	 * @param sceneId - The ID of the scene that failed
	 */
	function handleSceneError(sceneId: string) {
		sceneError = sceneId;
		sceneSuccess = null;
	}
</script>

<!-- Scene Modal -->
<SceneModal
	isOpen={isModalOpen}
	{editScene}
	onClose={closeModal}
	onSuccess={handleSceneSuccess}
	onError={handleSceneError}
/>

<div class="flex h-full flex-col gap-1">
	<div class="flex px-6">
		<h2 class="flex-1 text-2xl font-semibold text-slate-100">Scenes</h2>
		<button
			onclick={openModal}
			class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-colors hover:bg-indigo-700 hover:shadow-lg"
		>
			Create Scene
		</button>
	</div>

	{#if scenes.length === 0}
		<div class="m-6 rounded-lg border border-slate-700 bg-slate-800/30 p-8 text-center">
			<p class="text-slate-400">No scenes yet. Create your first scene!</p>
		</div>
	{:else}
		<div class="min-h-0 flex-1 overflow-y-auto px-2">
			{#each scenes as scene (scene.id)}
				<SceneCard
					{scene}
					deleting={deletingScene}
					ondelete={handleDeleteScene}
					onedit={handleEditScene}
					updateSuccess={sceneSuccess === scene.id}
					updateError={sceneError === scene.id}
				/>
			{/each}
		</div>
	{/if}
</div>
