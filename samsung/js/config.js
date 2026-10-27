// 설정값 + 재생 목록. 동작을 바꾸고 싶으면 이 파일만 고치면 된다.
(function (w) {
	'use strict';

	var APP = w.APP = w.APP || {};

	APP.config = {
		// 유튜브 IFrame 크기 (px). 공식 문서의 16:9 권장 최소 크기 (절대 최소 200x200)
		iframe: {width: 480, height: 270},

		// 번인 방지: intervalMs(1분)마다 한 번,
		//  - iframe 은 랜덤한 위치로 이동 (현재 위치에서 가로 또는 세로로 minMovePx 이상, 곡명 영역과 겹치지 않게)
		//  - 곡명/프로그레스 영역은 ±driftPx 안에서 조금 이동
		move: {intervalMs: 60 * 1000, minMovePx: 120, margin: 24, avoidPadding: 24, driftPx: 24},

		seekStepSec: 10,      // 좌/우 키 이동 간격(초)
		autoplay: true,       // 시작하자마자 재생
		errorSkipMs: 3000,    // 재생 오류 시 다음 곡으로 넘어가기까지 대기 시간
		pollMs: 500,          // YouTube 재생 위치 확인 간격 (재생 중일 때만 동작)

		// 패키징된 앱은 file:// 에서 실행되어 일부 영상에서 임베드 오류(153)가 날 수 있다.
		// 그런 경우 유효한 https 주소를 넣어 본다. (실제 TV에서 확인 필요)
		ytReferrer: ''
	};

	// 재생 목록
	//  - {source: 'youtube', videoId: '영상ID'}                   제목은 영상 제목 자동 사용
	//  - {source: 'youtube', videoId: '영상ID', title: '곡명'}     곡명 직접 지정
	//  - {source: 'audio', url: 'https://.../a.mp3', title: '곡명'}  (mp3, m4a, aac)
	// videoId: youtube.com/watch?v=XXXXXXXXXXX 의 v= 뒤 11자 (youtu.be/XXXXXXXXXXX 도 동일)
	// 아래 항목은 예시이므로 실제 값으로 교체해야 한다.
	APP.playlist = [
		{source: 'youtube', videoId: 'REPLACE_WITH_VIDEO_ID_1'},
		{source: 'youtube', videoId: 'REPLACE_WITH_VIDEO_ID_2', title: '직접 지정한 곡명'}
		// {source: 'audio', url: 'https://example.com/music/track01.mp3', title: '내 음원 01'}
	];
})(window);
