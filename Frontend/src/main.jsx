import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./store/store";
import { injectStore } from "./store/axiosClient.js";
import { SocketProvider } from "./context/SocketContext";

// Initialize i18n
import "./i18n";

injectStore(store);
createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <SocketProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </SocketProvider>
  </Provider>,
);
