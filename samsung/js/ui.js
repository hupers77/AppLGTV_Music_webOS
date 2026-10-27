// 화면 갱신. 바뀐 값만 DOM 에 쓰고, 움직이는 요소는 transform 만 사용한다.
//  - 곡명 텍스트: 바뀔 때만
//  - 시간 텍스트: 표시되는 "초"가 바뀔 때만 (초당 1회)
//  - 프로그레스 바: 너비 대신 scaleX (레이아웃 재계산 없음), 0.05% 단위로만 갱신
//  - 위치 이동: 1분에 한 번, 타이머 하나로 iframe + 콘텐츠 영역을 같이 처리
(function (w, d) {
	'use strict';

	var APP = w.APP;
	var cfg = APP.config;

	function pad(n) {
		return n < 10 ? '0' + n : '' + n;
	}

	// 초 -> "m:ss" 또는 "h:mm:ss"
	function fmt(sec) {
		var t = sec > 0 ? Math.floor(sec) : 0;
		var h = Math.floor(t / 3600);
		var m = Math.floor((t % 3600) / 60);
		var s = t % 60;
		return h > 0 ? h + ':' + pad(m) + ':' + pad(s) : m + ':' + pad(s);
	}

	function setTransform(el, value) {
		el.style.webkitTransform = value; // 구형 Tizen 대비
		el.style.transform = value;
	}

	function intersects(a, b, pad2) {
		return a.left < b.right + pad2 && a.right > b.left - pad2 && a.top < b.bottom + pad2 && a.bottom > b.top - pad2;
	}

	APP.createUI = function () {
		var elContent = d.getElementById('content');
		var elTitle = d.getElementById('title');
		var elErr = d.getElementById('err');
		var elFill = d.getElementById('fill');
		var elCur = d.getElementById('cur');
		var elDur = d.getElementById('dur');
		var elFrame = d.getElementById('frame');

		elFrame.style.width = cfg.iframe.width + 'px';
		elFrame.style.height = cfg.iframe.height + 'px';

		var lastTitle = null;
		var lastErr = null;
		var lastCurSec = -1;
		var lastDurSec = -1;
		var lastScale = -1;
		var framePos = null;

		// 곡명/프로그레스 영역과 겹치지 않고, 현재 위치에서 minMovePx 이상 떨어진 임의의 좌표
		function pickPosition(avoid, cur) {
			var mv = cfg.move;
			var W = cfg.iframe.width;
			var H = cfg.iframe.height;
			var maxX = Math.max(w.innerWidth - W - mv.margin, mv.margin);
			var maxY = Math.max(w.innerHeight - H - mv.margin, mv.margin);
			var x = mv.margin;
			var y = mv.margin;

			for (var i = 0; i < 100; i++) {
				x = Math.round(mv.margin + Math.random() * (maxX - mv.margin));
				y = Math.round(mv.margin + Math.random() * (maxY - mv.margin));
				if (intersects({left: x, top: y, right: x + W, bottom: y + H}, avoid, mv.avoidPadding)) continue;
				if (cur && Math.max(Math.abs(x - cur.x), Math.abs(y - cur.y)) < mv.minMovePx) continue;
				break;
			}
			return {x: x, y: y};
		}

		function moveOnce() {
			var r = cfg.move.driftPx;
			var dx = Math.round((Math.random() * 2 - 1) * r);
			var dy = Math.round((Math.random() * 2 - 1) * r);
			setTransform(elContent, 'translate3d(' + dx + 'px,' + dy + 'px,0)');

			// 이동된 콘텐츠 영역을 기준으로 iframe 위치를 고른다 (1분에 한 번만 측정)
			framePos = pickPosition(elContent.getBoundingClientRect(), framePos);
			setTransform(elFrame, 'translate3d(' + framePos.x + 'px,' + framePos.y + 'px,0)');
		}

		return {
			host: elFrame,

			setTitle: function (text) {
				if (text !== lastTitle) {
					lastTitle = text;
					elTitle.textContent = text;
				}
			},

			setError: function (msg) {
				var m = msg || '';
				if (m !== lastErr) {
					lastErr = m;
					elErr.textContent = m;
				}
			},

			setPlaying: function (playing) {
				elTitle.className = playing ? '' : 'paused';
			},

			showFrame: function (show) {
				elFrame.className = show ? '' : 'hidden';
			},

			setTime: function (pos, dur) {
				var cs = pos > 0 ? Math.floor(pos) : 0;
				if (cs !== lastCurSec) {
					lastCurSec = cs;
					elCur.textContent = fmt(cs);
				}

				var ds = dur > 0 ? Math.floor(dur) : 0;
				if (ds !== lastDurSec) {
					lastDurSec = ds;
					elDur.textContent = fmt(ds);
				}

				var ratio = dur > 0 ? Math.min(Math.max(pos / dur, 0), 1) : 0;
				var q = Math.round(ratio * 2000) / 2000;
				if (q !== lastScale) {
					lastScale = q;
					setTransform(elFill, 'scaleX(' + q + ')');
				}
			},

			startMotion: function () {
				moveOnce();
				setInterval(moveOnce, cfg.move.intervalMs);
			}
		};
	};
})(window, document);
