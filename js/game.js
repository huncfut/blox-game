let held = {
  up: false,
  down: false,
  left: false,
  right: false
}
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
    sendHelds({
      held
    })
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
      held.up = true;
      break
    case KEYCODE_S:
    case KEYCODE_ARROW_DOWN:
      held.down = true;
      break
    case KEYCODE_A:
    case KEYCODE_ARROW_LEFT:
      held.left = true
      break
    case KEYCODE_D:
    case KEYCODE_ARROW_RIGHT:
      held.right = true
      break;
  }
}

const handleKeyUp = e => {
  switch (e.keyCode) {
    case KEYCODE_W:
    case KEYCODE_ARROW_UP:
      held.up = false
      break
    case KEYCODE_S:
    case KEYCODE_ARROW_DOWN:
      held.down = false
      break
    case KEYCODE_A:
    case KEYCODE_ARROW_LEFT:
      held.left = false
      break
    case KEYCODE_D:
    case KEYCODE_ARROW_RIGHT:
      held.right = false
      break
  }
}

let players = {};

const drawPlayer = (player, type, color) => {
  player.shape.graphics[type](color).drawRect(player.position.x, player.position.y, player.size, player.size);
  player.shape.regX = player.shape.regY = player.size / 2;
  stage.addChild(player.shape);
}
// Server connection
const connect = () => {
  ws.send(JSON.stringify({
    opcode: 'spawn',
    data: {
      nick: "xd"
    }
  }));
  ws.onmessage = event => {
    console.log(event)
    data = JSON.parse(event.data);
    if (data.opcode == "spawned") {
      console.log(data);
      player = new Player(data.position);
      drawPlayer(player, 'beginStroke', 'black');
    }
    if (data.opcode == "spawnedO") {
      players[data.id] = new Player(data.position);
      drawPlayer(players[data.id], 'beginFill', 'black');
    }
    if (data.opcode == "posO") {
      players[data.id].update(data)
    }
    if (data.opcode == "pos") {

      player.update(data)
    }
  }
}

const sendHelds = data => {
  ws.send(JSON.stringify({
    opcode: 'helds',
    data
  }))
}
