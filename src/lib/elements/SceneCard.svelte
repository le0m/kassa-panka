<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { SoundCategory } from '$lib';
	import type { SceneSoundFull, SceneFull } from '$lib/server/db';
	import { DragState } from '$lib/drag-and-drop/drag-state.svelte';
	import CategorySoundList from './CategorySoundList.svelte';
	import IconEdit from './icons/IconEdit.svelte';
	import IconSave from './icons/IconSave.svelte';
	import IconSpinner from './icons/IconSpinner.svelte';
	import IconTrash from './icons/IconTrash.svelte';
	import IconX from './icons/IconX.svelte';
	import { logger } from '$lib/logger';

	interface Props {
		scene: SceneFull;
		deleting: string | null;
		onclick: (scene: SceneFull) => void;
		ondelete: (id: string, name: string) => void;
		onedit: (scene: SceneFull) => void;
		updateSuccess?: boolean;
		updateError?: boolean;
	}

	let {
		scene,
		deleting,
		onclick,
		ondelete,
		onedit,
		updateSuccess = false,
		updateError = false
	}: Props = $props();

	const dragState = new DragState();

	// Filter sounds by category
	let ambienceSounds = $derived(
		scene?.sceneSounds.filter((sceSo) =>
			sceSo.sound?.categories.some((c) => c.name === SoundCategory.Ambience)
		) ?? []
	);
	let musicSounds = $derived(
		scene?.sceneSounds.filter((sceSo) =>
			sceSo.sound?.categories.some((c) => c.name === SoundCategory.Music)
		) ?? []
	);
	let sfxSounds = $derived(
		scene?.sceneSounds.filter((sceSo) =>
			sceSo.sound?.categories.some((c) => c.name === SoundCategory.SFX)
		) ?? []
	);

	/**
	 * Handles the delete button click
	 */
	function handleDeleteClick() {
		ondelete(scene.id, scene.name);
	}

	/**
	 * Handles the edit button click
	 */
	function handleEditClick() {
		onedit(scene);
	}

	/**
	 * Adds a sound to the scene at the specified position
	 */
	async function handleAddSound(soundId: string, position: number) {
		dragState.clearError();

		try {
			const response = await fetch(`/api/scenes/${scene.id}/sounds`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ soundId, position })
			});

			const result = await response.json();

			if (!response.ok) {
				dragState.showError();
				alert(result.error || 'Failed to link sound to scene');
				throw new Error(result.error || 'Failed to link sound to scene');
			}

			dragState.showSuccess();
			await invalidateAll();
		} catch (error) {
			logger.error({ error }, 'Error linking sound to scene');
			dragState.showError();
			throw error;
		}
	}

	/**
	 * Reorders sounds in the scene
	 */
	async function handleReorderSounds(soundUpdates: Array<{ id: string; position: number }>) {
		dragState.clearError();

		try {
			const response = await fetch(`/api/scenes/${scene.id}/sounds`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sounds: soundUpdates })
			});

			const result = await response.json();

			if (!response.ok) {
				dragState.showError();
				alert(result.error || 'Failed to reorder sounds');
				throw new Error(result.error || 'Failed to reorder sounds');
			}

			dragState.showSuccess();
			await invalidateAll();
		} catch (error) {
			logger.error({ error }, 'Error reordering sounds');
			dragState.showError();
			throw error;
		}
	}

	/**
	 * Removes a sound from the scene
	 */
	async function handleRemoveSound(sceneSound: SceneSoundFull) {
		const confirmed = confirm(
			`Remove "${sceneSound.sound!.name}" from "${scene.name}"?\n\nThis will not delete the sound, only remove it from this scene.`
		);

		if (!confirmed) return;

		dragState.removingSound = sceneSound.id;
		dragState.clearError();

		try {
			const response = await fetch(`/api/scenes/${scene.id}/sounds?sceneSoundId=${sceneSound.id}`, {
				method: 'DELETE'
			});

			const result = await response.json();

			if (!response.ok) {
				dragState.showError();
				logger.error(
					{ message: result.error, status: response.statusText, code: response.status },
					'Failed to remove sound'
				);
				return;
			}

			dragState.showSuccess();
			await invalidateAll();
		} catch (error) {
			logger.error({ error }, 'Error removing sound from scene');
			dragState.showError();
		} finally {
			dragState.removingSound = null;
		}
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="m-4 flex flex-col gap-4 rounded-lg border border-slate-700 bg-slate-800/50 p-4 transition-all hover:border-indigo-500/50 hover:bg-slate-800"
	onclick={() => onclick(scene)}
>
	<div class="flex flex-col gap-2">
		<!-- Header -->
		<div class="flex">
			<div class="flex flex-1 gap-2">
				<h3 class="text-lg font-semibold text-slate-100">{scene.name}</h3>
				{#if dragState.saveError || updateError}
					<IconX class="h-4 w-4 text-rose-400" />
				{:else if dragState.savingSound || dragState.removingSound}
					<IconSpinner class="h-4 w-4 animate-spin text-indigo-400" />
				{:else if dragState.saveSuccess || updateSuccess}
					<IconSave class="h-4 w-4 text-emerald-400" />
				{/if}
			</div>

			<div class="flex gap-2">
				<button
					onclick={handleEditClick}
					class="rounded p-1 text-indigo-400 transition-colors hover:bg-slate-700 hover:text-indigo-300"
					aria-label="Edit scene"
					title="Edit scene"
				>
					<IconEdit />
				</button>
				<button
					onclick={handleDeleteClick}
					disabled={deleting === scene.id}
					class="ml-2 rounded p-1 text-rose-400 transition-colors hover:bg-slate-700 hover:text-rose-300 disabled:cursor-not-allowed disabled:text-slate-600"
					aria-label="Delete scene"
					title="Delete scene"
				>
					{#if deleting === scene.id}
						<IconSpinner />
					{:else}
						<IconTrash />
					{/if}
				</button>
			</div>
		</div>

		<!-- Description -->
		{#if scene.description}
			<p class="mt-1 text-sm text-slate-400">{scene.description}</p>
		{/if}
	</div>

	<!-- Linked Sounds Lists by Category -->
	<div class="flex flex-col gap-4">
		<CategorySoundList
			sceneId={scene.id}
			category={SoundCategory.Ambience}
			label="Ambience"
			sounds={ambienceSounds}
			savingId={dragState.savingSound}
			onremove={handleRemoveSound}
			onaddsound={handleAddSound}
			onreorder={handleReorderSounds}
		/>

		<CategorySoundList
			sceneId={scene.id}
			category={SoundCategory.Music}
			label="Music"
			sounds={musicSounds}
			savingId={dragState.savingSound}
			onremove={handleRemoveSound}
			onaddsound={handleAddSound}
			onreorder={handleReorderSounds}
		/>

		<CategorySoundList
			sceneId={scene.id}
			category={SoundCategory.SFX}
			label="SFX"
			sounds={sfxSounds}
			savingId={dragState.savingSound}
			onremove={handleRemoveSound}
			onaddsound={handleAddSound}
			onreorder={handleReorderSounds}
		/>
	</div>
</div>
