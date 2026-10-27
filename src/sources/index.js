// 재생 소스 레지스트리.
//
// 모든 소스는 같은 인터페이스를 구현한다:
//   load(track, autoplay), play(), pause(), seek(sec),
//   getCurrentTime(), getDuration(), destroy()
// 그리고 생성 시 받은 handlers 로 이벤트를 알린다:
//   onState('playing'|'paused'|'buffering'), onTime(pos, dur), onMeta({title}),
//   onEnded(), onError(message)
//
// 새로운 음원 종류를 추가하려면 여기에 등록하면 된다.

import {createAudioSource} from './audioSource';
import {createYoutubeSource} from './youtubeSource';

export const createSource = (type, {youtubeHost}, handlers) => {
	switch (type) {
		case 'youtube':
			return youtubeHost ? createYoutubeSource(youtubeHost, handlers) : null;
		case 'audio':
			return createAudioSource(handlers);
		default:
			return null;
	}
};

export default createSource;
