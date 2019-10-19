let held = {
  up: false,
  down: false,
  left: false,
  right: false
}
var players = {}, shapes = {}, stage, ws, selfId;

var init = () => {
  stage = new createjs.Stage("demoCanvas")
  createjs.Ticker.framerate = TICK
  createjs.Ticker.addEventListener("tick", onTick)
  document.addEventListener('keyup', handleKeyUp)
  document.addEventListener('keydown', handleKeyDown)
  ws = new WebSocket(`ws://${IP}:${PORT}`)
}

function onTick() {

  for(id in players) {
    if(id === selfId) {
      sendHelds({ held })
    }
    shapes[id].rotation = shapes[id].rotation + 2 + players[id].v/35 || 0
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

const drawShape = (shape, type, color, size) => {
  shape.graphics[type](color).drawRect(shape.x, shape.y, size, size)
  shape.regX = shape.regY = size / 2
  stage.addChild(shape)
}
// Server connection
const connect = () => {
  // disable button
  //
  ws.send(JSON.stringify({
    opcode: 'spawn',
    data: {
      nick: "xd"
    }
  }))
  ws.onmessage = event => {

    data = JSON.parse(event.data)
    if(data.opcode == "spawned") {
      console.log(data)
      shapes[data.id] = new createjs.Shape()
      players[data.id] = new Player(data.position)
      if(data.isMe) {
        selfId = data.id
        drawShape(shapes[selfId], 'beginStroke', 'black', players[selfId].size)
      } else {
        drawShape(shapes[data.id], 'beginFill', 'black', players[data.id].size)
      }
    }
    if (data.opcode == "pos") {
      players[data.id].position = data.position
      players[data.id].v = data.v

      createjs.Tween.get(shapes[data.id], {loop: false})
        .to({
          x: data.position.x,
          y: 512 - data.position.y
        }, 1000 / TICK, createjs.Ease.Linear)

    }
  }
}

const disconnect = () => ws.close()

// const destroy = (x, y) => {
//   for(let i = 0; i < 30; i++) {
//     makeParticle(
//       x, y,
//       utils.random(x-150, x+150),
//       utils.random(y-150, y+150), 12)
//   }
//   this.graphics.clear();
// }

const sendHelds = data => {
  ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify({
    opcode: 'helds',
    data
  }))
}
