import { Application, Sprite, Assets, Text, Container } from "pixi.js";
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

  inPlay = false;
  finished = false;
  lastId = 0;
  paddle = null;
  balls = [];
  startPauseCont = null;
  startPauseText = null;
  scoreText = null;
  lostText = null;
  lostBalls = 0;
  score = 0;
  gameOverText = null;

  setup = () => {
    this.setupHud();

    this.setupPaddle();

    this.generateBall();

    this.app.ticker.add((d) => this.loop(d));
  };

  loop = (d) => {
    if (!this.inPlay) return;
    const ballsToRemove = [];
    for (let i = 0; i < this.balls.length; i++) {
      const ball = this.balls[i];
      ball.y += ball.speed * d;
      if (ball.y >= this.app.screen.height) {
        ballsToRemove.push(ball);
        this.updateLost(this.lostBalls + 1);
        if (this.lostBalls >= cnst.LOST_ALLOWED) {
          this.gameOver();
        }
      } else if (this.ballCollided(ball)) {
        ballsToRemove.push(ball);
        this.updateScore(this.score + 1);
        this.paddle.tint = ball.tint;
        setTimeout(() => {
          this.paddle.tint = 0xffffff;
        }, 350);
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

  ballCollided = (ball) => {
    return (
      this.paddle.x < ball.x + ball.width &&
      this.paddle.x + this.paddle.width > ball.x &&
      this.paddle.y < ball.y + ball.height &&
      this.paddle.y + this.paddle.height / 2 > ball.y + ball.height / 4
    );
  };

  startPauseGame = () => {
    if (this.finished) {
      this.restartGame();
      return;
    }
    this.inPlay = !this.inPlay;
    this.updateStartPauseText(this.inPlay ? "Pause" : "Resume");
  };

  updateStartPauseText = (newText) => {
    this.startPauseText.text = newText;
    this.startPauseText.x =
      this.startPauseCont.width / 2 - this.startPauseText.width / 2;
    this.startPauseText.y =
      this.startPauseCont.height / 2 - this.startPauseText.height / 2;
  };

  gameOver = () => {
    this.updateStartPauseText("Restart");
    this.inPlay = false;
    this.finished = true;
    this.gameOverText = new Text("Game over");
    this.gameOverText.x = this.app.screen.width * 0.5 - this.gameOverText.width / 2;
    this.gameOverText.y = this.app.screen.height * 0.5;
    this.gameOverText.zIndex = 100;
    this.app.stage.addChild(this.gameOverText);
  };

  restartGame = () => {
    this.updateStartPauseText("Pause");
    this.inPlay = true;
    this.finished = false;
    this.lostBalls = 0;
    this.updateScore(0);
    this.updateLost(0);
    for (let i = 0; i < this.balls.length; i++) {
      this.app.stage.removeChild(this.balls[i]);
    }
    this.balls = [];
    this.generateBall();
    this.app.stage.removeChild(this.gameOverText);
    this.gameOverText = null;
  };

  updateScore = (newScore) => {
    this.score = newScore;
    this.scoreText.text = "Score: " + this.score;
  };

  updateLost = (newLost) => {
    this.lostBalls = newLost;
    this.lostText.text = "Lost: " + this.lostBalls;
  };

  setupHud = async () => {
    // todo: set anchor to middle for pretty much everything

    this.startPauseCont = new Container();
    const startPauseButtonTexture = await Assets.load(
      require("./assets/paddle/paddle.png")
    );
    const startPauseButton = Sprite.from(startPauseButtonTexture);
    this.startPauseText = new Text();
    this.startPauseCont.addChild(startPauseButton);
    this.startPauseCont.addChild(this.startPauseText);

    startPauseButton.scale = { x: 0.14, y: 0.14 };

    this.startPauseCont.x = this.app.screen.width / 2 - startPauseButton.width / 2;
    this.startPauseCont.y = this.app.screen.height * 0.05;
    this.startPauseCont.zIndex = 100;
    this.startPauseCont.interactive = true;
    this.startPauseCont.on("click", () => this.startPauseGame());

    this.updateStartPauseText("Start");

    this.app.stage.addChild(this.startPauseCont);

    this.scoreText = new Text("Score: 0");
    this.scoreText.x = this.app.screen.width * 0.05;
    this.scoreText.y = this.app.screen.height * 0.05;
    this.scoreText.zIndex = 100;
    this.app.stage.addChild(this.scoreText);

    this.lostText = new Text("Lost: 0");
    this.lostText.x = this.app.screen.width * 0.05;
    this.lostText.y = this.app.screen.height * 0.1;
    this.lostText.zIndex = 100;
    this.app.stage.addChild(this.lostText);
  };

  setupPaddle = async () => {
    const paddleTexture = await Assets.load(require("./assets/paddle/paddle.png"));
    this.paddle = Sprite.from(paddleTexture);
    this.paddle.scale = { x: 0.16, y: 0.09 };
    this.paddle.x = this.app.screen.width / 2 - this.paddle.width / 2;
    this.paddle.y =
      this.app.screen.height -
      this.paddle.height -
      this.app.screen.height * cnst.PADDLE_BOTTOM_OFFSET_PERCENTAGE;
    this.paddle.zIndex = 2;
    this.paddle.tint = 0xffffff;

    // todo: set anchor to middle for pretty much everything
    // this.paddle.anchor.x = 0.5;
    // this.paddle.anchor.y = 0.5;

    this.app.stage.addChild(this.paddle);

    document.addEventListener("keydown", (e) => {
      if (!this.inPlay) return;
      if (e.key === "ArrowRight") movePaddleBy(cnst.PADDLE_MOVE_INCREMENT);
      if (e.key === "ArrowLeft") movePaddleBy(-cnst.PADDLE_MOVE_INCREMENT);
    });
    document.addEventListener("mousemove", (e) => {
      if (!this.inPlay) return;
      setPaddlePosition(
        Math.min(Math.max(0, e.clientX), this.app.screen.width - this.paddle.width)
      );
    });

    const movePaddleBy = (amount) => {
      let newX = this.paddle.x + amount;
      setPaddlePosition(newX);
    };
    const setPaddlePosition = (newX) => {
      if (newX > this.app.screen.width - this.paddle.width) {
        newX = this.app.screen.width - this.paddle.width;
      } else if (newX < 0) {
        newX = 0;
      }
      this.paddle.x = newX;
    };
  };

  generateBall = async () => {
    if (
      !this.finished &&
      this.inPlay &&
      this.balls.length < cnst.MAX_BALLS_IN_PLAY
    ) {
      const ballTexture = await Assets.load(require("./assets/ball/ball.png"));
      const ball = Sprite.from(ballTexture);
      ball.id = this.lastId++;
      ball.speed =
        Math.random() * cnst.MAX_ADDITIONAL_SPEED + cnst.MIN_FALLING_SPEED;
      ball.scale = { x: 0.07, y: 0.07 };
      ball.x = Math.max(
        Math.min(
          this.app.screen.width - ball.width - cnst.MIN_BALL_SIDE_OFFSET,
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
      this.generateBall();
    }, Math.random() * cnst.MAX_SPAWN_TIME + cnst.MIN_SPAWN_TIME);
  };
}

export default Game;
