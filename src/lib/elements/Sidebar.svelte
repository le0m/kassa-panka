<script lang="ts">
	interface Props {
		children: import('svelte').Snippet;
		onsearch: (query: string) => void;
		onupload: () => void;
	}

	let { children, onsearch, onupload }: Props = $props();

	let searchQuery = $state('');

	/**
	 * Initialize search query from URL on mount
	 */
	$effect(() => {
		if (typeof window !== 'undefined') {
			const url = new URL(window.location.href);
			searchQuery = url.searchParams.get('q') || '';
		}
	});

	/**
	 * Handles search input changes
	 */
	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		searchQuery = target.value;
	}

	/**
	 * Handles search when Enter is pressed
	 */
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			onsearch(searchQuery);
		}
	}
</script>

<aside class="flex h-full w-80 flex-col border-r border-slate-700 bg-slate-800/50 backdrop-blur-sm">
	<!-- Fixed Header Section -->
	<div class="border-b border-slate-700 p-4">
		<h2 class="mb-3 text-lg font-semibold text-slate-100">Sound Library</h2>

		<!-- Upload Button -->
		<button
			onclick={onupload}
			class="mb-3 w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-colors hover:bg-indigo-700 hover:shadow-lg"
		>
			Upload Sound
		</button>

		<!-- Search -->
		<div class="relative">
			<input
				type="text"
				bind:value={searchQuery}
				oninput={handleInput}
				onkeydown={handleKeydown}
				class="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 pl-9 text-sm text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
				placeholder="Search sounds..."
			/>
			<svg
				class="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-slate-400"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
				></path>
			</svg>
		</div>
	</div>

	<!-- Scrollable Sound List -->
	<div class="flex-1 overflow-y-auto p-4">
		<div class="flex flex-col gap-3">
			{@render children()}
		</div>
	</div>
</aside>
