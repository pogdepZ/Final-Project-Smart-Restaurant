import { useRoutes } from "react-router-dom";
import "./App.css";
import "./index.css";
import routers from "./router/Router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useQRScanner from "./hooks/useQRScanner";
import { LoadingBarProvider } from "./context/LoadingBarContext";

function App() {
  const element = useRoutes(routers);
  useQRScanner();
  return (
    <LoadingBarProvider>
      {element}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </LoadingBarProvider>
  );
}

export default App;
