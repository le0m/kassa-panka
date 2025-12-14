<script lang="ts">
	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

<aside class="flex h-full w-80 flex-col border-r border-slate-700 bg-slate-800/50 backdrop-blur-sm">
	<div class="flex-1 overflow-y-auto p-4">
		<h2 class="mb-4 text-lg font-semibold text-slate-100">Sound Library</h2>
		<div class="flex flex-col gap-3">
			{@render children()}
		</div>
	</div>
</aside>
