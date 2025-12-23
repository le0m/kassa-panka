<script lang="ts">
	/**
	 * Skip back / Previous track icon component
	 */
	type Props = {
		/** CSS class for the SVG element */
		class?: string;
	};

	let { class: className = 'h-6 w-6' }: Props = $props();
</script>

<svg class={className} fill="currentColor" viewBox="0 0 24 24">
	<path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
</svg>
