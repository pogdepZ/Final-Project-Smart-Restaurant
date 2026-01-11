import { useRoutes } from "react-router-dom";
import "./App.css";
import './index.css'
import routers from "./router/Router";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const element = useRoutes(routers);

  localStorage.setItem("token", "mock-token");
  localStorage.setItem(
    "user",
    JSON.stringify({
      id: 1,
      name: "Waiter Test",
      role: "waiter",
    })
  );

  return (
    <>
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
    </>
  );
}

export default App;
