<script lang="ts">
	/**
	 * Skip forward / Next track icon component
	 */
	interface Props {
		/** CSS class for the SVG element */
		class?: string;
	}

	let { class: className = 'h-6 w-6' }: Props = $props();
</script>

<svg class={className} fill="currentColor" viewBox="0 0 24 24">
	<path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
</svg>
