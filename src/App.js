import { useRef, useEffect } from "react";
import "./App.css";
import Game from "./game.js";

function App() {
  const view = useRef(null);
  const app = new Game();

  useEffect(() => {
    console.log("appending app.view to view");
    app && view.current.append(app.view);
  }, []);

  return <div ref={view}></div>;
}

export default App;
