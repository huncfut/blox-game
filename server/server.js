const WebSocket = require('ws');
//const msgpack = require('msgpack-lite');

const server = new WebSocket.Server({ port: 8082 });
const MAX_SPEED = 10
const TICK = 20

const GAME_WIDTH = 3840
const GAME_HEIGHT = 2160

let players = {};

class Player {
  constructor(ws) {
    this.ws = ws;
    this.velocity = 0;
    this.moveXAxis = 0;
    this.moveYAxis = 0;
    this.x = 0;
    this.y = 0;
    this.uHeld;
    this.dHeld;
    this.lHeld;
    this.rHeld;
    this.isStunned;
    this.stunTime;
	this.velx = this.vely = 0;
  }
  update() {
    // stun
    if(this.stunTime > 0) {
      this.stunTime -= 1
    }
    this.isStunned = this.stunTime > 0 ? true : false

    // speed
    this.moveXAxis *= (11/12) ** (60/TICK)
    this.moveYAxis *= (11/12) ** (60/TICK)

    if(!this.isStunned) {
      if (this.rHeld === true) {
        this.moveXAxis = Math.min(this.moveXAxis + TICK/6, TICK)
      }
      if (this.lHeld === true) {
        this.moveXAxis = Math.max(this.moveXAxis - TICK/6, -TICK)
      }
      if (this.uHeld === true) {
        this.moveYAxis = Math.min(this.moveYAxis + TICK/6, TICK)
      }
      if (this.dHeld === true) {
        this.moveYAxis = Math.max(this.moveYAxis - TICK/6, -TICK)
      }
    }
    this.move();
	   if(this.ws.readyState==1) {
		this.send({ opcode: 'pos', x: this.x, y: this.y });
	}
  }
  move() {
    if (!this.isStunned) {
		console.log(this.moveXAxis, this.moveYAxis)
		if(this.moveXAxis !== 0) {
			this.x += MAX_SPEED / TICK * Number(Math.cos(Math.atan2(Math.sign(this.moveYAxis), Math.sign(this.moveXAxis))).toFixed(5)) * Math.abs(this.moveXAxis) * 60/TICK
		}
		if(this.moveYAxis !== 0) {
			this.y -= MAX_SPEED / TICK * Number(Math.sin(Math.atan2(Math.sign(this.moveYAxis), Math.sign(this.moveXAxis))).toFixed(5)) * Math.abs(this.moveYAxis) * 60/TICK
		}
    }
  }
  handlePacket(packet) {
    switch(packet.opcode) {
      case "held":
      this.changeHelds(packet);
      break;
      case "spawn":
      this.spawn(packet);
      break;
    }
  }
  changeHelds(helds) {
	  console.log(helds)
    this.dHeld = helds.dHeld
    this.uHeld = helds.uHeld
    this.lHeld = helds.lHeld
    this.rHeld = helds.rHeld
  }
  spawn(data) {
    this.spawned = true;
    this.x = ~~(Math.random()*512);
    this.y = ~~(Math.random()*512);

    this.send({opcode: "spawned", x: this.x, y: this.y})
    //this.send({ opcode: 'pos', x: this.x, y: this.y });
  }
  send(data) {
    this.ws.send(JSON.stringify(data))
  }
}

setInterval(() => {
	for(let i in players) {
		player = players[i]
    if(player.spawned) {
      player.update();
    }
	}
}, 1000/20);

const generateUUID = () => {
  return `${(~~(Math.random()*0xffffff)).toString(16)}-${(~~(Math.random()*0xffffff)).toString(16)}-${(~~(Math.random()*0xffffff)).toString(16)}-${(~~(Math.random()*0xffffff)).toString(16)}`
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
