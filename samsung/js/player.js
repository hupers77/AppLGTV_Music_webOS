// 재생 상태/동작. UI 는 ui 객체의 콜백으로만 갱신한다. (프레임워크 없이 필요한 곳만 직접 갱신)
//
// ui: setTitle(str), setError(str|null), setTime(pos, dur), setPlaying(bool), showFrame(bool)
(function (w, d) {
	'use strict';

	var APP = w.APP;
	var cfg = APP.config;

	APP.createPlayer = function (list, host, ui) {
		var sources = {};
		var activeType = null;
		var idx = 0;
		var playing = false;
		var error = null;
		var metaTitle = '';
		var dur = 0;
		var errTimer = 0;
		var errStreak = 0;     // 연속 오류 횟수. 목록 전체가 연속으로 실패하면 자동 넘김을 멈춘다.
		var resumeOnShow = false;

		function setPlaying(v) {
			if (v !== playing) {
				playing = v;
				ui.setPlaying(v);
			}
		}

		function titleText() {
			var t = list[idx];
			if (!t) return '재생 목록이 비어 있습니다';
			return t.title || metaTitle || '불러오는 중…';
		}

		function active() {
			return sources[activeType] || null;
		}

		// 소스 종류별로 한 번만 만들고 재사용한다.
		function getSource(type) {
			if (sources[type]) return sources[type];

			function isActive() {
				return activeType === type;
			}

			var handlers = {
				onState: function (state) {
					if (!isActive()) return;
					if (state === 'playing') errStreak = 0;
					setPlaying(state === 'playing' || state === 'buffering');
				},
				onTime: function (pos, d2) {
					if (!isActive()) return;
					if (d2 > 0 && d2 !== Infinity) dur = d2;
					ui.setTime(pos || 0, dur);
				},
				onMeta: function (m) {
					if (isActive() && m.title && m.title !== metaTitle) {
						metaTitle = m.title;
						ui.setTitle(titleText());
					}
				},
				onEnded: function () {
					if (isActive()) loadIndex(idx + 1, false);
				},
				onError: function (msg) {
					if (!isActive()) return;
					error = msg;
					ui.setError(msg);
					setPlaying(false);
					clearTimeout(errTimer);
					errStreak++;
					if (errStreak < list.length) {
						errTimer = setTimeout(function () {
							loadIndex(idx + 1, false);
						}, cfg.errorSkipMs);
					}
				}
			};

			var s = APP.createSource(type, host, handlers);
			if (s) sources[type] = s;
			return s;
		}

		// byUser: 사용자가 직접 곡을 바꾼 경우 오류 횟수를 초기화한다.
		// autoplay: false 면 불러오기만 하고 재생은 시작하지 않는다 (기본 true)
		function loadIndex(i, byUser, autoplay) {
			var n = list.length;
			if (!n) return;
			if (byUser) errStreak = 0;

			idx = ((i % n) + n) % n;
			var track = list[idx];

			clearTimeout(errTimer);

			// 다른 종류의 소스는 멈춘다 (소리가 겹치지 않도록)
			for (var type in sources) {
				if (type !== track.source) sources[type].pause();
			}

			activeType = track.source;
			dur = 0;
			error = null;
			metaTitle = '';
			setPlaying(false);
			ui.setError(null);
			ui.setTitle(titleText());
			ui.setTime(0, 0);
			ui.showFrame(track.source === 'youtube');

			var src = getSource(track.source);
			if (!src) {
				error = '지원하지 않는 음원 종류입니다: ' + track.source;
				ui.setError(error);
				return;
			}
			src.load(track, autoplay !== false);
		}

		var api = {
			init: function () {
				if (!list.length) {
					ui.setTitle(titleText());
					return;
				}
				loadIndex(0, true, cfg.autoplay);
			},
			play: function () {
				var s = active();
				if (!s) return;
				if (error) {
					loadIndex(idx, true);
					return;
				}
				s.play();
			},
			pause: function () {
				var s = active();
				if (s) s.pause();
			},
			toggle: function () {
				if (playing) api.pause();
				else api.play();
			},
			stop: function () {
				var s = active();
				if (!s) return;
				s.pause();
				s.seek(0);
				ui.setTime(0, dur);
			},
			seekBy: function (delta) {
				var s = active();
				if (!s) return;
				var d2 = s.duration();
				var max = d2 > 0 ? Math.max(d2 - 1, 0) : Infinity;
				var t = Math.min(Math.max(s.time() + delta, 0), max);
				s.seek(t);
				ui.setTime(t, d2 || dur);
			},
			next: function () {
				loadIndex(idx + 1, true);
			},
			prev: function () {
				loadIndex(idx - 1, true);
			}
		};

		// 앱이 백그라운드로 가면 멈추고, 돌아오면 이어서 재생 (webOS/Tizen 공통 권장)
		d.addEventListener('visibilitychange', function () {
			if (d.hidden) {
				resumeOnShow = playing;
				api.pause();
			} else if (resumeOnShow) {
				resumeOnShow = false;
				api.play();
			}
		});

		return api;
	};
})(window, document);
