<script lang="ts">
	/**
	 * Floppy disk/Save icon component
	 */
	interface Props {
		/** CSS class for the SVG element */
		class?: string;
	}

	let { class: className = 'h-5 w-5' }: Props = $props();
</script>

<svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
	<path
		stroke-linecap="round"
		stroke-linejoin="round"
		stroke-width="2"
		d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4z"
	></path>
	<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 3v4h8V3M7 21v-6h10v6"
	></path>
</svg>
