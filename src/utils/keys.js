// webOS TV 리모컨 키코드
export const KEY = {
	ENTER: 13,
	SPACE: 32,       // 브라우저 개발용
	LEFT: 37,
	UP: 38,
	RIGHT: 39,
	DOWN: 40,
	PAUSE: 19,
	STOP: 413,
	PLAY: 415,
	REWIND: 412,
	FAST_FORWARD: 417,
	BACK: 461
};

// 앱 종료 (webOS에서는 platformBack, 그 외에는 창 닫기)
export const exitApp = () => {
	if (typeof window === 'undefined') return;
	if (window.webOSSystem && typeof window.webOSSystem.platformBack === 'function') {
		window.webOSSystem.platformBack();
	} else {
		window.close();
	}
};
