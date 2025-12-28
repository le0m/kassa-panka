<script lang="ts">
	/**
	 * Play icon component
	 */
	interface Props {
		/** CSS class for the SVG element */
		class?: string;
		/** Click handler */
		onclick?: (event: MouseEvent & { currentTarget: EventTarget & SVGSVGElement }) => void;
	}

	let { class: className = 'h-5 w-5', onclick }: Props = $props();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<svg class={className} {onclick} fill="currentColor" viewBox="0 0 24 24">
	<path d="M8 5v14l11-7z"></path>
</svg>
