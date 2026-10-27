// 진입점: 리모컨 키 등록/매핑, 화면 + 플레이어 연결
(function (w, d) {
	'use strict';

	var APP = w.APP;
	var cfg = APP.config;

	// Samsung TV 리모컨 키코드
	var KEY = {
		ENTER: 13,
		SPACE: 32,            // 브라우저 개발용
		LEFT: 37,
		UP: 38,
		RIGHT: 39,
		DOWN: 40,
		PAUSE: 19,
		STOP: 413,
		PLAY: 415,
		REWIND: 412,
		FAST_FORWARD: 417,
		PLAY_PAUSE: 10252,
		TRACK_PREV: 10232,
		TRACK_NEXT: 10233,
		BACK: 10009
	};

	// 미디어 키는 앱에서 등록해야 keydown 이벤트가 들어온다 (방향키/확인/뒤로 키는 등록 불필요)
	var MEDIA_KEYS = [
		'MediaPlay', 'MediaPause', 'MediaStop', 'MediaPlayPause',
		'MediaRewind', 'MediaFastForward', 'MediaTrackPrevious', 'MediaTrackNext'
	];

	function registerKeys() {
		var t = w.tizen;
		if (!t || !t.tvinputdevice) return; // 브라우저 개발 환경
		for (var i = 0; i < MEDIA_KEYS.length; i++) {
			try {
				t.tvinputdevice.registerKey(MEDIA_KEYS[i]);
			} catch (e) {
				// 모델에 따라 지원하지 않는 키는 건너뛴다
			}
		}
	}

	function exitApp() {
		try {
			w.tizen.application.getCurrentApplication().exit();
		} catch (e) {
			w.close();
		}
	}

	var ui = APP.createUI();
	var player = APP.createPlayer(APP.playlist, ui.host, ui);

	d.addEventListener('keydown', function (ev) {
		var handled = true;
		switch (ev.keyCode) {
			case KEY.ENTER:
			case KEY.SPACE:
			case KEY.PLAY_PAUSE:
				player.toggle();
				break;
			case KEY.PLAY:
				player.play();
				break;
			case KEY.PAUSE:
				player.pause();
				break;
			case KEY.STOP:
				player.stop();
				break;
			case KEY.LEFT:
			case KEY.REWIND:
				player.seekBy(-cfg.seekStepSec);
				break;
			case KEY.RIGHT:
			case KEY.FAST_FORWARD:
				player.seekBy(cfg.seekStepSec);
				break;
			case KEY.UP:
			case KEY.TRACK_PREV:
				player.prev();
				break;
			case KEY.DOWN:
			case KEY.TRACK_NEXT:
				player.next();
				break;
			case KEY.BACK:
				exitApp();
				break;
			default:
				handled = false;
		}
		if (handled) ev.preventDefault();
	});

	registerKeys();
	ui.startMotion();
	player.init();
})(window, document);
