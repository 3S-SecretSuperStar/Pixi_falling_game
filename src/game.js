import {
  Application,
  Sprite,
  Assets,
  Text,
  Container,
  // TilingSprite,
  // Graphics,
} from "pixi.js";
import cnst from "./constants";

class Game {
  constructor(gameId) {
    this.gameId = gameId;
    this.inPlay = false;
    this.finished = false;
    this.started = false;
    this.lastId = 0;
    // this.paddle = null;
    this.elements = [];
    this.startPauseCont = null;
    this.startPauseText = null;
    this.scoreText = null;
    this.lostelements = 0;
    this.score = 0;
    // this.gameOverText = null;
    this.level = 1;
    this.speedMultiplier = 1 + 0.1 * this.level;
    this.healthCont = null;
    this.currentHpBar = null;
    this.eventListeners = [];
    this.timer = 0;
    this.lastTimerStart = 0;
    this.timerIntervalId = 0;
    this.velocityX = 0.0;
    this.craterTOId = null;
    this.craterTOStart = null;
    this.craterTOLeft = null;
    this.score = 0;

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

    // this.setupPaddle();

    this.app.ticker.add((d) => this.loop(d));
  };
  
 
  loadAssets = async () => {
    const textures = await Promise.all([
      Assets.load(require("./assets/image/meteor.png")),
      Assets.load(require("./assets/image/crater.png")),
      Assets.load(require("./assets/image/destroy.png")),
    ]);
    // this.paddleTextureNominal = textures[0];
    // this.paddleTextureLeft = textures[1];
    // this.paddleTextureRight = textures[2];
    this.meteorTexture = textures[0];
    this.startPauseButtonTexture = textures[1];
    this.craterTexture = textures[1];
    this.destroyTextrue = textures[2];
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
  //   if (timerSeconds % cnst.TIME_THRESHOLD === 0 && this.lostelements > 0)
  //     this.updateLost(this.lostelements - 0.5);
  // };

  loop = (d) => {
    if (!this.inPlay) return;
    const elementsToRemove = [];
    for (let i = 0; i < this.elements.length; i++) {
      if (this.elements[i].type  === "crater") {
        const crater = this.elements[i];
        if (crater.isDestroyed === 0) {
          if (crater.isLeft === 1) {
            crater.x += crater.xSpeed * d;
          } else {
            crater.x -= crater.xSpeed * d;
          }
          crater.y += crater.ySpeed * d;
          crater.xSpeed += crater.accSpeed * 0.5;
        } else if (Date.now() - crater.destroyedTime > 500) {
          elementsToRemove.push(crater);
        }
        if (crater.y >= this.app.screen.height || crater.x >= this.app.screen.width) {
          elementsToRemove.push(crater);
          // this.updateLost(this.lostelements + 1);
        }
      }
      else {
        const meteor = this.elements[i];
        if (meteor.isDestroyed === 0) {
          
          meteor.y += meteor.speed * d;
          // meteor.speed += meteor.speed * 0.5;
        } else if (Date.now() - meteor.destroyedTime > 500) {
          elementsToRemove.push(meteor);
        }
        if (meteor.y >= this.app.screen.height || meteor.x >= this.app.screen.width) {
          elementsToRemove.push(meteor);
          // this.updateLost(this.lostelements + 1);
        }
      }


    }
    for (let i = 0; i < elementsToRemove.length; i++) {
     
        const crater = elementsToRemove[i];
      let _elements = [...this.elements];
      _elements = _elements.filter((_crater) => _crater.id !== crater.id);
      this.elements = [..._elements];
      this.app.stage.removeChild(crater);
      
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
      clearTimeout(this.craterTOId);
      this.craterTOLeft -= Date.now() - this.craterTOStart;
    } else if (this.craterTOStart > 0 && this.craterTOLeft > 0) {
      this.craterTOStart = Date.now();
      this.craterTOId = setTimeout(() => {
        this.generateElement();
      }, this.craterTOLeft);
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
    clearTimeout(this.craterTOId);
    this.craterTOStart = null;
    this.updateStartPauseText("Pause");
    this.inPlay = true;
    this.finished = false;
    this.started = true;
    // this.updateCursor();
    this.lostelements = 0;
    this.updateScore(0);
    // this.updateLost(0);
    // this.updateLevel();
    for (let i = 0; i < this.elements.length; i++) {
      this.app.stage.removeChild(this.elements[i]);
    }
    this.elements = [];
    this.generateElement();
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
      //   if (newScore % healthThreshold === 0 && this.lostcraters > 0)
      //     this.updateLost(this.lostcraters - 1);
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

    // this.healthCont = new Container();
    // this.healthCont.sortableChildren = true;
    // this.healthCont.x = this.app.screen.width * 0.05;
    // this.healthCont.y = this.app.screen.height * 0.055;
    // this.healthCont.zIndex = 100;
    // this.app.stage.addChild(this.healthCont);

    this.scoreText = new Text("Score: 0");
    this.scoreText.x = this.app.screen.width * 0.05;
    this.scoreText.y = this.app.screen.height * 0.1;
    this.scoreText.zIndex = 100;
    this.app.stage.addChild(this.scoreText);
  };

  // setupPaddle = () => {
  //   // this.paddle = Sprite.from(this.paddleTextureNominal);
  //   // not the best idea when the screen is very wide
  //   this.paddle.scale = {
  //     x: Math.max(Math.min(this.app.screen.width / 1000, 0.9), 0.35),
  //     y: Math.max(Math.min(this.app.screen.height / 1000, 0.9), 0.35),
  //   };
  // };

  // setPaddlePosition = (clientX) => {
  //   if (!this.inPlay) return;
  //   const newX = Math.min(
  //     Math.max(0, clientX),
  //     this.app.screen.width - this.paddle.width
  //   );
  //   if (newX > this.app.screen.width - this.paddle.width) {
  //     newX = this.app.screen.width - this.paddle.width;
  //   } else if (newX < 0) {
  //     newX = 0;
  //   }
  //   // const lOrR = this.paddle.x < newX;
  //   // this.paddle.x = newX;
  //   // if (lOrR) this.paddle.texture = this.paddleTextureRight;
  //   // else this.paddle.texture = this.paddleTextureLeft;
  //   // clearTimeout(this.paddleTextureTimeout);
  //   // this.paddleTextureTimeout = setTimeout(() => {
  //   //   this.paddle.texture = this.paddleTextureNominal;
  //   // }, 200);
  // };

  generateElement = () => {
    if (
      !this.finished &&
      this.inPlay &&
      this.elements.length < cnst.MAX_Element_IN_PLAY
    ) {
      const crater = Sprite.from(this.craterTexture);
      crater.interactive = true;
      crater.eventMode = 'dynamic';
      crater.cursor = 'pointer';
      crater.isDestroyed = 0;
      crater.destroyedTime = 0;
      crater.type = "crater"
      crater.id = this.lastId++;
      crater.ySpeed =
        (Math.random() * cnst.MAX_ADDITIONAL_SPEED + cnst.MIN_FALLING_SPEED) *
        this.speedMultiplier;
      crater.xSpeed = crater.ySpeed / 2;
      
      const time = this.app.screen.height / crater.ySpeed;
      crater.accSpeed = (this.app.screen.width - crater.xSpeed * time) * 2 / Math.pow(time, 2);
      crater.scale = {
        x: Math.max(Math.min(this.app.screen.width / 1200, 0.1), 0.2),
        y: Math.max(Math.min(this.app.screen.width / 1200, 0.1), 0.2),
      };
      crater.x = Math.max(
        Math.min(
          this.app.screen.width - crater.width - cnst.MIN_CRATER_SIDE_OFFSET,
          Math.floor(Math.random() * this.app.screen.width)
        ),
        cnst.MIN_CRATER_SIDE_OFFSET
      );
      crater.isLeft = crater.x > this.app.screen.width / 2 ? 0 : 1;
      crater.y = 20;
      crater.zIndex = 1;
      crater.on('pointerdown', () => {
        if (crater.isDestroyed === 0) {
          crater.texture = this.destroyTextrue;
          crater.isDestroyed = 1;
          crater.destroyedTime = Date.now();
          crater.scale = {
            x: 1,
            y: 1,
          };
          crater.x -= crater.width / 2;
          crater.y -= crater.height / 2;
        }
        this.score+=1;
      });

      const meteor = Sprite.from(this.meteorTexture);
      meteor.interactive = true;
      meteor.eventMode = 'dynamic';
      meteor.cursor = 'pointer';
      meteor.isDestroyed = 0;
      meteor.destroyedTime = 0;
      meteor.type = "meteor"
      meteor.id = this.lastId++;
      meteor.speed =
        (Math.random() * cnst.MAX_ADDITIONAL_SPEED + cnst.MIN_FALLING_SPEED) *
        this.speedMultiplier;

      meteor.scale = {
        x: Math.max(Math.min(this.app.screen.width / 1200, 0.05), 0.1),
        y: Math.max(Math.min(this.app.screen.width / 1200, 0.05), 0.1),
      };
      meteor.x = Math.max(
        Math.min(
          this.app.screen.width - meteor.width - cnst.MIN_CRATER_SIDE_OFFSET,
          Math.floor(Math.random() * this.app.screen.width)
        ),
        cnst.MIN_CRATER_SIDE_OFFSET
      );
      meteor.isLeft = meteor.x > this.app.screen.width / 2 ? 0 : 1;
      meteor.y = 20;
      meteor.zIndex = 1;
      meteor.on('pointerdown', () => {
        if (meteor.isDestroyed === 0) {
          meteor.texture = this.destroyTextrue;
          meteor.isDestroyed = 1;
          meteor.destroyedTime = Date.now();
          meteor.scale = {
            x: 1,
            y: 1,
          };
          meteor.x -= meteor.width / 2;
          meteor.y -= meteor.height / 2;
        }
      });


      console.log("crater", crater)
      console.log("meteor", meteor)
      this.elements.push(crater);
      this.elements.push(meteor);
      this.app.stage.addChild(crater);
      this.app.stage.addChild(meteor);
    }

    const spawnInterval =
      (Math.random() * cnst.MAX_SPAWN_TIME + cnst.MIN_SPAWN_TIME) /
      this.speedMultiplier;
    this.craterTOLeft = spawnInterval;
    this.craterTOStart = Date.now();
    this.craterTOId = setTimeout(() => {
      this.generateElement();
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
