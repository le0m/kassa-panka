<script lang="ts">
	/**
	 * X/Close icon component
	 */
	interface Props {
		/** CSS class for the SVG element */
		class?: string;
	}

	let { class: className = 'h-5 w-5' }: Props = $props();
</script>

<svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
	<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"
	></path>
</svg>
