var stage;


const KEYCODE_W = 87
const KEYCODE_S = 83
const KEYCODE_A = 65
const KEYCODE_D = 68

const KEYCODE_ARROW_UP = 38
const KEYCODE_ARROW_DOWN = 40
const KEYCODE_ARROW_LEFT = 37
const KEYCODE_ARROW_RIGHT = 39

const MAX_SPEED = 20

const GAME_WIDTH = 3840
const GAME_HEIGHT = 2160

const TICK = 60

let uHeld = false
let dHeld = false
let lHeld = false
let rHeld = false

var init = () => {
  stage = new createjs.Stage("demoCanvas")
  createjs.Ticker.framerate = TICK
  createjs.Ticker.addEventListener("tick", onTick);
}

function onTick() {
	if(player) {
		player.update();
	}
    stage.update();
}

class utils {
  static pointOnLine(obj1, obj2, dist) {
    var d = distance(obj1, obj2);
    [x, y] = [obj1.x - (dist * (obj1.x - obj2.x)) / d, obj1.y - (dist * (obj1.y - obj2.y)) / d]
    return [x, y]
  }

  static distance(obj1, obj2) {
    return ((obj1.x - obj2.x) ** 2 + (obj1.y - obj2.y) ** 2) ** 0.5
  }


  static random(min, max) {
    return min + Math.random() * (max - min);
  }
}

const makeParticle = (x, y, x1, y1, size) => {
  var particle = new createjs.Shape()
  particle.graphics.beginStroke("#696969").drawRoundRect(0, 0, size, size, 1);
  particle.regX = size / 2;
  particle.regY = size / 2;
  particle.x = x;
  particle.y = x;
  stage.addChild(particle)
  let time = utils.random(1000, 1500);
  createjs.Tween.get(particle, {
      loop: true
    })
    .to({
      rotation: Math.random() > 0.5 ? 360 : -360
    }, utils.random(500, 1000), createjs.Ease.linear)
  createjs.Tween.get(particle, {
      loop: false
    })
    .to({
      x: x1,
      y: y1
    }, time, createjs.Ease.getPowOut(3))
  createjs.Tween.get(particle, {
      loop: false
    })
    .to({
      alpha: 0
    }, time + 500, createjs.Ease.getPowOut(1))
}

class Player {
  constructor(x, y) {
    this.shape = new createjs.Shape();
	this.shape.x = x;
	this.shape.y = y;
    this.x = x;
	this.y = y;
    this.rotation = 0
    this.velocity = 0
    this.hasShield = false
    this.a = 5
    this.shotStream = []
    this.size = 30
    this.regX = this.regY = this.size / 2
    this.isStunned = false
    this.stunTime = 0
  }
  update() {
    // stun
    /*if(this.stunTime > 0) {
      this.stunTime = 1/TICK
    }
    this.isStunned = this.stunTime > 0 ? true : false

    // speed
    if(!isStunned) {
      if(rHeld === true) {
        this.moveXAxis = Math.min(moveXAxis + 0.2/TICK, 1)
      }
      if(lHeld === true) {
        this.moveXAxis = Math.max(moveXAxis - 0.2/TICK, -1)
      }
      if(uHeld === true) {
        this.moveYAxis = Math.min(moveXAxis + 0.2/TICK, 1)
      }
      if(dHeld === true) {
        this.moveYAxis = Math.max(moveXAxis - 0.2/TICK, -1)
      }
    }

    accelerate()
    move()*/
    this.rotate()
  }

  // move() {
  //   if (!this.isStunned) {
  //     this.x += this.velocity / tick * Math.cos(Math.atan2(this.moveYAxis, this.moveXAxis))
  //     this.y += this.velocity / tick * this.moveYAxis
  //   }
  // }

  rotate() {
    if (!this.isStunned) {
      this.rotation += 90 / TICK + 20 * Math.max(Math.abs(this.moveXAxis), Math.abs(this.moveYAxis)) / TICK
    } else {
      this.rotation += 45 / TICK
    }
	this.shape.rotation = this.rotation;
  }

  shoot() {
  if (!this.isStunned) {
      shot = fireShot(this.x, this.y, target)
      shotStream.push(shot)
    }
  }

  setCoords(x, y)  {
	this.x = x;
	this.y = y;
    createjs.Tween.get(this.shape, {
        loop: false
      })
      .to({
        x: x,
        y: y
      }, 1000/20, createjs.Ease.Linear)
  }


  // accelerate() {

  //   if (!this.isStunned) {
  //     this.velocity = Math.min(this.velocity + this.a / tick, MAX_SPEED)
  //   } else {
  //     this.velocity = Math.max(this.velocity - this.a, 0)
  //   }
  // }

  changeColor(color) {
    this.graphics.clear();
    this.graphics.beginStroke(color).drawRect(0, 0, this.size, this.size);
  }

  destroy() {
    makeParticle(this.x, this.y, utils.random(this.x))
    this.graphics.clear();
  }

  draw(color) {
    this.shape.graphics.beginStroke(color).drawRect(0, 0, this.size, this.size);
    this.shape.regX = this.shape.regY = this.size / 2;
	stage.addChild(this.shape);

  }

}

const fireShot = (x, y, target) => {
  shot = new createjs.Shape()
  shot.x = x
  shot.y = y
  distance = utils.distance({
    x: x,
    y: y
  }, target);
  velocity = 100
  time = distance / 100
  shot.rotation = Math.atan2(target.y - y, target.x - x) * 180 / Math.PI
  createjs.Tween.get(shot, {
      loop: false
    })
    .to({
      x: target.x,
      y: target.y
    }, time)

  return shot
}

const handleKeyDown = e => {
  switch (e.keyCode) {
    case KEYCODE_W:
    case KEYCODE_ARROW_UP:
      uHeld = true;
      break
    case KEYCODE_S:
    case KEYCODE_ARROW_DOWN:
      dHeld = true;
      break
    case KEYCODE_A:
    case KEYCODE_ARROW_LEFT:
      lHeld = true
      break
    case KEYCODE_D:
    case KEYCODE_ARROW_RIGHT:
      rHeld = true
      break;
  }
  sendHelds();
}

const handleKeyUp = e => {
  switch (e.keyCode) {
    case KEYCODE_W:
    case KEYCODE_ARROW_UP:
      uHeld = false
      break
    case KEYCODE_S:
    case KEYCODE_ARROW_DOWN:
      dHeld = false
      break
    case KEYCODE_A:
    case KEYCODE_ARROW_LEFT:
      lHeld = false
      break
    case KEYCODE_D:
    case KEYCODE_ARROW_RIGHT:
      rHeld = false
      break
  }
  sendHelds();
}

document.addEventListener('keyup', handleKeyUp);

document.addEventListener('keydown', handleKeyDown);

const ws = new WebSocket('ws://89.64.172.155:8082');

const connect = () => {
  ws.send(JSON.stringify({opcode: 'spawn', nick: 'xd'}));
}

const spawn = () => {
}

var player;

ws.onmessage = event => {
  data = JSON.parse(event.data);
  if(data.opcode == "spawned") {
	console.log(data);
    player = new Player(data.x, data.y);
	player.draw("black");
  }
  if(data.opcode == "pos") {
    player.setCoords(data.x, data.y)
  }
}

const sendHelds = () => {
  ws.send(JSON.stringify({opcode: 'held', uHeld: uHeld, dHeld: dHeld, lHeld: lHeld, rHeld: rHeld}))
}
