let uHeld = false
let dHeld = false
let lHeld = false
let rHeld = false
var player, stage, ws;

var init = () => {
  stage = new createjs.Stage("demoCanvas")
  createjs.Ticker.framerate = TICK
  createjs.Ticker.addEventListener("tick", onTick)
  document.addEventListener('keyup', handleKeyUp)
  document.addEventListener('keydown', handleKeyDown)
  ws = new WebSocket(`ws://${IP}:${PORT}`)
}

function onTick() {
  if(player) {
    player.update()
  }
  for(enemy in players) {
    players[enemy].rotate()
  }
  stage.update()
}

const makeParticle = (x, y, x1, y1, size) => {
  var particle = new createjs.Shape()
  particle.graphics.beginStroke("#696969").drawRoundRect(0, 0, size, size, 1)
  particle.regX = size / 2
  particle.regY = size / 2
  particle.x = x
  particle.y = x
  stage.addChild(particle)
  let time = utils.random(1000, 1500)
  createjs.Tween.get(particle, {loop: true})
    .to({
      rotation: Math.random() > 0.5 ? 360 : -360
    }, utils.random(500, 1000), createjs.Ease.linear)
  createjs.Tween.get(particle, {loop: false})
    .to({
      x: x1,
      y: y1
    }, time, createjs.Ease.getPowOut(3))
  createjs.Tween.get(particle, {loop: false})
    .to({
      alpha: 0
    }, time + 500, createjs.Ease.getPowOut(1))
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
}

let players = {};

// Server connection
const connect = () => {
  ws.send(JSON.stringify({
    opcode: 'spawn',
    nick: 'xd'
  }));
  ws.onmessage = event => {
    data = JSON.parse(event.data);
    if (data.opcode == "spawned") {
      console.log(data);
      player = new Player(data.x, data.y);
      player.draw('beginStroke', 'black');
    }
    if (data.opcode == "spawnedO") {
      players[data.id] = new Player(data.x, data.y);
      players[data.id].draw('beginFill', 'black');
    }
    if (data.opcode == "posO") {
      players[data.id].doEnemy(data.x, data.y, data.xAxis, data.yAxis);
    }
    if (data.opcode == "pos") {
      player.setCoords1(data.x, data.y)
    }
  }
}

const sendAxis = (array) => {
  ws.send(JSON.stringify({
    opcode: 'axis',
    array: array
  }))
}
