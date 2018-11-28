const WebSocket = require('ws');
const env = require('./env.js');
//const msgpack = require('msgpack-lite');

const server = new WebSocket.Server({
  port: env.PORT
})

let players = {}

class Player {
  constructor(ws, id) {
    this.id = id;
    this.ws = ws;
    this.moveXAxis = this.moveYAxis = 0
    this.x = this.y = 0
    this.uHeld = this.dHeld = this.lHeld = this.rHeld = false
  }
  doPlayer(data) {
    this.uHeld = data.uHeld
    this.dHeld = data.dHeld
    this.lHeld = data.lHeld
    this.rHeld = data.rHeld
    calcAxis()
    move()
    this.send({
      opcode: "pos",
      x: this.x,
      y: this.y
    })
    this.boardcast({
      opcode: "posO",
      id: this.id,
      x: this.x,
      y: this.y,
      xAxis: this.moveXAxis,
      yAxis: this.moveYAxis
    })
  }
  calcAxis() {
    this.moveXAxis *= (11 / 12)
    this.moveYAxis *= (11 / 12)
    if(this.rHeld === true) {
      this.moveXAxis = Math.min(this.moveXAxis + 10, 60)
    }
    if(this.lHeld === true) {
      this.moveXAxis = Math.max(this.moveXAxis - 10, -60)
    }
    if(this.uHeld === true) {
      this.moveYAxis = Math.min(this.moveYAxis + 10, 60)
    }
    if(this.dHeld === true) {
      this.moveYAxis = Math.max(this.moveYAxis - 10, -60)
    }
  }
  move() {
    let angle = Math.atan2(this.moveYAxis, this.moveXAxis)
    if (axis.xAxis !== 0) {
      this.x += env.MAX_SPEED / 60 * Number(Math.cos(angle).toFixed(5)) * Math.abs(this.moveXAxis)
    }
    if (axis.yAxis !== 0) {
      this.y -= env.MAX_SPEED / 60 * Number(Math.sin(angle).toFixed(5)) * Math.abs(this.moveYAxis)
    }
  }
  boardcast(data) {
    for (let id in players) {
      if (this.id != players[id].id) {
        players[id].send(data)
      }
    }
  }
  handlePacket(packet) {
    switch (packet.opcode) {
      case "helds":
        this.doPlayer(packet)
        break
      case "spawn":
        this.spawn(packet)
        break
    }
  }
  spawn(data) {
	if(this.spawned) return;
    for (var id in players) {
      if (this.id != id && players[id].spawned) {
        this.send({
          opcode: "spawnedO",
          x: players[id].x,
          y: players[id].y,
          nick: players[id].nick,
          id: players[id].id
        })
      }
    }
    this.nick = data.nick;
    this.spawned = true;
    this.x = ~~(Math.random() * 512)
    this.y = ~~(Math.random() * 512)
    this.send({
      opcode: "spawned",
      x: this.x,
      y: this.y
    })
    this.boardcast({
      opcode: "spawnedO",
      x: this.x,
      y: this.y,
      nick: this.nick,
      id: this.id
    })
  }
  send(data) {
    if (this.ws.readyState == 1) {
      this.ws.send(JSON.stringify(data))
    }
  }
}

// const fireShot = (x, y, target) => {
//   shot = {x, y}
//   distance = utils.distance(shot, target);
//   velocity = 100
//   [x1, x2] = utils.pointOnLine(shot, target, );
//   time = distance / velocity
//   shot.rotation = Math.atan2(target.y - y, target.x - x) * 180 / Math.PI
//   createjs.Tween.get(shot, {
//       loop: false
//     })
//     .to({
//       x: target.x,
//       y: target.y
//     }, time)
//   return shot
// }

/*setInterval(() => {
  for (let i in players) {
    player = players[i]
    if (player.spawned) {
      player.update()
    }
  }
}, 1000 / env.TICK);*/

let uuid = 0;

const generateUUID = () => {
  return uuid++;
}

server.on('connection', ws => {
  ws.on('close', console.log)
  ws.on('error', console.log)
  let uuid = generateUUID();
  players[uuid] = new Player(ws, uuid);
  ws.on('message', message => {
    message = message.toString();
    data = JSON.parse(message);
    players[uuid].handlePacket(data);
  });
});
