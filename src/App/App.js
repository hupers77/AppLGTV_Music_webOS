import ThemeDecorator from '@enact/sandstone/ThemeDecorator';

import PlayerView from '../views/PlayerView';

import './App.module.less';

const App = (props) => <PlayerView {...props} />;

export default ThemeDecorator(App);
