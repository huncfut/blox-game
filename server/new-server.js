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



// Create new Player

const calcNewPlayer = id => {
  const player = players[id]
  const newPlayer = new Player(id, player.nick, player.held, player.r)
  const dTime = (newPlayer.lastCalcTime - player.lastCalcTime) / 1000
  newPlayer.position = physics.calcPosition(player.acceleration, player.velocity, player.position, dTime)
  newPlayer.velocity = physics.calcVelocity(player.acceleration, player.velocity, dTime)
  newPlayer.acceleration = physics.calcAcceleration(player.held, player.velocity, dTime)
  return newPlayer
}



const calcVelocityVal = velocity => Math.sqrt(velocity.x**2 + velocity.y**2)

setInterval(() => {
  // if(wsList[0] !== undefined) {
  //   console.log(wsList[0].readyState)
  // }
  let newPlayers = {}
  for(let id in players) {
    newPlayers[id] = calcNewPlayer(id)
  }
  console.log(players)
  // for(let id in players) {
  //   // Collisions
  // }
  players = newPlayers

  for(let id in players) {
    broadcast({
      opcode: "pos",
      id: id,
      position: players[id].position,
      v: calcVelocityVal(players[id].velocity)
    })
  }
}, 1000/env.TICK)

class Player {
  constructor(id, nick, held, r) {
    this.nick = (nick ? nick : "")
    this.id = id
    this.r = (r ? r : 14)
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
        y: ~~(Math.random() * 512)
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

const send = (uuid, data) => {
  if(wsList[uuid].readyState == 1) {
    wsList[uuid].send(JSON.stringify(data))
    return true
  }
  return false
}

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
