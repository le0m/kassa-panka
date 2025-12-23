<script lang="ts">
	/**
	 * Current sound metadata display component
	 */
	type Props = {
		/** Current sound name */
		soundName?: string;
		/** Current sound description */
		description?: string;
		/** Array of tags for the current sound */
		tags?: string[];
	};

	let {
		soundName = 'Sound Name',
		description = 'A brief description of the current sound effect playing',
		tags = ['tag1', 'tag2', 'tag3']
	}: Props = $props();
</script>

<h3 class="truncate text-lg font-medium text-white">{soundName}</h3>
<p class="truncate text-sm text-neutral-400">
	{description}
</p>
<div class="mt-1 flex gap-2">
	{#each tags as tag}
		<span class="rounded-full bg-neutral-700 px-2 py-0.5 text-xs text-neutral-300">{tag}</span>
	{/each}
</div>
