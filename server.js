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
let bullets = []
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

const getNewPlayerAfterWallCollision = (player, newPlayers, collisions) => {
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

const checkId = players => Object.keys(players)
  .map(id => id === players[id].id)
  .reduce((a, b) => (a && b), true)

const getNewPlayerAfterPlayerCollision = (player, newPlayers, collisions) => {
  const {
    id, nick, held, lastCalcTime, position, bulletCD, stun, r
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

  const newPlayers = R.mapObjIndexed(
    player => calcNewPlayer(player),
    players
  )

  checkId(newPlayers) || console.log("Wrong id in newPlayers", newPlayers) && error.error.eradasdsadsdsa.asd

  // Collisions
  const collisionsWithPlayers = collisionUtils.checkCollisionsWithPlayers(newPlayers)
  const collisionsWithWalls = collisionUtils.checkCollisionsWithWalls(newPlayers)
  const inCollisionWithPlayers = getCollisionWithPlayers(collisionsWithPlayers)
  const inCollisionWithWalls = getCollisionWithWalls(collisionsWithWalls)



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



  // Combat
  let newBullets = []

  players = R.mapObjIndexed((player, id) => {
    return player.held.bullet
    && (player.bulletCD < Date.now())
    && newBullets.push(combatUtils.createBullet(players, id))
    && getNewPlayerAfterShot(player)
    || player
  }, players)

  sendAll({ opcode: "newBullets", newBullets })

  bullets.push(...newBullets)

  console.log("________________")
  console.log(bullets)
  console.log("----")
  console.log(players)
  console.log("________________")

  const collisionsWithBullets = collisionUtils.checkCollisionsWithBullets(players, bullets)
  console.log(collisionsWithBullets)
  const bulletsToRemove = new Set(collisionsWithBullets.map(t => (
    t[1] !== []
      && t[0]
      || {}
  )))

  sendAll({ opcode: "bulletsToRemove", bulletsToRemove })

  console.log(bulletsToRemove)
  const playersToStun = new Set(collisionsWithBullets.map(t => t[1])
    .reduce((prev, curr) => prev.concat(curr), []))

  // players = R.mapObjIndexed(
  //   (player, id) => playersToStun.has(id)
  //     // && player.stun // DO STUUN
  // )



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
