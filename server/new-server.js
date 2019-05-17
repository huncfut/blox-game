// Moving, Collisions (./physics.js)
const physics = require('./physics')
const ws = require('ws')
const env = require('./env')

const server = new ws.Server({
  port: env.PORT
})

// Server player manegment
let players = []
let wsList = {}
let uuid = 0
const generateUUID = () => uuid++

// Acceleration



// Create new Player

const calcNewPlayer = id => {
  const player = players[id]
  const newPlayer = new Player(id, player.held, player.r, player.spawned)
  const dTime = (newPlayer.lastCalcTime - player.lastCalcTime) / 1000
  console.log("dTime:", dTime)
  newPlayer.acceleration = physics.calcAcceleration(newPlayer.held, player.velocity, dTime)
  newPlayer.velocity = physics.calcVelocity(newPlayer.acceleration, player.velocity, dTime)
  newPlayer.position = physics.calcPosition(newPlayer.acceleration, newPlayer.velocity, player.position, dTime)
  return newPlayer
}



const calcVelocityVal = velocity => Math.sqrt(velocity.x**2 + velocity.y**2)

setInterval(() => {
  // if(wsList[0] !== undefined) {
  //   console.log(wsList[0].readyState)
  // }
  let newPlayers = []
  for(let id in players) {
    newPlayers.push(calcNewPlayer(id))
  }

  // for(let id in players) {
  //   // Collisions
  // }
  players = newPlayers
  console.log(players)
  for(let id in players) {
    if(!players[id].spawned) continue;
    send(id, {
      opcode: "pos",
      position: players[id].position,
      v: calcVelocityVal(players[id].velocity)
    })
    broadcast(id, {
      opcode: "posO",
      id: id,
      position: players[id].position,
      v: calcVelocityVal(players[id].velocity)
    })
  }
}, 1000/env.TICK)

class Player {
  constructor(id, held, r, spawned) {
    this.nick = ""
    this.id = id
    this.r = (r ? r : 14)
    this.spawned = (spawned ? spawned : false)
    this.lastCalcTime = Date.now()
    this.position = {
      x: 0,
      y: 0
    }
    this.velocity = {
      x: 0,
      y: 0
    }
    this.acceleration = {
      x: 0,
      y: 0
    }
    this.held = (held ? held : {
      up: false,
      down: false,
      right: false,
      left: false
    })
  }
}



// WS functions
// -----------------------------------
const handlePacket = (uuid, packet) => {
  const player = players[uuid]
  const { data } = packet
  switch (packet.opcode) {
    case 'helds':
      player.held = data.held

    case 'spawn':
      if(players[uuid].spawned == true) return
      // Send existing players
      for(let id in players) {
        if(uuid != id && players[id].spawned) {
          send(uuid, {
            opcode: 'spawned0',
            position: players[id].position,
            nick: players[id].nick,
            id: players[id].id
          })
        }
      }
      // Spawn player
      player.nick = data.nick
      player.position.x = ~~(Math.random() * 512)
      player.position.y = ~~(Math.random() * 512)
      player.spawned = true
      // Send position to player
      send(uuid, {
        opcode: 'spawned',
        position: player.position
      })
      // Send position to other players
      broadcast(uuid, {
        opcode: "posO",
        position: player.position,
        id: player.id,
        v: player.v
      })
  }
}

const send = (uuid, data) => {
  if(wsList[uuid].readyState == 1) {
    wsList[uuid].send(JSON.stringify(data))
    return true
  }
  return false
}

const broadcast = (uuid, data) => {
  const player = players[uuid]
  for(let id in players) {
    if(id != uuid) {
      send(id, data)
    }
  }
}

server.on('connection', ws => {
  ws.on('close', console.log)
  ws.on('error', console.log)
  let uuid = generateUUID()
  players[uuid] = new Player(uuid)
  wsList[uuid] = ws
  ws.on('message', message => {
    message = message.toString()
    data = JSON.parse(message)
    handlePacket(uuid, data)
  })
})
