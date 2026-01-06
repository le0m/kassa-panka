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

export * from './AudioChannel.ts';
export * from './AudioMixer.ts';
export * from './AudioTrack.ts';

/**
 * Request the microphone audio-stream to connect with a mixer's channel.
 * **This method will request the user permission automatically.**
 * @returns {MediaStreamAudioSourceNode} - The final audio-node to connect with a mixer's channel.
 * @example <caption>Promise Based</caption>
 * ```javascript
 * muses
 *   .getMicStreamNode( )
 *   .then( streamNode => {
 *     channel.input( streamNode ) ;
 *   } )
 *   .catch( err => {
 *     console.error( "GET_MIC_STREAM_ERROR ~>", err ) ;
 *   } ) ;
 * ```
 * @example <caption>Async Call</caption>
 * ```javascript
 * const micNode = await muses.getMicStreamNode( ) ;
 * channel.input( micNode ) ;
 * ```
 */
export const getMicStreamNode = (): Promise<MediaStreamAudioSourceNode> => {
	return new Promise((res, rej) => {
		navigator.mediaDevices
			.getUserMedia({ video: false, audio: true })
			.then((stream: MediaStream) => {
				const ctx: AudioContext = new AudioContext();
				const micNode = ctx.createMediaStreamSource(stream);
				return res(micNode);
			})
			.catch((err) => {
				rej(err);
			});
	});
};

/**
 * Get an audio-context instance.
 * @returns {AudioContext}
 */
export const getAudioContext = (): AudioContext => {
	return new AudioContext();
};
