const WebSocket = require('ws');
const env = require('./env.js');
//const msgpack = require('msgpack-lite');

// const angToLin = (velocity) => {
//   x: Math.sin(velocity.angle)*velocity.val,
//   y: Math.cos(velocity.angle)*velocity.val
// }



function rotate(velocity, angle) {
  const rotatedVelocities = {
    x: velocity.x * Math.cos(angle) - velocity.y * Math.sin(angle),
    y: velocity.x * Math.sin(angle) + velocity.y * Math.cos(angle)
  };

  return rotatedVelocities
}

function resolveCollision(particle, otherParticle) {
  const xVelocityDiff = particle.velocity.x - otherParticle.velocity.x;
  const yVelocityDiff = particle.velocity.y - otherParticle.velocity.y;

  // Grab angle between the two colliding particles
  const angle = -Math.atan2(otherParticle.y - particle.y, otherParticle.x - particle.x);

  // Velocity before equation
  const u1 = rotate(particle.velocity, angle);
  const u2 = rotate(otherParticle.velocity, angle);

  // Velocity after 1d collision equation
  const v1 = { x: u2.x, y: u1.y };
  const v2 = { x: u1.x, y: u2.y };

  // Final velocity after rotating axis back to original location
  const vFinal1 = rotate(v1, -angle);
  const vFinal2 = rotate(v2, -angle);

  // Swap particle velocities for realistic bounce effect
  particle.velocity.x = vFinal1.x;
  particle.velocity.y = vFinal1.y;

  otherParticle.velocity.x = vFinal2.x;
  otherParticle.velocity.y = vFinal2.y;
}

const server = new WebSocket.Server({
  port: env.PORT
})

let players = {}

setInterval(()=>{
  for(var id in players) {
    if(!players[id].spawned) continue;
    players[id].calcAxis()
    players[id].calcV()
    players[id].move()
    players[id].send({
      opcode: "pos",
      x: players[id].x,
      y: players[id].y,
      v: players[id].v
    })
    players[id].boardcast({
      opcode: "posO",
      id: players[id].id,
      x: players[id].x,
      y: players[id].y,
      v: players[id].v
    })
  }
}, 50/3)

class Player {
  constructor(ws, id) {
    this.velocity = {}
    this.mass = 1
    this.id = id;
    this.ws = ws;
    this.r = 14
    this.moveAxis = {
      x: 0,
      y: 0
    }
    this.x = this.y = 0
    this.uHeld = this.dHeld = this.lHeld = this.rHeld = false
  }
  doPlayer({data}) {
    this.uHeld = data.uHeld
    this.dHeld = data.dHeld
    this.lHeld = data.lHeld
    this.rHeld = data.rHeld
  }
  calcV() {
    this.v = Math.sqrt(this.moveAxis.x ** 2 + this.moveAxis.y ** 2)
  }
  calcAxis() {
    this.moveAxis.x *= (11 / 12)
    this.moveAxis.y *= (11 / 12)
    if(this.rHeld === true) {
      this.moveAxis.x = Math.min(this.moveAxis.x + 10, 60)
    }
    if(this.lHeld === true) {
      this.moveAxis.x = Math.max(this.moveAxis.x - 10, -60)
    }
    if(this.uHeld === true) {
      this.moveAxis.y = Math.min(this.moveAxis.y + 10, 60)
    }
    if(this.dHeld === true) {
      this.moveAxis.y = Math.max(this.moveAxis.y - 10, -60)
    }
  }
  distance(player) {
    return Math.sqrt((this.x - player.x)**2 + (this.y - player.y)**2)
  }

  calcVelocity() {
    this.velocity.val = Math.sqrt(this.moveAxis.x ** 2 + this.moveAxis.y ** 2)
  }

  move() {
    let angle = Math.atan2(this.moveAxis.y, this.moveAxis.x)
    let nextX = env.MAX_SPEED / 60 * Number(Math.cos(angle).toFixed(5)) * Math.abs(this.moveAxis.x)
    let nextY = -env.MAX_SPEED / 60 * Number(Math.sin(angle).toFixed(5)) * Math.abs(this.moveAxis.y)
    this.x+=nextX;
    this.y+=nextY;
    for (let id in players) {
      if (this.id != players[id].id) {
        if(this.distance(players[id]) <= this.r + players[id].r) {
          console.log('asd')
          resolveCollision(this, players[id])
          return
        }
      }
    }
    this.x-=nextX;
    this.y-=nextY;
    if(!this.isStunned) {
      this.velocity.x = nextX
      this.velocity.y = nextY
    }
    this.x += this.velocity.x
    this.y += this.velocity.y
    this.velocity.x *= 11/12
    this.velocity.y *= 11/12
    if(this.x + this.r > 512) {
      this.x = 512 - this.r
    } else if(this.x - this.r < 0) {
      this.x = 0 + this.r
    }
    if(this.y + this.r > 512) {
      this.y = 512 - this.r
    } else if(this.y - this.r < 0) {
      this.y = 0 + this.r
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
