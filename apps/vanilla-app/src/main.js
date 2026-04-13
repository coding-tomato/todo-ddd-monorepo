import { AppComponent } from './components/AppComponent.js';
import { handleError } from './errorHandler.js';
import './styles/main.css';

window.onerror = (msg, src, line, col, err) => handleError(err || new Error(String(msg)));
window.onunhandledrejection = (e) => handleError(e.reason);

const $app = document.querySelector('#app');
new AppComponent($app);
