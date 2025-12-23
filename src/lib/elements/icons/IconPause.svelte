<script lang="ts">
	/**
	 * Pause icon component
	 */
	interface Props {
		/** CSS class for the SVG element */
		class?: string;
	}

	let { class: className = 'h-5 w-5' }: Props = $props();
</script>

<svg class={className} fill="currentColor" viewBox="0 0 24 24">
	<path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"></path>
</svg>
