import {
  Application,
  Sprite,
  Assets,
  Text,
  Container,
  TilingSprite,
  Graphics,
} from "pixi.js";
import cnst from "./constants";

class Game {
  constructor(gameId) {
    this.gameId = gameId;
    this.inPlay = false;
    this.finished = false;
    this.started = false;
    this.lastId = 0;
    this.paddle = null;
    this.balls = [];
    this.startPauseCont = null;
    this.startPauseText = null;
    this.scoreText = null;
    this.lostBalls = 0;
    this.score = 0;
    this.gameOverText = null;
    this.level = 1;
    this.speedMultiplier = 1 + 0.1 * this.level;
    this.healthCont = null;
    this.currentHpBar = null;
    this.eventListeners = [];
    this.timer = 0;
    this.lastTimerStart = 0;
    this.timerIntervalId = 0;
    this.velocityX = 0.0;
    this.ballTOId = null;
    this.ballTOStart = null;
    this.ballTOLeft = null;

    // this.canvas = document.createElement('canvas');
    // this.view = this.canvas.transferControlToOffscreen();
    this.app = new Application();

    this.app = new Application({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: "white",
      resizeTo: window,
    });
    // document.body.appendChild(this.app.canvas)
    this.app.renderer.view.style.position = "absolute";
    this.view = this.app.view;
    this.app.stage.sortableChildren = true; // to sort everything by zIndex
    // document.body.appendChild(this.canvas)
    this.setup();
  }

  setup = async () => {
    // well there's gotta be a better way to do this...
    await this.loadAssets();

    if (!this.gameId) return;

    this.setupHud();

    this.setupPaddle();

    this.app.ticker.add((d) => this.loop(d));
  };

  loadAssets = async () => {
    const textures = await Promise.all([
      Assets.load(require("./assets/paddle/paddle.png")),
      Assets.load(require("./assets/paddle/paddleLeft.png")),
      Assets.load(require("./assets/paddle/paddleRight.png")),
      Assets.load(require("./assets/image/meteor.png")),
      Assets.load(require("./assets/paddle/paddle.png")),
      Assets.load(require("./assets/image/destroy.png")),
    ]);
    this.paddleTextureNominal = textures[0];
    this.paddleTextureLeft = textures[1];
    this.paddleTextureRight = textures[2];
    // this.bgTexture = textures[3];
    this.ballTexture = textures[3];
    this.startPauseButtonTexture = textures[4];
    this.destroyTextrue = textures[5];
  };

  startPauseTimer = (sOrP) => {
    if (sOrP) {
      this.lastTimerStart = Date.now();
      // this.timerIntervalId = setInterval(() => {
      //   // this.updateTimerText();
      // }, 1000);
    } else {
      clearInterval(this.timerIntervalId);
      this.timer += Date.now() - this.lastTimerStart;
      this.lastTimerStart = Date.now();
      // this.updateTimerText();
    }
  };

  // updateTimerText = (restart) => {
  //   const timerSeconds = restart
  //     ? 0
  //     : Math.floor((this.timer + Date.now() - this.lastTimerStart) / 1000);
  //   let newD = new Date(null);
  //   newD.setHours(0);
  //   newD.setSeconds(timerSeconds);
  //   // const formattedTime = newD.toLocaleTimeString([], {
  //   //   hour: "2-digit",
  //   //   minute: "2-digit",
  //   //   second: "2-digit",
  //   // });
  //   // this.timerText.text = "Time: " + formattedTime;
  //   if (timerSeconds % cnst.TIME_THRESHOLD === 0 && this.lostBalls > 0)
  //     this.updateLost(this.lostBalls - 0.5);
  // };

