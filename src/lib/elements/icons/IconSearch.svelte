<script lang="ts">
	/**
	 * Search/Magnifying glass icon component
	 */
	type Props = {
		/** CSS class for the SVG element */
		class?: string;
	};

	let { class: className = 'h-5 w-5' }: Props = $props();
</script>

<svg class={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
	<path
		stroke-linecap="round"
		stroke-linejoin="round"
		stroke-width="2"
		d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
	></path>
</svg>
