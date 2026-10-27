# TV Music Player (webOS / Enact)

검은 화면에 **곡명 + 프로그레스 바**만 표시하는 LG webOS TV용 음악 플레이어.
음원은 YouTube 영상(IFrame Player API) 또는 `<audio>` 파일을 쓸 수 있다.

| 플랫폼 | 위치 | 구성 |
|---|---|---|
| LG webOS | 이 폴더 (`src/`, `webos-meta/`) | Enact (React) |
| Samsung Tizen | [`samsung/`](samsung/README.md) | 순수 JS (ES5), 프레임워크 없음 |

## 시작하기

```bash
npm install
npm run serve        # 브라우저에서 개발 (http://localhost:8080)
npm run pack-p       # 프로덕션 빌드 -> dist/
npm run package      # 빌드 + IPK 생성 (ares-package)
```

TV 설치 (TV에서 개발자 모드를 켜고, `ares-setup-device`로 `tv` 이름의 기기를 등록해 둔 상태):

```bash
ares-install -d tv com.example.tvmusic_1.0.0_all.ipk
ares-launch  -d tv com.example.tvmusic
```

앱 ID/제목은 `webos-meta/appinfo.json`, `package.json`의 스크립트 안 ID와 함께 바꾼다.

## 재생 목록

`src/data/playlist.js` 를 편집한다. (현재는 **예시 ID**이므로 반드시 교체)

```js
{source: 'youtube', videoId: '영상ID'}                    // 제목은 영상 제목 자동 사용
{source: 'youtube', videoId: '영상ID', title: '곡명'}      // 곡명 직접 지정
{source: 'audio', url: 'https://.../track.mp3', title: '곡명'}
```

## 리모컨

| 키 | 동작 |
|---|---|
| OK(확인) | 재생 / 일시정지 |
| ◀ / ▶ | 10초 뒤로 / 앞으로 (되감기 / 빨리감기 키도 동일) |
| ▲ / ▼ | 이전 곡 / 다음 곡 |
| 재생 / 일시정지 / 정지 | 각각 해당 동작 |
| 뒤로 | 앱 종료 |

브라우저 개발 중에는 방향키, Enter, Space 로 같은 동작을 테스트할 수 있다.

## YouTube iframe

- 크기는 480x270 (`src/config.js` 의 `IFRAME_SIZE`). YouTube 공식 문서의 16:9 플레이어 권장 최소 크기이다. (절대 최소는 200x200)
- 위치는 번인 방지를 위해 **1분(`MOVE.intervalMs`)마다 한 번** 이동한다.
  이동 거리(px)와 방향은 랜덤이며, 가로 또는 세로로 최소 `minMovePx`(기본 120px) 이상 움직인다.
- 곡명/프로그레스 바 영역과는 겹치지 않고 화면 밖으로 나가지 않는 위치만 고른다.
  480x270 은 중앙 영역 옆에는 들어가지 않아서, 그 영역의 위쪽/아래쪽 띠 안에서 가로로 넓게 움직인다.
- 곡명/프로그레스 바 영역도 1분마다 ±24px 안에서 조금씩 움직인다 (`DRIFT`).
- iframe 은 숨기지 않고 항상 화면에 보이게 둔다 (YouTube 정책). 완전히 화면 없는 재생은 `audio` 소스에서만 가능하다.

### 영상 ID (videoId)

YouTube 주소의 영상 식별자(11자)이다.

- `https://www.youtube.com/watch?v=`**`XXXXXXXXXXX`** → `XXXXXXXXXXX`
- `https://youtu.be/`**`XXXXXXXXXXX`** → `XXXXXXXXXXX`

### 알려진 위험 (실제 TV에서 먼저 확인할 것)

- 패키징된 webOS 앱은 `file://` 출처에서 실행되어, 일부 영상에서 임베드 오류(예: 153)가 날 수 있다.
  발생하면 `config.js` 의 `YT_WIDGET_REFERRER` 에 유효한 https 주소를 넣어 본다.
- 영상 소유자가 임베드를 막은 영상(오류 101/150)은 재생되지 않으며, 3초 뒤 다음 곡으로 넘어간다.

## 구조

```
src/
├── index.js, App/         진입점, ThemeDecorator
├── views/PlayerView.js    곡명 + 프로그레스 바 + iframe 배치
├── components/            TrackTitle, ProgressBar
├── hooks/
│   ├── usePlayer.js       재생 상태/동작 (소스 전환, 오류 시 다음 곡)
│   ├── useRemoteKeys.js   리모컨 키 매핑
│   ├── useRandomPosition.js  iframe 랜덤 이동
│   └── useDrift.js        콘텐츠 미세 이동
├── sources/               youtubeSource, audioSource (공통 인터페이스)
├── data/playlist.js       재생 목록
├── config.js              설정값
└── utils/                 keys, time
webos-meta/                appinfo.json, 아이콘
```
