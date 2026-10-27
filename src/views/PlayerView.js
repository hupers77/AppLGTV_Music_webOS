import classnames from 'classnames';
import {useRef} from 'react';

import ProgressBar from '../components/ProgressBar';
import TrackTitle from '../components/TrackTitle';
import {DRIFT, IFRAME_SIZE, MOVE} from '../config';
import playlist from '../data/playlist';
import useDrift from '../hooks/useDrift';
import usePlayer from '../hooks/usePlayer';
import useRandomPosition from '../hooks/useRandomPosition';
import useRemoteKeys from '../hooks/useRemoteKeys';

import css from './PlayerView.module.less';

// 검은 배경에 곡명 + 프로그레스 바만 표시하는 메인 화면.
// 유튜브 음원일 때는 480x270 iframe이 1분마다 랜덤한 px 만큼 이동한다.
const PlayerView = () => {
	const youtubeHostRef = useRef(null);
	const contentRef = useRef(null);

	const player = usePlayer(playlist, youtubeHostRef);
	useRemoteKeys(player);

	const drift = useDrift(DRIFT);
	const framePos = useRandomPosition({
		width: IFRAME_SIZE.width,
		height: IFRAME_SIZE.height,
		intervalMs: MOVE.intervalMs,
		minMove: MOVE.minMovePx,
		margin: MOVE.margin,
		avoidPadding: MOVE.avoidPadding,
		avoidRef: contentRef
	});

	const isYoutube = player.track && player.track.source === 'youtube';

	return (
		<div className={css.screen}>
			<div
				ref={contentRef}
				className={css.content}
				style={{transform: `translate(${drift.x}px, ${drift.y}px)`}}
			>
				<TrackTitle
					title={player.title}
					paused={!player.playing}
					error={player.error}
				/>
				<ProgressBar position={player.position} duration={player.duration} />
			</div>

			{/* YT.Player가 이 요소 안에 iframe을 만든다. 오디오 곡일 때는 숨긴다. */}
			<div
				ref={youtubeHostRef}
				className={classnames(css.frameHost, !isYoutube && css.hidden)}
				style={{
					width: IFRAME_SIZE.width,
					height: IFRAME_SIZE.height,
					transform: `translate(${framePos.x}px, ${framePos.y}px)`
				}}
			/>
		</div>
	);
};

export default PlayerView;
