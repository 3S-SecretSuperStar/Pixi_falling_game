import { Application, Sprite, Assets, Texture } from "pixi.js";

class Game {
  constructor() {
    this.app = new Application({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: "gray",
      resizeTo: window,
    });
    this.app.renderer.view.style.position = "absolute";
    this.view = this.app.view;
    this.setup();
  }

  loop = (delta) => {
    // todo
  };

  setup = async () => {
    const paddleTexture = await Assets.load(require("./assets/paddle/paddle.png"));
    const paddle = Sprite.from(paddleTexture);
    paddle.scale = { x: 0.12, y: 0.08 };
    paddle.x = this.app.screen.width / 2 - paddle.width / 2;
    paddle.y = this.app.screen.height - paddle.height - this.app.screen.height / 8;
    this.app.stage.addChild(paddle);

    document.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") paddle.x += 10;
      if (e.key === "ArrowLeft") paddle.x -= 10;
    });

    // this.app.ticker.add(delta => this.loop(delta))
  };
}

export default Game;
