<script lang="ts">
	/**
	 * Volume control for a single audio channel
	 */
	interface Props {
		/** Channel name to display */
		name: string;
		/** Tailwind color class for the label and slider thumb (e.g., 'amber', 'purple', 'emerald') */
		color: string;
		/** Callback for volume changes */
		onvolumechange: (name: string, volume: number) => void;
	}

	let { name, onvolumechange, color }: Props = $props();

	let volume = $state(0.5);
	const handleInput = () => {
		onvolumechange(name, volume);
	};

	/** Complete Tailwind class strings based on color prop */
	const colorClasses = $derived(
		{
			amber: {
				text: 'text-amber-400',
				track: 'bg-amber-600',
				thumb: '[&::-webkit-slider-thumb]:bg-amber-400 [&::-moz-range-thumb]:bg-amber-400'
			},
			purple: {
				text: 'text-purple-400',
				track: 'bg-purple-600',
				thumb: '[&::-webkit-slider-thumb]:bg-purple-400 [&::-moz-range-thumb]:bg-purple-400'
			},
			emerald: {
				text: 'text-emerald-400',
				track: 'bg-emerald-600',
				thumb: '[&::-webkit-slider-thumb]:bg-emerald-400 [&::-moz-range-thumb]:bg-emerald-400'
			}
		}[color] ?? {
			text: 'text-neutral-400',
			track: 'bg-neutral-600',
			thumb: '[&::-webkit-slider-thumb]:bg-neutral-400 [&::-moz-range-thumb]:bg-neutral-400'
		}
	);
</script>

<div class="flex items-center gap-3">
	<input
		type="range"
		min="0"
		max="1"
		step="0.01"
		bind:value={volume}
		oninput={handleInput}
		class="h-1.5 cursor-pointer appearance-none rounded-lg {colorClasses.track} {colorClasses.thumb} [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full"
	/>
	<span class="text-right text-xs text-neutral-400">{Math.round(volume * 100)}%</span>
</div>
