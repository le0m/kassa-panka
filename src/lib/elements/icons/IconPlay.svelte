<script lang="ts">
	/**
	 * Play icon component
	 */
	interface Props {
		/** CSS class for the SVG element */
		class?: string;
	}

	let { class: className = 'h-5 w-5' }: Props = $props();
</script>

<svg class={className} fill="currentColor" viewBox="0 0 24 24">
	<path d="M8 5v14l11-7z"></path>
</svg>
