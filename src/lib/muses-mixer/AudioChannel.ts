/**
 * MIT License
 *
 * Copyright (c) 2021 Corpse Media
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * ---
 *
 * Credits to:
 * 	- https://github.com/pudretediablo/muses original creator
 * 	- https://github.com/Daedalus11069/muses-mixer for updating
 */

import { AudioTrack } from './AudioTrack.ts';
import { AudioMixer } from './AudioMixer.ts';
import { logger } from '$lib/logger';

/**
 * The audio-channel class used to manage AudioMixer's channels.
 * Each channel have a few **basic controllers** (Volume, Panning and Basic EQ) to modify the audio-output of all the connected audio sources.
 */
export class AudioChannel {
	inputNode: GainNode;
	outputNode: GainNode;
	/** All the AudioTracks added to the current channel. **WARNING:** Other sources (like manual stream-source additions) will be not showed in this array, only *AudioTrack* instances added through *input()* method. */
	tracks: AudioTrack[] = [];
	gainNode: GainNode;
	LowEQNode: BiquadFilterNode;
	MidEQNode: BiquadFilterNode;
	HighEQNode: BiquadFilterNode;
	stereoPannerNode: StereoPannerNode;
	private mixer: AudioMixer;
	private customNodes: AudioNode[] = [];
	private resumeTracks: AudioTrack[] = [];

	/** The current channel id provided from AudioMixer instance */
	id: string = 'N/A';

	/**
	 * Create a new AudioChannel to connect and take control over multiple audio sources.
	 * @param mixingConsole - The parent AudioMixer instance.
	 * @returns {AudioChannel}
	 * @example <caption>Standard JavaScript</caption>
	 * ```javascript
	 * const mixer = muses.createAudioMixer( ) ;
	 * const channel = new muses.AudioChannel( mixer ) ;
	 * ```
	 * @example <caption>TypeScript</caption>
	 * ```javascript
	 * const mixer : AudioMixer = createAudioMixer( ) ;
	 * const channel : AudioChannel = new AudioChannel( mixer ) ;
	 * // use it [v] ;
	 * channel.input( $audioElement ) ;
	 * channel.volume = 0.4 ;
	 * channel.panning = -0.4 ;
	 * ```
	 */
	constructor(mixingConsole: AudioMixer) {
		this.mixer = mixingConsole;
		const ctx = this.mixer.ctx;
		this.inputNode = new GainNode(ctx, { gain: 1 });
		this.outputNode = new GainNode(ctx, { gain: 1 });
		this.gainNode = new GainNode(ctx, { gain: 1 });
		this.stereoPannerNode = new StereoPannerNode(ctx, { pan: 0 });
		this.LowEQNode = new BiquadFilterNode(ctx, {
			type: 'lowshelf',
			Q: 1,
			gain: 0
		});
		this.MidEQNode = new BiquadFilterNode(ctx, {
			type: 'peaking',
			Q: 1,
			gain: 0
		});
		this.HighEQNode = new BiquadFilterNode(ctx, {
			type: 'highshelf',
			Q: 1,
			gain: 0
		});
		// connect [v] ;
		this.inputNode
			.connect(this.LowEQNode)
			.connect(this.MidEQNode)
			.connect(this.HighEQNode)
			.connect(this.stereoPannerNode)
			.connect(this.gainNode)
			.connect(this.outputNode)
			.connect(mixingConsole.inputNode);
	}

	close(): void {
		this.outputNode.disconnect();
		this.gainNode.disconnect();
		this.stereoPannerNode.disconnect();
		this.HighEQNode.disconnect();
		this.MidEQNode.disconnect();
		this.LowEQNode.disconnect();
		while (this.tracks.length) this.tracks.pop()?.close();
		while (this.customNodes.length) this.customNodes.pop()?.disconnect();
		this.inputNode.disconnect();
	}

	/**
	 * Add a custom node or effect to the channel (in-order).
	 * @param {AudioNode} customNode - The effect or audio node to connect between the channelOutputNode and the mixerInputNode.
	 */
	addNode(customNode: AudioNode) {
		this.customNodes.push(customNode);
		this.reconnectNodes();
	}

	/**
	 * Remove an specific customNode from the channel's customNodes list and then reconnect all nodes.
	 * @param {AudioNode} node - The previously added effect or audio node.
	 */
	removeNode(node: AudioNode) {
		const i = this.customNodes.findIndex((n) => n === node);
		if (i === -1) {
			throw new Error("Can't find out the provided customNode in the channel's customNodes list.");
		}
		this.customNodes.splice(i, 1);
		this.reconnectNodes();
	}

