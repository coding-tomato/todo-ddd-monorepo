import { AppComponent } from "./components/AppComponent/AppComponent.js";
import { handleError } from "./utils/errorHandler.js";
import "./styles/main.css";

window.onerror = (msg, _src, _line, _col, err) =>
  handleError(err || new Error(String(msg)));
window.onunhandledrejection = (e) => handleError(e.reason);

const $app = document.querySelector("#app");
new AppComponent($app);
