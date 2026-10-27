import {useCallback, useEffect, useRef, useState} from 'react';

import {AUTOPLAY, ERROR_SKIP_MS} from '../config';
import {createSource} from '../sources';
import {clamp} from '../utils/time';

// 재생 상태와 동작을 한 곳에서 관리한다. UI는 이 훅이 돌려주는 값/함수만 사용한다.
const usePlayer = (playlist, youtubeHostRef) => {
	const [index, setIndex] = useState(0);
	const [playing, setPlaying] = useState(false);
	const [position, setPosition] = useState(0);
	const [duration, setDuration] = useState(0);
	const [error, setError] = useState(null);
	const [metaTitle, setMetaTitle] = useState('');

	const playlistRef = useRef(playlist);
	const sourcesRef = useRef({});
	const activeTypeRef = useRef(null);
	const indexRef = useRef(0);
	const playingRef = useRef(false);
	const errorTimerRef = useRef(null);
	const resumeOnVisibleRef = useRef(false);
	const apiRef = useRef({});

	playlistRef.current = playlist;

	const setPlayingState = (value) => {
		playingRef.current = value;
		setPlaying(value);
	};

	const getActive = () => sourcesRef.current[activeTypeRef.current] || null;

	// 소스 종류별로 한 번만 만들고 재사용한다. (audio 요소는 앱당 1개 권장)
	const getSource = (type) => {
		const cache = sourcesRef.current;
		if (cache[type]) return cache[type];

		// 비활성 소스에서 늦게 도착한 이벤트는 무시한다.
		const isActive = () => activeTypeRef.current === type;
		const handlers = {
			onState: (state) => {
				if (isActive()) setPlayingState(state === 'playing' || state === 'buffering');
			},
			onTime: (pos, dur) => {
				if (!isActive()) return;
				setPosition(pos || 0);
				if (dur) setDuration(dur);
			},
			onMeta: (meta) => {
				if (isActive() && meta.title) setMetaTitle(meta.title);
			},
			onEnded: () => {
				if (isActive()) apiRef.current.next();
			},
			onError: (message) => {
				if (!isActive()) return;
				setError(message);
				setPlayingState(false);
				clearTimeout(errorTimerRef.current);
				errorTimerRef.current = setTimeout(() => apiRef.current.next(), ERROR_SKIP_MS);
			}
		};

		const source = createSource(type, {youtubeHost: youtubeHostRef.current}, handlers);
		if (source) cache[type] = source;
		return source;
	};

	const loadIndex = (i, autoplay = true) => {
		const list = playlistRef.current;
		if (!list.length) return;

		const n = ((i % list.length) + list.length) % list.length;
		const track = list[n];

		clearTimeout(errorTimerRef.current);

		// 다른 종류의 소스는 멈춘다 (소리가 겹치지 않도록)
		Object.keys(sourcesRef.current).forEach((type) => {
			if (type !== track.source) sourcesRef.current[type].pause();
		});

		activeTypeRef.current = track.source;
		indexRef.current = n;
		setIndex(n);
		setPosition(0);
		setDuration(0);
		setError(null);
		setMetaTitle('');
		setPlayingState(false);

		const source = getSource(track.source);
		if (!source) {
			setError(`지원하지 않는 음원 종류입니다: ${track.source}`);
			return;
		}
		source.load(track, autoplay);
	};

	apiRef.current.next = () => loadIndex(indexRef.current + 1);
	apiRef.current.prev = () => loadIndex(indexRef.current - 1);

	const play = useCallback(() => {
		const source = getActive();
		if (!source) return;
		if (apiRef.current.hasError) {
			loadIndex(indexRef.current);
			return;
		}
		source.play();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const pause = useCallback(() => {
		const source = getActive();
		if (source) source.pause();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const toggle = useCallback(() => {
		if (playingRef.current) pause(); else play();
	}, [play, pause]);

	const stop = useCallback(() => {
		const source = getActive();
		if (!source) return;
		source.pause();
		source.seek(0);
		setPosition(0);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const seekBy = useCallback((delta) => {
		const source = getActive();
		if (!source) return;
		const dur = source.getDuration();
		const max = dur > 0 ? Math.max(dur - 1, 0) : Infinity;
		const target = clamp(source.getCurrentTime() + delta, 0, max);
		source.seek(target);
		setPosition(target);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const next = useCallback(() => apiRef.current.next(), []);
	const prev = useCallback(() => apiRef.current.prev(), []);

	apiRef.current.hasError = Boolean(error);

	// 최초 로드
	useEffect(() => {
		loadIndex(0, AUTOPLAY);

		return () => {
			clearTimeout(errorTimerRef.current);
			Object.values(sourcesRef.current).forEach((source) => source.destroy());
			sourcesRef.current = {};
			activeTypeRef.current = null;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// webOS 권장: 앱이 백그라운드로 가면 멈추고, 돌아오면 이어서 재생
	useEffect(() => {
		const onVisibility = () => {
			if (document.hidden) {
				resumeOnVisibleRef.current = playingRef.current;
				pause();
			} else if (resumeOnVisibleRef.current) {
				resumeOnVisibleRef.current = false;
				play();
			}
		};
		document.addEventListener('visibilitychange', onVisibility);
		return () => document.removeEventListener('visibilitychange', onVisibility);
	}, [play, pause]);

	const track = playlist[index] || null;
	const title = (track && track.title) || metaTitle || (track ? '불러오는 중…' : '재생 목록이 비어 있습니다');

	return {
		track,
		title,
		playing,
		position,
		duration,
		error,
		play,
		pause,
		toggle,
		stop,
		seekBy,
		next,
		prev
	};
};

export default usePlayer;
