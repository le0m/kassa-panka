<script lang="ts">
	import { getContext } from 'svelte';
	import { logger } from '$lib/logger';
	import type { SceneFull } from '$lib/server/db';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
		editScene?: SceneFull | null;
		onSuccess?: (sceneId: string) => void;
		onError?: (sceneId: string) => void;
	}

	let { isOpen, onClose, editScene = null, onSuccess, onError }: Props = $props();

	let submitting = $state(false);
	let submitError = $state<string | null>(null);
	let submitSuccess = $state(false);
	let formName = $state('');
	let formDescription = $state('');

	let isEditMode = $derived(editScene !== null);

	let invalidateAll = getContext<() => Promise<void>>('invalidate');

	/**
	 * Initialize form with edit data when modal opens in edit mode
	 */
	$effect(() => {
		if (isOpen && editScene) {
			formName = editScene.name;
			formDescription = editScene.description || '';
			submitError = null;
			submitSuccess = false;
		} else if (isOpen && !editScene) {
			// Reset form for create mode
			formName = '';
			formDescription = '';
			submitError = null;
			submitSuccess = false;
		}
	});

	/**
	 * Handles the form submission for creating or updating a scene
	 */
	const handleSubmit = async (event: Event) => {
		event.preventDefault();

		if (!formName.trim()) {
			submitError = 'Scene name is required';
			return;
		}

		submitting = true;
		submitError = null;
		submitSuccess = false;

		try {
			const url = isEditMode ? `/api/scenes/${editScene!.id}` : '/api/scenes';
			const method = isEditMode ? 'PATCH' : 'POST';

			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: formName.trim(),
					description: formDescription.trim() || null
				})
			});

			const result = await response.json();

			if (!response.ok) {
				submitError = result.error || `Failed to ${isEditMode ? 'update' : 'create'} scene`;
				if (onError && editScene) {
					onError(editScene.id);
				}
				return;
			}

			submitSuccess = true;

			// Refresh the page data to show the new/updated scene
			await invalidateAll();

			// Notify parent of success
			if (onSuccess) {
				const sceneId = isEditMode ? editScene!.id : result.scene?.id;
				if (sceneId) {
					onSuccess(sceneId);
				}
			}

			// Close modal immediately after successful submission
			onClose();
		} catch (error) {
			submitError = 'Network error occurred';
			logger.error({ error }, 'Submit error');
			if (onError && editScene) {
				onError(editScene.id);
			}
		} finally {
			submitting = false;
		}
	};

	/**
	 * Handles modal close with cleanup
	 */
	const handleClose = () => {
		if (!submitting) {
			onClose();
		}
	};

	/**
	 * Handles clicking outside the modal to close it
	 */
	const handleBackdropClick = (event: MouseEvent) => {
		if (event.target === event.currentTarget) {
			handleClose();
		}
	};
</script>

{#if isOpen}
	<!-- svelte-ignore a11y_interactive_supports_focus -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
		onclick={handleBackdropClick}
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
	>
		<div class="w-full max-w-md rounded-lg border border-slate-700 bg-slate-800 p-6 shadow-xl">
			<h2 id="modal-title" class="mb-4 text-2xl font-semibold text-slate-100">
				{isEditMode ? 'Edit Scene' : 'Create New Scene'}
			</h2>

			<form onsubmit={handleSubmit} class="space-y-4">
				<!-- Name Field -->
				<div>
					<label for="name" class="mb-1 block text-sm font-medium text-slate-300">
						Name <span class="text-rose-400">*</span>
					</label>
					<input
						type="text"
						id="name"
						bind:value={formName}
						required
						disabled={submitting}
						class="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
						placeholder="Enter scene name"
					/>
				</div>

				<!-- Description Field -->
				<div>
					<label for="description" class="mb-1 block text-sm font-medium text-slate-300">
						Description
					</label>
					<textarea
						id="description"
						bind:value={formDescription}
						disabled={submitting}
						rows="3"
						class="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
						placeholder="Enter scene description (optional)"
					></textarea>
				</div>

				<!-- Error Message -->
				{#if submitError}
					<div
						class="rounded-md border border-rose-400/50 bg-rose-900/20 p-3 text-sm text-rose-400"
					>
						{submitError}
					</div>
				{/if}

				<!-- Success Message -->
				{#if submitSuccess}
					<div
						class="rounded-md border border-emerald-400/50 bg-emerald-900/20 p-3 text-sm text-emerald-400"
					>
						Scene {isEditMode ? 'updated' : 'created'} successfully!
					</div>
				{/if}

				<!-- Form Actions -->
				<div class="flex justify-end gap-3">
					<button
						type="button"
						onclick={handleClose}
						disabled={submitting}
						class="rounded-md border border-slate-700 px-4 py-2 text-slate-300 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={submitting}
						class="rounded-md bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if submitting}
							{isEditMode ? 'Updating...' : 'Creating...'}
						{:else}
							{isEditMode ? 'Update Scene' : 'Create Scene'}
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
