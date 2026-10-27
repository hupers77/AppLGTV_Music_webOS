import PropTypes from 'prop-types';

import {clamp, formatTime} from '../utils/time';

import css from './ProgressBar.module.less';

const ProgressBar = ({position, duration}) => {
	const ratio = duration > 0 ? clamp(position / duration, 0, 1) : 0;

	return (
		<div className={css.progress}>
			<div className={css.track}>
				<div className={css.fill} style={{width: `${ratio * 100}%`}} />
			</div>
			<div className={css.times}>
				<span>{formatTime(position)}</span>
				<span>{formatTime(duration)}</span>
			</div>
		</div>
	);
};

ProgressBar.propTypes = {
	duration: PropTypes.number,
	position: PropTypes.number
};

ProgressBar.defaultProps = {
	duration: 0,
	position: 0
};

export default ProgressBar;
