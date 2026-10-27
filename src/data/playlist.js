// 재생 목록.
//
//  - source: 'youtube' | 'audio'
//  - youtube : videoId 필수. (주소 youtube.com/watch?v=XXXXXXXXXXX 의 v= 뒤 11자, youtu.be/XXXXXXXXXXX 도 동일) title을 생략하면 영상 제목을 자동으로 사용한다.
//  - audio   : url 필수 (mp3, m4a, aac 등 webOS TV audio 요소가 지원하는 형식). title 권장.
//
// 아래 항목은 예시(placeholder)이므로 실제 영상 ID/주소로 교체해야 한다.
const playlist = [
	{source: 'youtube', videoId: 'REPLACE_WITH_VIDEO_ID_1'},
	{source: 'youtube', videoId: 'REPLACE_WITH_VIDEO_ID_2', title: '직접 지정한 곡명'}
	// {source: 'audio', url: 'https://example.com/music/track01.mp3', title: '내 음원 01'}
];

export default playlist;
