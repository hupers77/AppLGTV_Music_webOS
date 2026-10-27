// 앱 전체에서 쓰는 설정값. 동작을 바꾸고 싶으면 여기만 고치면 된다.

// 유튜브 IFrame 크기 (px)
// YouTube 공식 문서: 16:9 플레이어는 최소 480x270 권장 (절대 최소는 200x200)
export const IFRAME_SIZE = {width: 480, height: 270};

// iframe 위치 이동 (번인 방지)
//  - intervalMs(1분)마다 한 번 이동한다.
//  - 이동 거리(px)와 방향은 랜덤. 곡명/프로그레스 바 영역과는 겹치지 않는 위치로 가며,
//    가로 또는 세로로 최소 minMovePx 이상은 반드시 움직인다.
export const MOVE = {
	intervalMs: 60 * 1000,
	minMovePx: 120,
	margin: 24,         // 화면 가장자리 여백
	avoidPadding: 24    // 곡명/프로그레스 바 영역과 띄울 거리
};

// 곡명/프로그레스 바 영역도 번인 방지용으로 조금씩 흔든다.
export const DRIFT = {
	maxPx: 24,
	intervalMs: 60 * 1000
};

// 리모컨 좌/우 키로 이동하는 초
export const SEEK_STEP_SEC = 10;

// 앱 시작 시 바로 재생할지
export const AUTOPLAY = true;

// 재생 오류가 났을 때 다음 곡으로 넘어가기까지 대기 시간
export const ERROR_SKIP_MS = 3000;

// 유튜브 플레이어 옵션.
// 패키징된 webOS 앱은 file:// 에서 실행되어 일부 영상에서 임베드 오류(예: 153)가 날 수 있다.
// 그런 경우 유효한 https 주소를 넣어 보면 해결될 수 있다. (실제 TV에서 확인 필요)
export const YT_WIDGET_REFERRER = '';
