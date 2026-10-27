// YouTube IFrame Player API 기반 소스.
//
// 약관상 플레이어는 숨기지 않고 화면에 보이게 두어야 하므로, 작은 크기(config.IFRAME_SIZE)로
// 표시하고 위치만 옮긴다. (display:none / 화면 밖으로 빼기 등은 사용하지 않는다)
// 위치 이동은 iframe의 "부모(host) 요소"를 CSS로 옮기는 방식이라 iframe이 다시 로드되지 않는다.

import {IFRAME_SIZE, YT_WIDGET_REFERRER} from '../config';

const STATE = {ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3};

const ERROR_MESSAGES = {
	2: '잘못된 영상 ID입니다',
	5: '플레이어 오류가 발생했습니다',
	100: '영상을 찾을 수 없거나 비공개입니다',
	101: '영상 소유자가 임베드 재생을 허용하지 않았습니다',
	150: '영상 소유자가 임베드 재생을 허용하지 않았습니다',
	153: '플레이어 구성 오류(153): 앱 출처(Referer) 문제일 수 있습니다'
};

let apiPromise = null;

const loadIframeApi = () => {
	if (apiPromise) return apiPromise;

	apiPromise = new Promise((resolve, reject) => {
		if (window.YT && window.YT.Player) {
			resolve(window.YT);
			return;
		}
		const previous = window.onYouTubeIframeAPIReady;
		window.onYouTubeIframeAPIReady = () => {
			if (typeof previous === 'function') previous();
			resolve(window.YT);
		};
		const script = document.createElement('script');
		script.src = 'https://www.youtube.com/iframe_api';
		script.async = true;
		script.onerror = () => {
			apiPromise = null;
			reject(new Error('YouTube API를 불러오지 못했습니다 (네트워크 확인)'));
		};
		document.head.appendChild(script);
	});

	return apiPromise;
};

export const createYoutubeSource = (host, handlers) => {
	// YT.Player는 전달한 요소를 iframe으로 "교체"하므로, host 안에 전용 자식 요소를 만들어 넘긴다.
	const mount = document.createElement('div');
	host.appendChild(mount);

	let player = null;
	let ready = false;
	let destroyed = false;
	let pending = null;   // 플레이어 준비 전에 들어온 load 요청
	let wantPlay = false; // 준비 전에 들어온 play 요청
	let timer = null;

	const safe = (fn, fallback) => {
		try {
			return fn();
		} catch (e) {
			return fallback;
		}
	};

	const emitMeta = () => {
		const data = safe(() => player.getVideoData(), null);
		if (data && data.title) handlers.onMeta({title: data.title});
	};

	const startPolling = () => {
		if (timer) return;
		timer = setInterval(() => {
			if (!ready || destroyed) return;
			handlers.onTime(
				safe(() => player.getCurrentTime(), 0),
				safe(() => player.getDuration(), 0)
			);
		}, 250);
	};

	const doLoad = (track, autoplay) => {
		const args = {videoId: track.videoId, startSeconds: track.start || 0};
		if (autoplay) {
			player.loadVideoById(args);
		} else {
			player.cueVideoById(args);
		}
	};

	loadIframeApi().then((YT) => {
		if (destroyed) return;

		const playerVars = {
			controls: 0,
			disablekb: 1,
			fs: 0,
			rel: 0,
			playsinline: 1,
			modestbranding: 1,
			iv_load_policy: 3
		};
		if (YT_WIDGET_REFERRER) playerVars.widget_referrer = YT_WIDGET_REFERRER;

		player = new YT.Player(mount, {
			width: IFRAME_SIZE.width,
			height: IFRAME_SIZE.height,
			playerVars,
			events: {
				onReady: () => {
					ready = true;
					startPolling();
					if (pending) {
						doLoad(pending.track, pending.autoplay || wantPlay);
						pending = null;
					}
				},
				onStateChange: (e) => {
					if (e.data === STATE.PLAYING) {
						handlers.onState('playing');
						emitMeta();
					} else if (e.data === STATE.PAUSED) {
						handlers.onState('paused');
					} else if (e.data === STATE.BUFFERING) {
						handlers.onState('buffering');
					} else if (e.data === STATE.ENDED) {
						handlers.onState('paused');
						handlers.onEnded();
					}
				},
				onError: (e) => {
					handlers.onError(ERROR_MESSAGES[e.data] || `재생 오류 (${e.data})`);
				}
			}
		});
	}).catch((err) => {
		if (!destroyed) handlers.onError(err.message);
	});

	return {
		type: 'youtube',

		load (track, autoplay) {
			wantPlay = autoplay;
			if (ready) {
				doLoad(track, autoplay);
			} else {
				pending = {track, autoplay};
			}
		},

		play () {
			if (ready) player.playVideo(); else wantPlay = true;
		},

		pause () {
			wantPlay = false;
			if (ready) player.pauseVideo();
		},

		seek (sec) {
			if (ready) player.seekTo(sec, true);
		},

		getCurrentTime () {
			return ready ? safe(() => player.getCurrentTime(), 0) : 0;
		},

		getDuration () {
			return ready ? safe(() => player.getDuration(), 0) : 0;
		},

		destroy () {
			destroyed = true;
			if (timer) clearInterval(timer);
			if (player) safe(() => player.destroy());
			if (mount.parentNode) mount.parentNode.removeChild(mount);
		}
	};
};

export default createYoutubeSource;
