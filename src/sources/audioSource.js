// <audio> 요소 기반 소스. 화면 출력이 전혀 없는 "소리만" 재생용.
//
// webOS TV 주의점
//  - 앱당 audio 요소는 1개만 사용 (여러 개면 앱 전환 시 미디어 자원 충돌 가능)
//  - 지원 형식: aac, mp4(m4a), mpeg(mp3)

export const createAudioSource = (handlers) => {
	const audio = document.createElement('audio');
	audio.preload = 'auto';
	audio.style.display = 'none';
	document.body.appendChild(audio);

	const on = (name, fn) => audio.addEventListener(name, fn);

	on('play', () => handlers.onState('playing'));
	on('playing', () => handlers.onState('playing'));
	on('pause', () => { if (!audio.ended) handlers.onState('paused'); });
	on('waiting', () => handlers.onState('buffering'));
	on('timeupdate', () => handlers.onTime(audio.currentTime, audio.duration));
	on('durationchange', () => handlers.onTime(audio.currentTime, audio.duration));
	on('ended', () => {
		handlers.onState('paused');
		handlers.onEnded();
	});
	on('error', () => handlers.onError('음원을 재생할 수 없습니다 (주소 또는 형식을 확인하세요)'));

	return {
		type: 'audio',

		load (track, autoplay) {
			audio.src = track.url;
			audio.load();
			if (autoplay) {
				const p = audio.play();
				if (p && typeof p.catch === 'function') p.catch(() => {});
			}
		},

		play () {
			const p = audio.play();
			if (p && typeof p.catch === 'function') p.catch(() => {});
		},

		pause () {
			audio.pause();
		},

		seek (sec) {
			audio.currentTime = sec;
		},

		getCurrentTime () {
			return audio.currentTime || 0;
		},

		getDuration () {
			return Number.isFinite(audio.duration) ? audio.duration : 0;
		},

		destroy () {
			audio.pause();
			audio.removeAttribute('src');
			audio.load();
			if (audio.parentNode) audio.parentNode.removeChild(audio);
		}
	};
};

export default createAudioSource;
