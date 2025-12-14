<script lang="ts">
	import { base } from '$app/paths';

	interface Props {
		sound: {
			id: string;
			name: string;
			description?: string | null;
			fileName: string;
			fileSize: number;
			mediaType: string;
			createdAt: string;
			tags?: string[];
		};
		deleting: string | null;
		ondelete: (id: string, name: string) => void;
		onedit: (sound: Props['sound']) => void;
	}

	let { sound, deleting, ondelete, onedit }: Props = $props();

	/**
	 * Handles the delete button click
	 */
	function handleDeleteClick() {
		ondelete(sound.id, sound.name);
	}

	/**
	 * Handles the edit button click
	 */
	function handleEditClick() {
		onedit(sound);
	}
</script>

<div
	class="rounded-lg border border-slate-700 bg-slate-800 p-4 shadow-md transition-all hover:border-slate-600 hover:shadow-lg"
>
	<div class="mb-2 flex items-start justify-between">
		<h3 class="flex-1 text-lg font-semibold text-slate-100">{sound.name}</h3>
		<div class="flex gap-1">
			<button
				onclick={handleEditClick}
				class="rounded p-1 text-indigo-400 transition-colors hover:bg-slate-700 hover:text-indigo-300"
				aria-label="Edit sound"
				title="Edit sound"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
					></path>
				</svg>
			</button>
			<button
				onclick={handleDeleteClick}
				disabled={deleting === sound.id}
				class="ml-2 rounded p-1 text-rose-400 transition-colors hover:bg-slate-700 hover:text-rose-300 disabled:cursor-not-allowed disabled:text-slate-600"
				aria-label="Delete sound"
				title="Delete sound"
			>
				{#if deleting === sound.id}
					<svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
				{:else}
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
						></path>
					</svg>
				{/if}
			</button>
		</div>
	</div>

	{#if sound.description}
		<p class="mb-3 text-sm text-slate-400">{sound.description}</p>
	{/if}

	{#if sound.tags && sound.tags.length > 0}
		<div class="mb-3 flex flex-wrap gap-1.5">
			{#each sound.tags as tag (tag)}
				<span
					class="inline-flex items-center rounded-full border border-cyan-700/50 bg-cyan-900/40 px-2.5 py-0.5 text-xs text-cyan-300"
				>
					{tag}
				</span>
			{/each}
		</div>
	{/if}

	<audio controls class="mb-2 w-full">
		<source src="{base}/sounds/{sound.fileName}" type={sound.mediaType} />
		Your browser does not support the audio element.
	</audio>

	<div class="mt-2 text-xs text-slate-500">
		<div>Size: {(sound.fileSize / 1024).toFixed(2)} KB</div>
		<div>Added: {new Date(sound.createdAt).toLocaleDateString()}</div>
	</div>
</div>