  loop = (d) => {
    if (!this.inPlay) return;
    const ballsToRemove = [];
    for (let i = 0; i < this.balls.length; i++) {
      const ball = this.balls[i];
      if (ball.isDestroyed == 0) {
        if (ball.isLeft == 1) {
          ball.x += ball.xSpeed * d;
        } else {
          ball.x -= ball.xSpeed * d;
        }
        ball.y += ball.ySpeed * d;
        ball.xSpeed += ball.accSpeed * 0.5;
      } else if (Date.now() - ball.destroyedTime > 500) {
        ballsToRemove.push(ball);
      }
      if (ball.y >= this.app.screen.height || ball.x >= this.app.screen.width) {
        ballsToRemove.push(ball);
        // this.updateLost(this.lostBalls + 1);
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

  onStartPauseClick = () => {
    this.startPauseGame();
  };

  startPauseGame = (pause) => {
    if (!this.started || (!pause && this.finished)) {
      this.restartGame();
      return;
    }
    this.inPlay = pause ? false : !this.inPlay;
    if (!this.inPlay) {
      clearTimeout(this.ballTOId);
      this.ballTOLeft -= Date.now() - this.ballTOStart;
    } else if (this.ballTOStart > 0 && this.ballTOLeft > 0) {
      this.ballTOStart = Date.now();
      this.ballTOId = setTimeout(() => {
        this.generateBall();
      }, this.ballTOLeft);
    }
    // this.updateCursor();
    this.startPauseTimer(this.inPlay);
    this.updateStartPauseText(this.inPlay ? "Pause" : "Resume");
  };

  updateStartPauseText = (newText) => {
    this.startPauseText.text = newText;
    this.startPauseText.x =
      this.startPauseCont.width / 2 - this.startPauseText.width / 2;
    this.startPauseText.y =
      this.startPauseCont.height / 2 - this.startPauseText.height / 2;
  };

  restartGame = () => {
    clearTimeout(this.ballTOId);
    this.ballTOStart = null;
    this.updateStartPauseText("Pause");
    this.inPlay = true;
    this.finished = false;
    this.started = true;
    // this.updateCursor();
    this.lostBalls = 0;
    this.updateScore(0);
    // this.updateLost(0);
    // this.updateLevel();
    for (let i = 0; i < this.balls.length; i++) {
      this.app.stage.removeChild(this.balls[i]);
    }
    this.balls = [];
    this.generateBall();
    this.app.stage.removeChild(this.gameOverText);
    this.gameOverText = null;
    this.timer = 0;
    // this.updateTimerText(true);
    this.startPauseTimer(true);
  };

  updateScore = (newScore) => {
    if (newScore % cnst.LEVEL_THRESHOLD === 0) {
      // this.updateLevel(1);
      // const healthThreshold = Math.floor(
      //   this.speedMultiplier * cnst.LEVEL_THRESHOLD
      // );
      //   if (newScore % healthThreshold === 0 && this.lostBalls > 0)
      //     this.updateLost(this.lostBalls - 1);
    }
    this.score = newScore;
    this.scoreText.text = "Score: " + this.score;
  };

  setupHud = () => {
    // todo: set anchor to middle for pretty much everything

    this.startPauseCont = new Container();
    const startPauseButton = Sprite.from(this.startPauseButtonTexture);
    this.startPauseText = new Text();
    this.startPauseText.scale = { x: 0.8, y: 0.8 };
    this.startPauseCont.addChild(startPauseButton);
    this.startPauseCont.addChild(this.startPauseText);

    startPauseButton.scale = {
      x: Math.max(Math.min(this.app.screen.width / 800, 1), 0.5),
      y: Math.max(Math.min(this.app.screen.height / 600, 1.9), 1.2),
    };

    this.startPauseCont.x = this.app.screen.width / 2 - startPauseButton.width / 2;
    this.startPauseCont.y = this.app.screen.height * 0.053;
    this.startPauseCont.zIndex = 100;
    this.startPauseCont.interactive = true;
    this.startPauseCont.on("click", this.onStartPauseClick);
    this.startPauseCont.on("touchend", this.onStartPauseClick);
    // this.initializeGyro();

    this.updateStartPauseText("Start");

    this.app.stage.addChild(this.startPauseCont);

    this.healthCont = new Container();
    this.healthCont.sortableChildren = true;
    this.healthCont.x = this.app.screen.width * 0.05;
    this.healthCont.y = this.app.screen.height * 0.055;
    this.healthCont.zIndex = 100;
    this.app.stage.addChild(this.healthCont);

    this.scoreText = new Text("Score: 0");
    this.scoreText.x = this.app.screen.width * 0.05;
    this.scoreText.y = this.app.screen.height * 0.1;
    this.scoreText.zIndex = 100;
    this.app.stage.addChild(this.scoreText);
  };

  setupPaddle = () => {
    this.paddle = Sprite.from(this.paddleTextureNominal);
    // not the best idea when the screen is very wide
    this.paddle.scale = {
      x: Math.max(Math.min(this.app.screen.width / 1000, 0.9), 0.35),
      y: Math.max(Math.min(this.app.screen.height / 1000, 0.9), 0.35),
    };
  };

  setPaddlePosition = (clientX) => {
    if (!this.inPlay) return;
    const newX = Math.min(
      Math.max(0, clientX),
      this.app.screen.width - this.paddle.width
    );
    if (newX > this.app.screen.width - this.paddle.width) {
      newX = this.app.screen.width - this.paddle.width;
    } else if (newX < 0) {
      newX = 0;
    }
    const lOrR = this.paddle.x < newX;
    this.paddle.x = newX;
    if (lOrR) this.paddle.texture = this.paddleTextureRight;
    else this.paddle.texture = this.paddleTextureLeft;
    clearTimeout(this.paddleTextureTimeout);
    this.paddleTextureTimeout = setTimeout(() => {
      this.paddle.texture = this.paddleTextureNominal;
    }, 200);
  };

  generateBall = () => {
    if (
      !this.finished &&
      this.inPlay &&
      this.balls.length < cnst.MAX_BALLS_IN_PLAY
    ) {
      const ball = Sprite.from(this.ballTexture);
      ball.interactive = true;
      ball.eventMode = 'dynamic';
      ball.cursor = 'pointer';
      ball.isDestroyed = 0;
      ball.destroyedTime = 0;
      ball.id = this.lastId++;
      ball.ySpeed =
      (Math.random() * cnst.MAX_ADDITIONAL_SPEED + cnst.MIN_FALLING_SPEED) *
      this.speedMultiplier;
      ball.xSpeed = ball.ySpeed / 2;
      const time = this.app.screen.height / ball.ySpeed;
      ball.accSpeed = (this.app.screen.width - ball.xSpeed * time) * 2 / Math.pow(time, 2);
      ball.scale = {
        x: Math.max(Math.min(this.app.screen.width / 1200, 0.05), 0.1),
        y: Math.max(Math.min(this.app.screen.width / 1200, 0.05), 0.1),
      };
      ball.x = Math.max(
        Math.min(
          this.app.screen.width - ball.width - cnst.MIN_BALL_SIDE_OFFSET,
          Math.floor(Math.random() * this.app.screen.width)
        ),
        cnst.MIN_BALL_SIDE_OFFSET
      );
      ball.isLeft = ball.x > this.app.screen.width / 2 ? 0 : 1;
      ball.y = 20;
      ball.zIndex = 1;
      ball.on('pointerdown', () => {
        if (ball.isDestroyed == 0) {        
          ball.texture = this.destroyTextrue;
          ball.isDestroyed = 1;
          ball.destroyedTime = Date.now();
          ball.scale = {
            x: 1,
            y: 1,
          };
          ball.x -= ball.width / 2;
          ball.y -= ball.height / 2;
        }
      });
      this.balls.push(ball);
      this.app.stage.addChild(ball);
    }
    
    const spawnInterval =
      (Math.random() * cnst.MAX_SPAWN_TIME + cnst.MIN_SPAWN_TIME) /
      this.speedMultiplier;
    this.ballTOLeft = spawnInterval;
    this.ballTOStart = Date.now();
    this.ballTOId = setTimeout(() => {
      this.generateBall();
    }, spawnInterval);
  };

  destroy = () => {
    this.gameId = undefined;
    this.eventListeners.forEach((eL) => {
      eL.object.removeEventListener(eL.key, eL.cb);
    });
    this.app.destroy(true, true);
  };
}

export default Game;
