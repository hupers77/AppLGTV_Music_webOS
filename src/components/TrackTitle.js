import classnames from 'classnames';
import PropTypes from 'prop-types';

import css from './TrackTitle.module.less';

const TrackTitle = ({title, paused, error}) => (
	<div className={css.trackTitle}>
		<div className={classnames(css.title, paused && css.paused)}>{title}</div>
		{error ? <div className={css.error}>{error}</div> : null}
	</div>
);

TrackTitle.propTypes = {
	title: PropTypes.string.isRequired,
	error: PropTypes.string,
	paused: PropTypes.bool
};

export default TrackTitle;
