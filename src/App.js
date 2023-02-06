import { useRef, useEffect } from "react";
import Game from "./game.js";

function App() {
  const view = useRef(null);

  let gameId = (Math.random() * 10000) | 0;

  useEffect(() => {
    const game = new Game(gameId++);
    view.current.append(game.view);
    return () => {
      game.destroy();
    };
  }, []);

  return <div ref={view}></div>;
}

export default App;
