import { AudioChannel } from './AudioChannel.ts';

/** Creates a new audio instance compatible with the AudioChannel class. Anyways, you will able to control the final audio-source<element> (playing, pause, loop, etc.)*/
export class AudioTrack {
	/* The current HTMLAudioElement used to play and have control over the audio. */
	audioElement: HTMLAudioElement;
	sourceNode: MediaElementAudioSourceNode;

	/**
	 * Create a new audio-track from a audio-element or create a new one from an URL<stirng> (Base64 supported).
	 *
	 * **WARNING:** Local files with `file:///` protocol are not supported (cross-origin error). To load local files please load them with FileReader and convert them into *Base64*.
	 *
	 * @param {HTMLElement|String} audioSource
	 * @returns {AudioTrack}
	 * @example <caption>Connecting an Element</caption>
	 * ```javascript
	 * const el = document.querySelector( "audio" ) ;
	 * channel.input( el, mixer.ctx ) ;
	 * // or
	 * const track = new AudioTrack( el ) ;
	 * channel.input( track, myCustomAudioContext ) ;
	 * ```
	 * @example <caption>Loading from URL</caption>
	 * ```javascript
	 * const track1 = channel.input( "./my-file.mp3", mixer.ctx ) ;
	 * // Base64 is supported.
	 * const track2 = channel.input( "data:audio/mpeg;base64,...", mixer.ctx ) ;
	 * ```
	 */
	constructor(audioSource: HTMLAudioElement | String, audioContext: AudioContext) {
		if (typeof audioSource === 'string') {
			const el = document.createElement('audio');
			el.src = audioSource;
			el.controls = false;
			el.volume = 1;
			el.load();
			audioSource = el;
		} // set [v] ;
		this.audioElement = <HTMLAudioElement>audioSource;
		this.sourceNode = audioContext.createMediaElementSource(this.audioElement);
		this.sourceNode.disconnect();
	}

	/** Connect the track output to a channel input. */
	output(channel: AudioChannel) {
		const connected = channel.tracks.findIndex((t) => t === this);
		if (connected !== -1) {
			return true;
		}
		this.sourceNode.disconnect();
		this.sourceNode.connect(channel.inputNode);
		channel.tracks.push(this);
	}

	/** Set the volume of the current track (from 0 to 1) */
	set volume(value: number) {
		this.audioElement.volume = value;
	}

	/** Get the volume of the current track (from 0 to 1) */
	get volume(): number {
		return this.audioElement.volume;
	}

	/** Enable/Disable the loop feature of the current track */
	set loop(status: boolean) {
		this.audioElement.loop = status;
	}

	/** Get loop status of the current track */
	get loop(): boolean {
		return this.audioElement.loop;
	}

	/** Enable/Disable the mute feature of the current track */
	set muted(status: boolean) {
		this.audioElement.muted = status;
	}

	/** Get mute status of the current track */
	get muted(): boolean {
		return this.audioElement.muted;
	}

	/** Set the current time (in seconds) in of the current track. Use this property to forward or backward the audio. */
	set time(seconds: number) {
		this.audioElement.currentTime = seconds;
	}

	/** Get the current time (in seconds) of the track. */
	get time(): number {
		return this.audioElement.currentTime;
	}

	/** Play the current audio from the last time value. Use stop() to start from the beginning or pause() to resume the audio. */
	play() {
		return this.audioElement.play();
	}

	/** Check if the current track is playing. */
	get playing() {
		return !this.audioElement.paused;
	}

	/** Check if the current track is paused. */
	get paused() {
		return this.audioElement.paused;
	}

	/** Pause the current audio and resume it with play() method. */
	pause() {
		return this.audioElement.pause();
	}

	/** Pause the current audio track and set time to 0, playing audio from the start again with play() method. */
	stop() {
		this.audioElement.pause();
		return (this.audioElement.currentTime = 0);
	}
}
