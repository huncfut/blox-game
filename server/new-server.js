// Moving, Collisions (./physics.js)
const physics = require('./physics')
const ws = require('ws')
const env = require('./env')

const server = new ws.Server({
  port: env.PORT
})

// Server player manegment
let players = {}
let wsList = {}
let uuid = 0
const generateUUID = () => `${uuid++}`

// Acceleration

console.log(physics.doCollision({
  velocity: {
    x: 1,
    y: 1
  },
  position: {
    x: 0,
    y: 0
  }
}, {
  velocity: {
    x: 0,
    y: 0
  },
  position: {
    x: 1,
    y: 1
  }
}))

// Create new Player

const calcPrePlayer = id => {
  const player = players[id]
  const now = Date.now()
  const dTime = (now - player.lastCalcTime) / 1000
  const prePlayer = new Player(id,
    player.nick,
    player.held,
    now,
    physics.calcPosition(player.acceleration, player.velocity, player.position, dTime),
    physics.calcVelocity(player.acceleration, player.velocity, dTime),
    physics.calcAcceleration(player.held, player.velocity, dTime),
    player.r
  )
  return prePlayer
}

const calcNewPlayer = (id, velocity) => {
  const player = players[id]
  return new Player(id, player.nick, player.held, player.lastCalcTime, player.position,
    velocity,
    { x: 0, y: 0 },
    player.r)
}

const calcVelocityVal = velocity => Math.sqrt(velocity.x**2 + velocity.y**2)

setInterval(() => {
  // if(wsList[0] !== undefined) {
  //   console.log(wsList[0].readyState)
  // }
  let prePlayers = {}
  for(let id in players) {
    prePlayers[id] = calcPrePlayer(id)
  }
  // Collisions
  let newPlayers = {}
  for(let id in prePlayers) {
    let newVelocity = {
      x: 0,
      y: 0
    }
    // Between players
    for(let enemyId in prePlayers) {
      if(id !== enemyId) {
        if(physics.checkCollision(prePlayers[id], prePlayers[enemyId])) {
          newVelocity = physics.addVec(newVelocity, physics.doCollision(prePlayers[id], prePlayers[enemyId]))
        }
      }
    }

    if(JSON.stringify(newVelocity) !== JSON.stringify({ x: 0, y: 0 })) {
      newPlayers[id] = calcNewPlayer(id, newVelocity)
    } else {
      newPlayers[id] = prePlayers[id]
    }


    // prePlayers[id].position.x = (prePlayers[id].position.x > 512) ? 512 : (prePlayers[id].position.x < 0) ? 0 : prePlayers[id].position.x
    // prePlayers[id].position.y = (prePlayers[id].position.y > 512) ? 512 : (prePlayers[id].position.y < 0) ? 0 : prePlayers[id].position.y
  }

  players = newPlayers


}, 1000/env.TICK)

setInterval(() => {
  for(let id in players) {
    broadcast({
      opcode: "pos",
      id: id,
      position: players[id].position,
      v: calcVelocityVal(players[id].velocity)
    })
  }
}, 1000/env.SEND_TICK)

class Player {
  constructor(id, nick, held, time, position, velocity, acceleration, r) {
    this.nick = nick || ""
    this.id = id
    this.r = r || 14
    this.lastCalcTime = time || Date.now()
    this.position = position || {
      x: 0,
      y: 0
    }
    this.velocity = velocity || {
      x: 0,
      y: 0
    }
    this.acceleration = acceleration || {
      x: 0,
      y: 0
    }
    this.held = held || {
      up: false,
      down: false,
      right: false,
      left: false
    }
  }
}



// WS functions
// -----------------------------------
const handlePacket = (uuid, packet) => {
  const { data } = packet
  switch(packet.opcode) {
    case 'helds':
      if(players[uuid]) {
        players[uuid].held = data.held
      } else {
        console.log(`Player ${uuid} sends helds before spawning`)
      }
      break
    case 'spawn':
      // Spawn player
      if(players[uuid]) {
        console.log(`Spawned player ${uuid} sends spawn request`)
        return
      }
      players[uuid] = new Player(uuid, data.nick)
      players[uuid].position = {
        x: ~~(Math.random() * 512),
        y: 200
      }
      // Send existing players
      for(let id in players) {
        send(uuid, {
          opcode: 'spawned',
          position: players[id].position,
          nick: players[id].nick,
          id: players[id].id,
          isMe: uuid == id
        })
      }
      // Send position to other players
      broadcast({
        opcode: "spawned",
        position: players[uuid].position,
        nick: players[uuid].nick,
        id: players[uuid].id,
        isMe: false
      }, uuid)
      break
  }
}

const send = (uuid, data) => wsList[uuid].readyState === ws.OPEN && wsList[uuid].send(JSON.stringify(data))

const broadcast = (data, uuid) => {
  for(let id in players) {
    if(uuid !== id) {
      send(id, data)
    }
  }
}

server.on('connection', ws => {
  ws.on('close', console.log)
  ws.on('error', console.log)
  let uuid = generateUUID()
  wsList[uuid] = ws
  ws.on('message', message => {
    message = message.toString()
    data = JSON.parse(message)
    handlePacket(uuid, data)
  })
})
