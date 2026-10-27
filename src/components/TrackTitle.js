import classnames from 'classnames';
import PropTypes from 'prop-types';

import css from './TrackTitle.module.less';

// 곡명 영역(2줄 높이)과 오류 메시지 영역(1줄 높이)은 내용과 상관없이 항상 같은 크기를 차지한다.
// 곡명 길이나 오류 표시 여부로 레이아웃이 변하지 않아야 iframe 이 콘텐츠와 겹치지 않는다.
const TrackTitle = ({title, paused, error}) => (
	<div className={css.trackTitle}>
		<div className={css.titleBox}>
			<div className={classnames(css.title, paused && css.paused)}>{title}</div>
		</div>
		<div className={css.error}>{error}</div>
	</div>
);

TrackTitle.propTypes = {
	title: PropTypes.string.isRequired,
	error: PropTypes.string,
	paused: PropTypes.bool
};

export default TrackTitle;
