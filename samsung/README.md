# TV Music Player - Samsung (Tizen)

검은 화면에 **곡명 + 프로그레스 바**만 표시하는 삼성 스마트 TV(Tizen)용 음악 플레이어.
LG(webOS) 버전(저장소 루트)과 같은 기능이며, TV에서 빠르게 동작하도록 **프레임워크 없는 순수 JS(ES5)** 로 만들었다.

> 이 버전은 Chromium + 가짜 `tizen`/YouTube API 로 검증했다. **실제 TV 에서는 아직 실행해 보지 못했다.**

## 시작하기

### 1. 재생 목록 편집

`js/config.js` 의 `APP.playlist` (현재는 **예시 ID**이므로 반드시 교체)

```js
{source: 'youtube', videoId: '영상ID'}                    // 제목은 영상 제목 자동 사용
{source: 'youtube', videoId: '영상ID', title: '곡명'}      // 곡명 직접 지정
{source: 'audio', url: 'https://.../track.mp3', title: '곡명'}
```

`videoId` 는 YouTube 주소의 11자 식별자이다. (`youtube.com/watch?v=`**`XXXXXXXXXXX`**, `youtu.be/`**`XXXXXXXXXXX`**)

### 2. 앱 ID 바꾸기 (`config.xml`)

- `<widget id="http://example.com/TvMusic">` 의 주소를 본인 것으로
- `<tizen:application id="TvMusic001.TvMusic" package="TvMusic001">` 의 패키지 ID (영문/숫자 10자)

### 3. (선택) 배포용 빌드

```bash
npm install
npm run build        # dist/ (index.html 1개 + config.xml + icon.png)
```

JS/CSS 를 압축해 `index.html` 에 인라인한다 (약 11 KB, gzip 4.5 KB, 파일 요청 1개).
빌드하지 않아도 소스(`index.html` + `js/` + `css/`) 그대로 TV 에서 실행된다.

### 4. TV 에 설치

1. **TV**: 앱 화면에서 리모컨 숫자 `1 2 3 4 5` 입력 -> Developer mode **ON**, Host PC IP 입력 -> TV 재부팅
2. **PC**: [Tizen Studio](https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/installing-tv-sdk.html) + TV Extensions 설치
   - Device Manager 에서 TV IP 로 연결
   - Certificate Manager 에서 Samsung 인증서 생성 (삼성 계정 + TV DUID)
3. 프로젝트 폴더(또는 `dist/`)를 Tizen Studio 로 가져와 **Run on TV**, 또는 CLI:

```bash
sdb connect <TV_IP>
tizen package -t wgt -s <인증서프로필> -- dist
tizen install -n TvMusic.wgt -t <TV이름>
tizen run -p TvMusic001.TvMusic -t <TV이름>
```

## 리모컨

| 키 | 동작 |
|---|---|
| OK(확인) / 재생·일시정지 | 재생 / 일시정지 토글 |
| 재생 / 일시정지 / 정지 | 각각 해당 동작 (정지는 0초로 되돌림) |
| ◀ / ▶ (되감기 / 빨리감기) | 10초 뒤로 / 앞으로 |
| ▲ / ▼ (이전 / 다음 트랙) | 이전 곡 / 다음 곡 |
| 뒤로 | 앱 종료 |

미디어 키는 `tizen.tvinputdevice.registerKey()` 로 등록해야 이벤트가 들어온다 (`js/main.js`).
브라우저 개발 중에는 방향키, Enter, Space 로 같은 동작을 테스트할 수 있다.

## YouTube iframe

- 크기 480x270 (YouTube 공식 문서의 16:9 권장 최소 크기, 절대 최소는 200x200).
- **1분마다 한 번** 랜덤한 위치로 이동한다 (번인 방지). 현재 위치에서 가로 또는 세로로 120px 이상 움직이고,
  곡명/프로그레스 영역과 겹치지 않으며 화면 밖으로 나가지 않는다. 곡명 영역도 ±24px 안에서 조금씩 움직인다.
- 곡명 영역(2줄)과 오류 메시지 영역(1줄)은 항상 같은 크기를 차지해서, 곡명 길이나 오류 표시 때문에 iframe 과 겹치지 않는다.
- iframe 은 숨기지 않고 항상 화면에 보이게 둔다 (YouTube 정책). 완전히 화면 없는 재생은 `audio` 소스에서만 가능하다.
- 이동/재생 설정은 `js/config.js` 의 `move`, `iframe`, `seekStepSec` 등에서 바꾼다.

## 성능을 위해 한 일

- 프레임워크/런타임 라이브러리 없음. 전체 DOM 요소 약 20개, ES5 문법만 사용 (구형 Tizen 브라우저 대비).
- 움직이는 요소(iframe, 곡명 영역, 프로그레스 바)는 `transform` 만 사용 -> 레이아웃 재계산 없이 합성만 처리.
- 프로그레스 바는 너비 대신 `scaleX`, 0.05% 단위로만 갱신. 시간 텍스트는 표시되는 "초"가 바뀔 때만 갱신.
- 재생 중 DOM 변경은 초당 약 3회, **일시정지 중에는 0회** (Chromium 측정).
- YouTube 재생 위치 확인 타이머(0.5초)는 재생 중에만 동작. 위치 이동은 타이머 하나(1분)로 처리하고 측정(`getBoundingClientRect`)도 1분에 한 번.
- YouTube API 스크립트는 유튜브 곡을 처음 재생할 때만 불러온다 (오디오 곡만 쓰면 요청 없음).
- 빌드 시 JS/CSS 압축 + 인라인 (요청 1개).

## 알려진 위험 (실제 TV 에서 먼저 확인할 것)

- 패키징된 앱은 `file://` 출처에서 실행되어 일부 영상에서 임베드 오류(예: 153)가 날 수 있다.
  발생하면 `config.js` 의 `ytReferrer` 에 유효한 https 주소를 넣어 보거나, 앱을 https 주소에서 불러오는 방식을 검토한다.
- 영상 소유자가 임베드를 막은 영상(오류 101/150)은 재생되지 않고 3초 뒤 다음 곡으로 넘어간다.
  목록 전체가 연속으로 실패하면 자동 넘김을 멈추고, OK 키로 현재 곡을 다시 시도한다.
- 백그라운드 재생/화면 꺼짐 동작은 모델과 Tizen 버전에 따라 다르다. 앱이 백그라운드로 가면 재생을 멈추고 돌아오면 이어서 재생한다.
- 아이콘은 117x117 이다. Samsung Seller Office 에 등록할 때는 별도 스토어 이미지 규격을 확인한다.

## 구조

```
samsung/
├── config.xml         Tizen 앱 설정 (ID, 권한, 아이콘)
├── index.html         화면 뼈대
├── css/style.css
├── js/
│   ├── config.js      설정 + 재생 목록
│   ├── sources.js     YouTube IFrame / <audio> 소스 (공통 인터페이스)
│   ├── player.js      재생 상태/동작 (소스 전환, 오류 시 다음 곡)
│   ├── ui.js          화면 갱신 + 1분 위치 이동
│   └── main.js        리모컨 키 등록/매핑, 진입점
├── build.js           배포용 압축/인라인 빌드 (선택)
├── package.json
└── icon.png
```
