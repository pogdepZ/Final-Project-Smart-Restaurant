import { useRoutes } from "react-router-dom";
import "./App.css";
import './index.css'
import routers from "./router/Router";

function App() {
  const element = useRoutes(routers);

  return <>{element}</>;
}

export default App;