	/**
	 * Remove all custom nodes from the channel and then reconnect the channel-output with the mixer-input.
	 */
	removeAllNodes() {
		this.customNodes.splice(0, this.customNodes.length);
		this.reconnectNodes();
	}

	/**
	 * Reconnect all custom nodes if you have added them previously (outputNode -> customNodes -> mixerInputNode).
	 * If you don't have custom nodes added, this method will ensure the connection between the **channelOutputNode** and the **mixerInputNode**.
	 */
	reconnectNodes() {
		this.volume = 0;
		this.outputNode.disconnect();
		try {
			if (this.customNodes.length <= 0) {
				this.outputNode.connect(this.mixer.inputNode);
			} else {
				const size = this.customNodes.length;
				for (var i = 0; i < size; i++) {
					this.customNodes[i].disconnect();
					this.customNodes[i].connect(
						i >= size - 1 ? this.mixer.inputNode : this.customNodes[i + 1]
					);
				} // connect first node [v] ;
				this.outputNode.connect(this.customNodes[0]);
			}
		} catch (error) {
			logger.error({ error }, 'CHANNEL_RECONNECT:NODES_eRROR ~>');
			this.outputNode.disconnect();
			this.outputNode.connect(this.mixer.inputNode);
			throw error;
		} finally {
			this.volume = 1;
		}
	}

	/**
	 * Disconnect from the audio-context component used in the current channel's mixing-console.
	 * @returns {AudioChannel} The current audio-channel instance.
	 */
	disconnectFromContext(): AudioChannel {
		this.outputNode.disconnect(this.mixer.ctx.destination);
		return this;
	}

	/**
	 * Connect to the audio-context component (Generally used to hear it in the speakers)
	 * @returns {AudioContext} The audio-context used in the current channel's mixing-console.
	 */
	connectToContext(): AudioContext {
		this.outputNode.connect(this.mixer.ctx.destination);
		return this.mixer.ctx;
	}

	/**
	 * Send outputNode signal to a custom AudioNode or AudioContext instance.
	 * Warning: Be sure to disconnect the current audio-context or audio-node.
	 * @returns {AudioChannel} The current channel instance.
	 */
	connect(node: AudioContext | AudioNode) {
		this.outputNode.connect(<AudioNode>node);
	}

	/**
	 * Disconnect from one or all current AudioNode receivers.
	 * @param {AudioContext|AudioNode} [node] - If is "undefined" the output-node will be disconnected from all receivers.
	 */
	disconnect(node?: AudioContext | AudioNode) {
		if (typeof node !== 'undefined') {
			this.outputNode.disconnect(<AudioNode>node);
		} else {
			this.outputNode.disconnect();
		}
	}

	/**
	 * Connect a track to the current audio-channel instance.
	 * @param {AudioTrack} track - The audio-track instance to connect processing nodes.
	 * @returns {AudioChannel} - The current audio-channel instance.
	 */
	addTrack(track: AudioTrack): AudioChannel {
		track.output(this);
		return this;
	}

	/**
	 * Search a track by an identifier.
	 * @param id - The identifier to search for
	 * @returns {AudioTrack | undefined} - The track if found
	 */
	findTrack(id: string): AudioTrack | undefined {
		return this.tracks.find((track) => track.id === id);
	}

	/**
	 * Add a new audio input from an audio-element, stream-source, media-source or create a new element by loading a file from a provided URL<string>
	 * @param {MediaStreamAudioSourceNode|MediaElementAudioSourceNode|HTMLAudioElement|String|AudioTrack} source - An audio-element to create a new *AudioTrack* instance, an URL of the file to create that element automatically (Base64 supported) or the audio-node to connect directly into channel's *inputNode*
	 */
	input(
		source:
			| MediaStreamAudioSourceNode
			| MediaElementAudioSourceNode
			| HTMLAudioElement
			| String
			| AudioTrack
	) {
		if (
			source instanceof MediaStreamAudioSourceNode ||
			source instanceof MediaElementAudioSourceNode
		) {
			return source.connect(this.inputNode);
		}
		if (source instanceof AudioTrack) {
			this.addTrack(source);
			return source;
		}
		const track = new AudioTrack(source, this.mixer.ctx);
		this.addTrack(track);
		return track;
	}

