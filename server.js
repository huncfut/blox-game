// Moving, Collisions (./physics.js)
// wall collision
const express = require('express')
const app = express()
const physics = require('./physics')
const ws = require('ws')
const env = require('./env')
const collisionUtils = require('./collisionUtils')
const R = require('ramda')
const combatUtils = require('./combatUtils')

// HTTP Server
app.use('/', express.static('public'))
app.listen(env.HTTP_PORT, () => console.log(`HTTP Server started on port ${env.HTTP_PORT}`))

// WS Server
const wss = new ws.Server({
  port: env.PORT
})

// Server player manegment
let players = {}
let wsList = {}
let bullets = {}
let uuid = 0
const generateUUID = () => `${uuid++}`

// Create new Player

const calcNewPlayer = player => {
  const {
    id, nick, lastCalcTime, held, position, velocity, acceleration, bulletCD, stun, r
  } = player
  const now = Date.now()
  const dTime = (now - lastCalcTime) / 1000
  return {
    id,
    nick,
    held,
    lastCalcTime: now,
    position: physics.calcPosition(acceleration, velocity, position, dTime),
    velocity: physics.calcVelocity(acceleration, velocity, dTime),
    acceleration: physics.calcAcceleration(held, velocity, dTime, (stun > now)),
    bulletCD,
    stun,
    r,
  }
}

const getCollisionWithPlayers = collisionsWithPlayers => {
  return new Set(collisionsWithPlayers.map(t => t[0]))
}

const getCollisionWithWalls = collisionsWithWalls => {
  return new Set(collisionsWithWalls.map(t => t[0]))
}

const getNewPlayerAfterWallCollision = (player, predPlayers, collisions) => {
  const {
    id, nick, held, lastCalcTime, position, velocity, bulletCD, r
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
    bulletCD,
    stun: Date.now() + env.STUN_LENGTH,
    r
  }
}

const checkId = object => Object.keys(object).every(id => id === object[id].id)

const getNewPlayerAfterPlayerCollision = (player, predPlayers, collisions) => {
  const {
    id, nick, held, lastCalcTime, position, bulletCD, stun, r
  } = player
  const velocity = collisions.filter(t => t[0] === id)
    .map(t => physics.doCollision(predPlayers[t[0]], predPlayers[t[1]]))
    .reduce(physics.addVec)

  return {
    id,
    nick,
    held,
    lastCalcTime,
    position,
    velocity,
    acceleration: {x:0, y:0},
    bulletCD,
    stun: Date.now() + env.STUN_LENGTH,
    r
  }
}

const getNewPlayerAfterShot = player => {
  const {
    id, nick, held, lastCalcTime, position, velocity, acceleration, stun, r
  } = player
  return {
    id, nick, held, lastCalcTime, position, velocity, acceleration,
    bulletCD: Date.now() + env.BULLETCD,
    stun, r
  }
}


setInterval(() => {
  checkId(players) || console.log("Wrong id in players: ", players) && error.error.adfsdsfas.asads

  const predPlayers = R.mapObjIndexed(
    player => calcNewPlayer(player),
    players
  )

  checkId(predPlayers) || console.log("Wrong id in predPlayers", predPlayers) && error.error.eradasdsadsdsa.asd

  // Collisions
  const collisionsWithPlayers = collisionUtils.checkCollisionsWithPlayers(predPlayers)
  const collisionsWithWalls = collisionUtils.checkCollisionsWithWalls(predPlayers)
  const inCollisionWithPlayers = getCollisionWithPlayers(collisionsWithPlayers)
  const inCollisionWithWalls = getCollisionWithWalls(collisionsWithWalls)



  const movedPlayers = R.mapObjIndexed(
    (player, id) => inCollisionWithPlayers.has(id)
      && getNewPlayerAfterPlayerCollision(players[id], predPlayers, collisionsWithPlayers)
      || player,
    R.mapObjIndexed(
      (player, id) => inCollisionWithWalls.has(player.id)
        && getNewPlayerAfterWallCollision(players[player.id], predPlayers, collisionsWithWalls)
        || player,
      predPlayers
    )
  )



  // Combat
  // Move bullets

  // Add new bullets
  const newBullets = Object.keys(movedPlayers)
    .filter(id => (
      movedPlayers[id].held.bullet
      && combatUtils.createBullet(movedPlayers, id)
    ))

  // Change players that fired a bullet
  // const playersThatFiredABullet = new Set(newBullets.map(bullet => bullet.playerId))

  // Check collision with bullets

  // Remove bullets

  // Override bullets for next tick

}, 1000/env.TICK)

setInterval(() => {
  R.mapObjIndexed((player, id) => {
    broadcast({
      opcode: "player",
      id: id,
      position: player.position,
      velocity: player.velocity,
      acceleration: player.acceleration
    })
    send(id, {
      opcode: "bullets",
      bullets
    })
  }, players
  )

}, 1000/env.SEND_TICK)

const newPlayer = (id, nick, held, time, position, velocity, acceleration, r) => ({
  id: id,
  nick: nick || "",
  r: r || 16,
  lastCalcTime: time || Date.now(),
  position: position || {
    x: 0,
    y: 0
  },
  velocity: velocity || {
    x: 0,
    y: 0
  },
  acceleration: acceleration || {
    x: 0,
    y: 0
  },
  bulletCD: 0,
  stun: 0,
  held: held || {
    up: false,
    down: false,
    right: false,
    left: false,
    bullet: false,
    laser: false
  }
})

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
      players[uuid] = newPlayer(uuid, data.nick)
      players[uuid].position = {
        x: ~~(Math.random() * 496) + 8,
        y: ~~(Math.random() * 496) + 8
      }

      // Send existing players
      R.mapObjIndexed((player, id) => send(uuid, {
        opcode: 'spawned',
        position: player.position,
        nick: player.nick,
        id: player.id,
        isMe: uuid == id
      }), players)

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

const broadcast = (data, uuid) => R.mapObjIndexed((player, id) => uuid !== id && send(id, data), players)

const sendAll = (data) => R.mapObjIndexed((player, id) => send(id, data), players)

wss.on('connection', ws => {
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
