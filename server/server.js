// Moving, Collisions (./physics.js)
// wall collision
//
const express = require('express')
const app = express()
const physics = require('./physics')
const ws = require('ws')
const env = require('./env')
const collisionUtils = require('./collisionUtils')
const R = require('ramda')

// HTTP Server
app.use('/', express.static('public'))
app.listen(env.HTTP_PORT, () => console.log(`HTTP Server started on port ${env.HTTP_PORT}`))

// WS Serverc
const server = new ws.Server({
  port: env.PORT
})

// Server player manegment
let players = {}
let wsList = {}
let uuid = 0
const generateUUID = () => `${uuid++}`

// Create new Player

const calcNewPlayer = player => {
  const {
    id, nick, lastCalcTime, held, position, velocity, acceleration, r
  } = player
  const now = Date.now()
  const dTime = (now - lastCalcTime) / 1000
  const newPlayer = {
    id,
    nick,
    held,
    lastCalcTime: now,
    position: physics.calcPosition(acceleration, velocity, position, dTime),
    velocity: physics.calcVelocity(acceleration, velocity, dTime),
    acceleration: physics.calcAcceleration(held, velocity, dTime),
    r,
  }
  return newPlayer;
}

const getCollisionWithPlayers = players => new Set(collisionUtils.checkCollisionWithPlayers(players).map(t => t[0]))

const getCollisionWithWalls = players => {
  return new Set(collisionUtils.checkCollisionWithWalls(players).map(t => t[0]))
}

const getNewPlayerAfterWallCollision = (player, newPlayers, collisions) => {
  const {
    id, nick, held, lastCalcTime, position, velocity, r
  } = player
  const walls = collisions.filter(t => t[0] === id)[0][1]

  const newVelocity = walls.reduce(
    (v, wall) => {
      const y = (wall === 'N' || wall === 'S') && -v.y*env.BOUNCE_COEFFICIENT || v.y
      const x = (wall === 'E' || wall === 'W') && -v.x*env.BOUNCE_COEFFICIENT || v.x
      return {
        x,
        y
      }
    },
    velocity
  )
  return {
    id,
    nick,
    held,
    lastCalcTime,
    position,
    velocity: newVelocity,
    acceleration: {x:0, y:0},
    r
  }
}

const checkId = players => {
  return Object.keys(players)
    .map(id => id === players[id].id)
    .reduce((a, b) => (a && b), true)
}

const getNewPlayerAfterPlayerCollision = (player, newPlayers, collisions) => {
  const {
    id, nick, held, lastCalcTime, position, r
  } = player
  const velocity = collisions.filter(t => t[0] === id)
    .map(t => physics.doCollision(newPlayers[t[0]], newPlayers[t[1]]))
    .reduce(physics.addVec)

  return {
    id,
    nick,
    held,
    lastCalcTime,
    position,
    velocity,
    acceleration: {x:0, y:0},
    r
  }
}


setInterval(() => {
  checkId(players) || console.log("Wrong id in players", players) && error.error.adfsdsfas.asads

  const newPlayers = R.mapObjIndexed(
    player => calcNewPlayer(player),
    players
  )

  checkId(newPlayers) || console.log("Wrong id in newPlayers", newPlayers) && error.error.eradasdsadsdsa.asd

  // Collisions
  const collisionsWithPlayers = collisionUtils.checkCollisionWithPlayers(newPlayers)
  const collisionsWithWalls = collisionUtils.checkCollisionWithWalls(newPlayers)
  const inCollisionWithPlayers = getCollisionWithPlayers(newPlayers)
  const inCollisionWithWalls = getCollisionWithWalls(newPlayers)



  players = R.mapObjIndexed(
    (player, id) => inCollisionWithPlayers.has(id)
      && getNewPlayerAfterPlayerCollision(players[id], newPlayers, collisionsWithPlayers)
      || player,
    R.mapObjIndexed(
      (player, id) => inCollisionWithWalls.has(player.id)
        && getNewPlayerAfterWallCollision(players[player.id], newPlayers, collisionsWithWalls)
        || player,
      newPlayers
    )
  )



  // Object.values(newPlayers)
  //   .map(player => inCollisionWithPlayers.has(player.id)
  //     && getNewPlayerAfterPlayerCollision(players[player.id], newPlayers, collisionsWithPlayers)
  //     || player)
  //   .map(player => inCollisionWithWalls.has(player.id)
  //     && getNewPlayerAfterWallCollision(players[player.id], newPlayers, collisionsWithWalls)
  //     || player)
  // console.log("after", players)


  // players = Object.values(players)
  //   .map(player => player.held.arrow && createArrow(player) )
}, 1000/env.TICK)

setInterval(() => {
  for(let id in players) {
    broadcast({
      opcode: "pos",
      id: id,
      position: players[id].position,
      v: physics.vecLen(players[id].velocity)
    })
  }
}, 1000/env.SEND_TICK)

class Player {
  constructor(id, nick, held, time, position, velocity, acceleration, r) {
    this.nick = nick || ""
    this.id = id
    this.r = r || 16
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
      left: false,
      arrow: false,
      laser: false
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


// USUWANIE WS
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
