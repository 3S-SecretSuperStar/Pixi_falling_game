import { Application, Sprite, Assets, Texture } from "pixi.js";
import cnst from "./constants";

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
    this.app.stage.sortableChildren = true; // to sort everything by zIndex
    this.setup();
  }

  lastId = 0;

  loop = (d) => {
    const ballsToRemove = [];
    for (let i = 0; i < this.balls.length; i++) {
      const ball = this.balls[i];
      ball.y += ball.speed * d;
      if (ball.y >= this.app.screen.height) {
        ballsToRemove.push(ball);
      }
    }
    for (let i = 0; i < ballsToRemove.length; i++) {
      const ball = ballsToRemove[i];
      let _balls = [...this.balls];
      _balls = _balls.filter((_ball) => _ball.id !== ball.id);
      this.balls = [..._balls];
      this.app.stage.removeChild(ball);
    }
  };

  balls = [];

  setup = async () => {
    const paddleTexture = await Assets.load(require("./assets/paddle/paddle.png"));
    const paddle = Sprite.from(paddleTexture);
    paddle.scale = { x: 0.16, y: 0.09 };
    paddle.x = this.app.screen.width / 2 - paddle.width / 2;
    paddle.y =
      this.app.screen.height -
      paddle.height -
      this.app.screen.height * cnst.PADDLE_BOTTOM_PERCENTAGE;
    paddle.zIndex = 2;
    this.app.stage.addChild(paddle);

    document.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") paddle.x += 30;
      if (e.key === "ArrowLeft") paddle.x -= 30;
    });

    const generateBall = async () => {
      if (this.balls.length < cnst.MAX_BALLS_IN_PLAY) {
        const ballTexture = await Assets.load(require("./assets/ball/ball.png"));
        const ball = Sprite.from(ballTexture);
        ball.id = this.lastId++;
        ball.speed =
          Math.random() * cnst.MAX_ADDITIONAL_SPEED + cnst.MIN_FALLING_SPEED;
        ball.scale = { x: 0.07, y: 0.07 };
        ball.x = Math.max(
          Math.min(
            this.app.screen.width - cnst.MIN_BALL_SIDE_OFFSET,
            Math.floor(Math.random() * this.app.screen.width)
          ),
          cnst.MIN_BALL_SIDE_OFFSET
        );
        ball.y = 20;
        ball.zIndex = 1;
        ball.tint = cnst.COLORS[Math.floor(Math.random() * cnst.COLORS.length)];
        this.app.stage.addChild(ball);
        this.balls.push(ball);
      }
      setTimeout(() => {
        generateBall();
      }, Math.random() * cnst.MAX_SPAWN_TIME + cnst.MIN_SPAWN_TIME);
    };

    generateBall();

    this.app.ticker.add((d) => this.loop(d));
  };
}

export default Game;