	/** Modify the Panning Effect (-1 Left, 1 Right, 0 Center) */
	set pan(value: number) {
		this.stereoPannerNode.pan.value = value;
	}

	/** Get the current Panning Effect value */
	get pan(): number {
		return this.stereoPannerNode.pan.value;
	}

	/** Modify the Gain of the current channel (from 0 to 1) */
	set volume(value: number) {
		this.gainNode.gain.value = value;
	}

	/** Get the current Gain value */
	get volume(): number {
		return this.gainNode.gain.value;
	}

	/**
	 * Modify the low-EQ value of the current channel (from -40 to 36) dB
	 * @param {number} value - from -40dB to 36dB
	 */
	set lowEQ(value: number) {
		this.LowEQNode.gain.value = value;
	}

	/** Get the current low-EQ value */
	get lowEQ(): number {
		return this.LowEQNode.gain.value;
	}

	/**
	 * Modify the mid-EQ value of the current channel (from -40 to 36) dB
	 * @param {number} value - from -40dB to 36dB
	 */
	set midEQ(value: number) {
		this.MidEQNode.gain.value = value;
	}

	/** Get the current mid-EQ value */
	get midEQ(): number {
		return this.MidEQNode.gain.value;
	}

	/**
	 * Modify the high-EQ value of the current channel (from -40 to 36) dB
	 * @param {number} value - from -40dB to 36dB
	 */
	set highEQ(value: number) {
		this.HighEQNode.gain.value = value;
	}

	/** Get the current high-EQ value */
	get highEQ(): number {
		return this.HighEQNode.gain.value;
	}

	/** Mute output signal from the current channel */
	set muted(status: boolean) {
		this.outputNode.gain.value = status === true ? 0 : 1;
	}

	/** Check if the current channel is muted */
	get muted(): boolean {
		return this.outputNode.gain.value > 0 ? false : true;
	}

	/**
	 * Play the channel audio. Use stop() to start from the beginning or pause() to pause the audio.
	 * @param {string?} id - The optional track ID to start from if not resuming
	 */
	async play(id?: string) {
		// Resume if channel was paused
		if (this.resumeTracks.length) {
			return Promise.all(this.resumeTracks.splice(0).map((track) => track.play())).then(
				() => void 0
			);
		}

		// Start from specific track if it was requested
		if (id) {
			const track = this.tracks.find((track) => track.id === id);
			if (track) {
				return track.play();
			}
		}

		// Start from first track
		return this.tracks.at(0)?.play();
	}

	/** Check if any track is playing */
	get playing(): boolean {
		return this.tracks.some((track) => track.playing);
	}

	/** Check if all tracks are paused or ended */
	get paused(): boolean {
		return this.tracks.every((track) => track.paused || track.ended);
	}

	/** Pause the channel and resume it with play() method. */
	pause() {
		for (const track of this.tracks) {
			if (!track.playing) {
				continue;
			}

			track.pause();
			this.resumeTracks.push(track);
		}
	}

	/** Pause the channel and set time of all tracks to 0, playing audio from the start again with play() method. */
	stop() {
		for (const track of this.tracks) {
			track.stop();
		}
	}

	/** Decrease volume smoothly until it is silent */
	fadeOut(ms: number = 2000): Promise<boolean> {
		const channel = this;
		if (typeof ms !== 'number') {
			ms = 2000;
		}
		return new Promise((res, rej) => {
			const vpc: number = (2 / ms) * 10;
			const int = setInterval(() => {
				if (channel.inputNode.gain.value <= 0) {
					channel.inputNode.gain.value = 0;
					clearInterval(int);
					return res(true);
				} // continue [v] ;
				channel.inputNode.gain.value -= vpc;
			}, 2);
		});
	}

	/** Increase volume smoothly until it's in maximun input volume (this doesn't affect other features like "muted" or "volume" properties) */
	fadeIn(ms: number = 2000): Promise<boolean> {
		const channel = this;
		if (typeof ms !== 'number') {
			ms = 2000;
		}
		return new Promise((res, rej) => {
			const vpc: number = (2 / ms) * 10;
			const int = setInterval(() => {
				if (channel.inputNode.gain.value >= 1) {
					channel.inputNode.gain.value = 1;
					clearInterval(int);
					return res(true);
				} // continue [v] ;
				channel.inputNode.gain.value += vpc;
			}, 2);
		});
	}
}
