<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { base } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let isModalOpen = $state(false);
	let uploading = $state(false);
	let uploadError = $state<string | null>(null);
	let uploadSuccess = $state(false);

	/**
	 * Opens the upload modal
	 */
	function openModal() {
		isModalOpen = true;
		uploadError = null;
		uploadSuccess = false;
	}

	/**
	 * Closes the upload modal
	 */
	function closeModal() {
		isModalOpen = false;
		uploadError = null;
		uploadSuccess = false;
	}

	/**
	 * Handles the form submission for uploading a new sound file
	 */
	async function handleUpload(event: Event) {
		event.preventDefault();
		const form = event.target as HTMLFormElement;
		const formData = new FormData(form);

		uploading = true;
		uploadError = null;
		uploadSuccess = false;

		try {
			const response = await fetch('/api/sounds/upload', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (!response.ok) {
				uploadError = result.error || 'Upload failed';
				return;
			}

			uploadSuccess = true;
			form.reset();

			// Refresh the page data to show the new sound
			await invalidateAll();

			// Close modal after successful upload
			setTimeout(() => {
				closeModal();
			}, 1500);
		} catch (error) {
			uploadError = 'Network error occurred';
			console.error('Upload error:', error);
		} finally {
			uploading = false;
		}
	}
</script>

<div class="container">
	<header class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="mb-2 text-4xl font-bold">Kassa Panka</h1>
			<p class="text-gray-600">Sound effects for your tabletop gaming sessions</p>
		</div>
		<button
			onclick={openModal}
			class="rounded-md bg-blue-600 px-6 py-3 font-medium text-white shadow-md transition-colors hover:bg-blue-700 hover:shadow-lg"
		>
			Upload Sound
		</button>
	</header>

	<!-- Upload Modal -->
	{#if isModalOpen}
		<div
			class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4"
			onclick={closeModal}
			onkeydown={(e) => e.key === 'Escape' && closeModal()}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<div
				class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => e.stopPropagation()}
				role="document"
				tabindex="0"
			>
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-2xl font-semibold">Upload New Sound</h2>
					<button
						onclick={closeModal}
						class="text-2xl leading-none text-gray-400 hover:text-gray-600"
						aria-label="Close modal"
					>
						&times;
					</button>
				</div>

				<form onsubmit={handleUpload} class="space-y-4">
					<div>
						<label for="name" class="mb-1 block text-sm font-medium text-gray-700">
							Sound Name *
						</label>
						<input
							type="text"
							id="name"
							name="name"
							required
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							placeholder="e.g., Thunder Strike"
						/>
					</div>

					<div>
						<label for="description" class="mb-1 block text-sm font-medium text-gray-700">
							Description
						</label>
						<textarea
							id="description"
							name="description"
							rows={3}
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							placeholder="Optional description..."
						></textarea>
					</div>

					<div>
						<label for="file" class="mb-1 block text-sm font-medium text-gray-700">
							Audio File *
						</label>
						<input
							type="file"
							id="file"
							name="file"
							accept="audio/*"
							required
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
						/>
					</div>

					{#if uploadError}
						<div class="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
							{uploadError}
						</div>
					{/if}

					{#if uploadSuccess}
						<div class="rounded border border-green-200 bg-green-50 px-4 py-3 text-green-700">
							Sound uploaded successfully!
						</div>
					{/if}

					<div class="flex gap-3">
						<button
							type="button"
							onclick={closeModal}
							class="flex-1 rounded-md bg-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-300"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={uploading}
							class="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
						>
							{uploading ? 'Uploading...' : 'Upload'}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- Sound List -->
	<section>
		<h2 class="mb-4 text-2xl font-semibold">Sound Library</h2>

		{#if data.sounds.length === 0}
			<div class="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
				<p class="mb-4 text-gray-500">No sounds yet. Upload your first sound!</p>
				<button
					onclick={openModal}
					class="rounded-md bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
				>
					Upload Sound
				</button>
			</div>
		{:else}
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each data.sounds as sound (sound.id)}
					<div class="rounded-lg bg-white p-4 shadow-md transition-shadow hover:shadow-lg">
						<h3 class="mb-2 text-lg font-semibold">{sound.name}</h3>

						{#if sound.description}
							<p class="mb-3 text-sm text-gray-600">{sound.description}</p>
						{/if}

						<audio controls class="mb-2 w-full">
							<source src="{base}/sounds/{sound.fileName}" type={sound.mediaType} />
							Your browser does not support the audio element.
						</audio>

						<div class="mt-2 text-xs text-gray-500">
							<div>Size: {(sound.fileSize / 1024).toFixed(2)} KB</div>
							<div>Added: {new Date(sound.createdAt).toLocaleDateString()}</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}
</style>
