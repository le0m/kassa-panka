import { AudioChannel } from './AudioChannel.ts';

/**
 * Create a new audio-mixer to start adding channels with controllers (gain, panning and basic EQ).
 * @param {AudioContext} [context] - A custom audio-context to connect the audio-mixer output signal.
 *
 * @example <caption>Standard JavaScript</caption>
 * ```javascript
 * // Import muses globally with <script> tag in your HTML file.
 * // Then just use it in any script or file.
 * const mixer = muses.createAudioMixer( ) ;
 * ```
 * @example <caption>Module Import</caption>
 * ```javascript
 * import { createAudioMixer } from "@corpsemedia/muses" ;
 * const mixer = createAudioMixer( ) ;
 * ```
 * @returns {AudioMixer}
 */
export function createAudioMixer(context?: AudioContext): AudioMixer {
	if (typeof context === 'undefined') {
		context = new AudioContext();
	}
	return new AudioMixer(context);
}

/** Create a virtual mixing-console with audio channels */
export class AudioMixer {
	/** The audio-context instance used to process audio. */
	ctx: AudioContext;
	/** The audio-context instance used to process audio (same as "ctx" property). */
	audioContext: AudioContext;
	/** All channels added to the current AudioMixer instance */
	channels: AudioChannel[] = [];
	/** The node to control the mixer output volume */
	inputNode: GainNode;

	/**
	 * Create a new AudioMixer instance.
	 * @param {AudioContext} [audioContext] - A custom audio-context to connect the audio-mixer output signal. By default, muses will add a new AudioContext.
	 * @returns {AudioMixer}
	 * @example <caption>Standard JavaScript</caption>
	 * ```javascript
	 * const mixer = new muses.AudioMixer( ) ;
	 * ```
	 * @example <caption>TypeScript</caption>
	 * ```typescript
	 * const mixer : AudioMixer = new AudioMixer( ) ;
	 * ```
	 */
	constructor(audioContext?: AudioContext) {
		this.ctx = audioContext || new AudioContext();
		this.audioContext = this.ctx;
		this.inputNode = this.ctx.createGain();
		this.inputNode.connect(this.ctx.destination);
	}

	close(): void {
		while (this.channels.length) this.channels.pop()?.close();
		this.inputNode.disconnect(this.ctx.destination);
		this.ctx.close();
	}

	/**
	 * Due to the constant change in browser security, it is necessary to wait for the user to perform an action within the web page in order to execute the *AudioContext* correctly.
	 * If necessary, you can execute this method once the user executes the action in order to allow access to the *AudioContext*.
	 * Basically, this method verify and executes another funtion inside the *AudioContext* object, **AudioContext.resume()**.
	 * @see https://goo.gl/7K7WLu - For more details about auto-play policy.
	 * @returns {string} - AudioContext status.
	 */
	resumeContext(): string {
		if (this.audioContext.state !== 'suspended') {
			return this.audioContext.state;
		}
		this.audioContext.resume();
		return this.audioContext.state;
	}

	/**
	 * Add a new channel in the current AudioMixer.
	 * @param {String} [id] - (Default) The current channel index.
	 */
	addChannel(id?: string): AudioChannel {
		const channel = new AudioChannel(this);
		channel.id = id || this.channels.length.toString();
		this.channels.push(channel);
		return channel;
	}

	/**
	 * Look for a channel with a specific id.
	 * @param id - The previous defined id on the addChannel( ) method call.
	 */
	getChannel(id: string): AudioChannel | null {
		const i = this.channels.findIndex((c) => c.id === id);
		return this.channels[i] || null;
	}

	/** Modify the volume of the current mixer (from 0 to 1) */
	set volume(value: number) {
		this.inputNode.gain.value = value;
	}

	/** Get the current volume value of the mixer */
	get volume(): number {
		return this.inputNode.gain.value;
	}
}
