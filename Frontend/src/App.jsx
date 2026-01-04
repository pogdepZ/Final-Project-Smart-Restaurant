import { useRoutes } from "react-router-dom";
import "./App.css";

function App() {
  const element = useRoutes(routers);

  return <>{element}</>;
}

export default App;
