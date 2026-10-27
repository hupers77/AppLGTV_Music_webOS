import {useEffect, useRef} from 'react';

import {SEEK_STEP_SEC} from '../config';
import {exitApp, KEY} from '../utils/keys';

// 리모컨 키 -> 플레이어 동작 매핑.
//  OK(확인)            : 재생/일시정지 토글
//  ◀ / ▶              : 10초 뒤로 / 앞으로 (되감기/빨리감기 키도 동일)
//  ▲ / ▼              : 이전 곡 / 다음 곡
//  재생 / 일시정지 / 정지 : 각각 해당 동작
//  뒤로                : 앱 종료
const useRemoteKeys = (actions) => {
	const actionsRef = useRef(actions);
	actionsRef.current = actions;

	useEffect(() => {
		const onKeyDown = (ev) => {
			const a = actionsRef.current;
			let handled = true;

			switch (ev.keyCode) {
				case KEY.ENTER:
				case KEY.SPACE:
					a.toggle();
					break;
				case KEY.PLAY:
					a.play();
					break;
				case KEY.PAUSE:
					a.pause();
					break;
				case KEY.STOP:
					a.stop();
					break;
				case KEY.LEFT:
				case KEY.REWIND:
					a.seekBy(-SEEK_STEP_SEC);
					break;
				case KEY.RIGHT:
				case KEY.FAST_FORWARD:
					a.seekBy(SEEK_STEP_SEC);
					break;
				case KEY.UP:
					a.prev();
					break;
				case KEY.DOWN:
					a.next();
					break;
				case KEY.BACK:
					exitApp();
					break;
				default:
					handled = false;
			}

			if (handled) ev.preventDefault();
		};

		document.addEventListener('keydown', onKeyDown);
		return () => document.removeEventListener('keydown', onKeyDown);
	}, []);
};

export default useRemoteKeys;
