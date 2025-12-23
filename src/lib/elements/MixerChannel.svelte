<script lang="ts">
	/**
	 * Volume control for a single audio channel
	 */
	type Props = {
		/** Channel name to display */
		name: string;
		/** Tailwind color class for the label and slider thumb (e.g., 'amber', 'purple', 'emerald') */
		color: string;
		/** Callback for volume changes */
		onvolumechange: (name: string, volume: number) => void;
	};

	let { name, onvolumechange, color }: Props = $props();

	let volume = $state(0.5);
	const handleInput = () => {
		onvolumechange(name, volume);
	};
</script>

<div class="flex items-center gap-3">
	<span class="w-20 text-xs font-medium tracking-wide text-{color}-400 uppercase">{name}</span>
	<input
		type="range"
		min="0"
		max="1"
		step="0.01"
		bind:value={volume}
		oninput={handleInput}
		class="h-1.5 flex-1 cursor-pointer appearance-none rounded-lg bg-neutral-700 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-{color}-400 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-{color}-400"
	/>
	<span class="w-10 text-right text-xs text-neutral-400">{Math.round(volume * 100)}%</span>
</div>
