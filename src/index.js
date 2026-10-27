import {createRoot} from 'react-dom/client';

import App from './App';

const appElement = (<App />);

// In a browser environment, render instead of exporting
if (typeof window !== 'undefined') {
	createRoot(document.getElementById('root')).render(appElement);
}

export default appElement;
