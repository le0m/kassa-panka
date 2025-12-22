export * from './AudioChannel.ts';
export * from './AudioMixer.ts';
export * from './AudioTrack.ts';

/**
 * Credits to:
 * 	- https://github.com/pudretediablo/muses original creator
 * 	- https://github.com/Daedalus11069/muses-mixer for updating
 */

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
export function getMicStreamNode(): Promise<MediaStreamAudioSourceNode> {
	return new Promise((res, rej) => {
		navigator.mediaDevices
			.getUserMedia({ video: false, audio: true })
			.then(function (stream: MediaStream) {
				const ctx: AudioContext = new AudioContext();
				const micNode = ctx.createMediaStreamSource(stream);
				return res(micNode);
			})
			.catch((err) => {
				rej(err);
			});
	});
}

/**
 * Get an audio-context instance.
 * @returns {AudioContext}
 */
export function getAudioContext(): AudioContext {
	return new AudioContext();
}
