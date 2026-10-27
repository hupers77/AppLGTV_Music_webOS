// 재생 소스: audio(<audio> 요소), youtube(IFrame Player API).
//
// 공통 인터페이스
//   load(track, autoplay), play(), pause(), seek(sec), time(), duration(), destroy()
// 생성 시 받는 handlers
//   onState('playing'|'paused'|'buffering'), onTime(pos, dur), onMeta({title}), onEnded(), onError(msg)
(function (w, d) {
	'use strict';

	var APP = w.APP;
	var cfg = APP.config;

	function noop() {}

	function safePlay(media) {
		var p = media.play();
		if (p && p.catch) p.catch(noop);
	}

	// ---------------------------------------------------------------- audio
	// 화면 출력이 전혀 없는 "소리만" 재생용. 앱당 audio 요소 1개만 사용한다.
	function createAudioSource(h) {
		var a = d.createElement('audio');
		a.preload = 'auto';
		a.style.display = 'none';
		d.body.appendChild(a);

		function emitTime() {
			h.onTime(a.currentTime, a.duration);
		}
		function playing() {
			h.onState('playing');
		}

		a.addEventListener('play', playing);
		a.addEventListener('playing', playing);
		a.addEventListener('pause', function () {
			if (!a.ended) h.onState('paused');
		});
		a.addEventListener('waiting', function () {
			h.onState('buffering');
		});
		a.addEventListener('timeupdate', emitTime);
		a.addEventListener('durationchange', emitTime);
		a.addEventListener('ended', function () {
			h.onState('paused');
			h.onEnded();
		});
		a.addEventListener('error', function () {
			h.onError('음원을 재생할 수 없습니다 (주소 또는 형식을 확인하세요)');
		});

		return {
			load: function (track, autoplay) {
				a.src = track.url;
				a.load();
				if (autoplay) safePlay(a);
			},
			play: function () {
				safePlay(a);
			},
			pause: function () {
				a.pause();
			},
			seek: function (sec) {
				a.currentTime = sec;
			},
			time: function () {
				return a.currentTime || 0;
			},
			duration: function () {
				var x = a.duration;
				return x > 0 && x !== Infinity ? x : 0;
			},
			destroy: function () {
				a.pause();
				a.removeAttribute('src');
				a.load();
				if (a.parentNode) a.parentNode.removeChild(a);
			}
		};
	}

	// -------------------------------------------------------------- youtube
	var YT_ERRORS = {
		2: '잘못된 영상 ID입니다',
		5: '플레이어 오류가 발생했습니다',
		100: '영상을 찾을 수 없거나 비공개입니다',
		101: '영상 소유자가 임베드 재생을 허용하지 않았습니다',
		150: '영상 소유자가 임베드 재생을 허용하지 않았습니다',
		153: '플레이어 구성 오류(153): 앱 출처(Referer) 문제일 수 있습니다'
	};

	var apiWaiters = null;

	// YouTube API 스크립트는 유튜브 곡을 처음 재생할 때 한 번만 불러온다. (오디오만 쓰면 아예 불러오지 않음)
	function loadYtApi(onReady, onFail) {
		if (w.YT && w.YT.Player) {
			onReady(w.YT);
			return;
		}
		if (apiWaiters) {
			apiWaiters.push([onReady, onFail]);
			return;
		}
		apiWaiters = [[onReady, onFail]];

		var prev = w.onYouTubeIframeAPIReady;
		w.onYouTubeIframeAPIReady = function () {
			if (typeof prev === 'function') prev();
			var q = apiWaiters;
			apiWaiters = null;
			for (var i = 0; i < q.length; i++) q[i][0](w.YT);
		};

		var s = d.createElement('script');
		s.src = 'https://www.youtube.com/iframe_api';
		s.async = true;
		s.onerror = function () {
			var q = apiWaiters;
			apiWaiters = null;
			for (var i = 0; i < q.length; i++) q[i][1](new Error('YouTube API를 불러오지 못했습니다 (네트워크 확인)'));
		};
		d.head.appendChild(s);
	}

	// 약관상 플레이어는 숨기지 않고 화면에 보이게 둔다. 위치 이동은 host 요소를 transform 으로 옮기는
	// 방식이라 iframe 이 다시 로드되지 않는다.
	function createYoutubeSource(host, h) {
		var mount = d.createElement('div');
		host.appendChild(mount);

		var player = null;
		var ready = false;
		var destroyed = false;
		var pending = null;
		var wantPlay = false;
		var timer = 0;

		function call(name, fallback) {
			try {
				return player[name]();
			} catch (e) {
				return fallback;
			}
		}

		function emitTime() {
			h.onTime(call('getCurrentTime', 0), call('getDuration', 0));
		}

		// 재생 중일 때만 위치를 확인한다 (일시정지 중에는 타이머 없음)
		function startPoll() {
			if (!timer) timer = setInterval(emitTime, cfg.pollMs);
		}
		function stopPoll() {
			if (timer) {
				clearInterval(timer);
				timer = 0;
			}
		}

		function doLoad(track, autoplay) {
			var args = {videoId: track.videoId, startSeconds: track.start || 0};
			if (autoplay) player.loadVideoById(args);
			else player.cueVideoById(args);
		}

		loadYtApi(function (YT) {
			if (destroyed) return;

			var vars = {controls: 0, disablekb: 1, fs: 0, rel: 0, playsinline: 1, modestbranding: 1, iv_load_policy: 3};
			if (cfg.ytReferrer) vars.widget_referrer = cfg.ytReferrer;

			player = new YT.Player(mount, {
				width: cfg.iframe.width,
				height: cfg.iframe.height,
				playerVars: vars,
				events: {
					onReady: function () {
						ready = true;
						if (pending) {
							doLoad(pending.track, pending.autoplay || wantPlay);
							pending = null;
						}
					},
					onStateChange: function (e) {
						var s = e.data;
						if (s === 1) {
							h.onState('playing');
							startPoll();
							var data = call('getVideoData', null);
							if (data && data.title) h.onMeta({title: data.title});
						} else if (s === 2) {
							stopPoll();
							emitTime();
							h.onState('paused');
						} else if (s === 3) {
							h.onState('buffering');
						} else if (s === 0) {
							stopPoll();
							h.onState('paused');
							h.onEnded();
						}
					},
					onError: function (e) {
						stopPoll();
						h.onError(YT_ERRORS[e.data] || '재생 오류 (' + e.data + ')');
					}
				}
			});
		}, function (err) {
			if (!destroyed) h.onError(err.message);
		});

		return {
			load: function (track, autoplay) {
				wantPlay = autoplay;
				if (ready) doLoad(track, autoplay);
				else pending = {track: track, autoplay: autoplay};
			},
			play: function () {
				if (ready) player.playVideo();
				else wantPlay = true;
			},
			pause: function () {
				wantPlay = false;
				if (ready) player.pauseVideo();
			},
			seek: function (sec) {
				if (ready) player.seekTo(sec, true);
			},
			time: function () {
				return ready ? call('getCurrentTime', 0) : 0;
			},
			duration: function () {
				return ready ? call('getDuration', 0) : 0;
			},
			destroy: function () {
				destroyed = true;
				stopPoll();
				if (player) call('destroy');
				if (mount.parentNode) mount.parentNode.removeChild(mount);
			}
		};
	}

	APP.createSource = function (type, host, handlers) {
		if (type === 'audio') return createAudioSource(handlers);
		if (type === 'youtube') return createYoutubeSource(host, handlers);
		return null;
	};
})(window, document);
