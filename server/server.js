// może przepisać !!!
// TDD
//

const WebSocket = require('ws');
const env = require('./env.js');
//const msgpack = require('msgpack-lite');

// const angToLin = (velocity) => {
//   x: Math.sin(velocity.angle)*velocity.val,
//   y: Math.cos(velocity.angle)*velocity.val
// }

const limitedVelocity = (moveAxis) => {
  let vLen = Math.sqrt(moveAxis.x**2 + moveAxis.y**2)
  return {
    x: moveAxis.x / vLen * env.MAX_SPEED,
    y: moveAxis.y / vLen * env.MAX_SPEED
  }
}

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

const send = (id) => {
  if(wsList[id].readyState == 1) {
    wsList[id].send(JSON.stringify({
      opcode: "pos",
      x: players[id].x,
      y: players[id].y,
      v: players[id].v
    }))
  }
}

const broadcast = () => {
  // Ogarnąć wszystko (ws)
}

setInterval(()=>{
  let newPlayers = {}
  for(var id in players) {
    players[id].calcAxis()
  }
  for(var id in players) {
    newPlayers.push(players[id].move())
    // nowe pozycje (obiekty) do newPlayers
    // REFERENCJE
  }
  players = newPlayers
  for(var id in players) {
    if(!players[id].spawned) continue;
    send(id)
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
  constructor(id) {
    this.velocity = {}
    this.mass = 1
    this.id = id
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

  move() {
    console.log(this)
    let newPlayer = JSON.parse(JSON.stringify(this))
    let v = limitedVelocity(newPlayer.moveAxis)
    for (let id in players) {
      if (newPlayer.id != players[id].id) {
        if(newPlayer.distance(players[id]) <= newPlayer.r + players[id].r) {
          console.log('asd')
          resolveCollision(newPlayer, players[id])
          return newPlayer
        }
      }
    }
    newPlayer.x-=nextX;
    newPlayer.y-=nextY;
    if(!newPlayer.isStunned) {
      newPlayer.velocity.x = nextX
      newPlayer.velocity.y = nextY
    }
    newPlayer.x += newPlayer.velocity.x
    newPlayer.y += newPlayer.velocity.y
    newPlayer.velocity.x *= 11/12
    newPlayer.velocity.y *= 11/12
    if(newPlayer.x + newPlayer.r > 512) {
      newPlayer.x = 512 - newPlayer.r
    } else if(newPlayer.x - newPlayer.r < 0) {
      newPlayer.x = 0 + newPlayer.r
    }
    if(newPlayer.y + newPlayer.r > 512) {
      newPlayer.y = 512 - newPlayer.r
    } else if(newPlayer.y - newPlayer.r < 0) {
      newPlayer.y = 0 + newPlayer.r
    }
    return newPlayer
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

let wsList = {}

server.on('connection', ws => {
  ws.on('close', console.log)
  ws.on('error', console.log)
  let uuid = generateUUID();
  wsList[uuid] = ws
  players[uuid] = new Player(uuid);
  ws.on('message', message => {
    message = message.toString();
    data = JSON.parse(message);
    console.log(data)
    players[uuid].handlePacket(data);
  });
});
