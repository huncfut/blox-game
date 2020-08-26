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

const moveBullet = bullet => {
	const {
		playerId, lastCalcTime, position, velocity, r
	} = bullet
	const now = Date.now()
	const dTime = (now - lastCalcTime) / 1000
	return {
		playerId,
		lastCalcTime: now,
		position: physics.calcPosition({x:0, y:0}, velocity, position, dTime),
		velocity,
		r
	}
}

const getNewPlayerAfterBulletCollision = (player, bullets, collisions) => {
	const {
    id, nick, held, lastCalcTime, position, velocity, bulletCD, r
  } = player
	const newVelocity = collisions.filter(t => t[0].reduce((acc, p) => acc || p.id === id))
		.reduce(physics.addVec(v, bullet.velocity), velocity)
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

const getNewPlayerAfterWallCollision = (player, predPlayers, collisions) => {
  const {
    id, nick, held, lastCalcTime, position, velocity, bulletCD, r
  } = player
  const walls = collisions.filter(t => t[0] === id)[0][1]
  const newVelocity = walls.reduce((v, wall) => {
      const y = (wall === 'N' || wall === 'S') && -v.y*env.BOUNCE_COEFFICIENT || v.y
      const x = (wall === 'E' || wall === 'W') && -v.x*env.BOUNCE_COEFFICIENT || v.x
      return { x, y }
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

const getNewPlayerAfterPlayerCollision = (player, predPlayers, collisions) => {
  const {
    id, nick, held, lastCalcTime, position, bulletCD, stun, r
  } = player
  const newVelocity = collisions.filter(t => t[0] === id)
    .map(t => physics.doCollision(predPlayers[t[0]], predPlayers[t[1]]))
    .reduce(physics.addVec)
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

const getNewPlayerAfterShot = player => {
  const {
    id, nick, held, lastCalcTime, position, velocity, acceleration, stun, r
  } = player
	return {
    id, nick, held, lastCalcTime, position, velocity, acceleration,
    bulletCD: Date.now() + env.BULLET_CD,
    stun, r
  }
}


setInterval(() => {

  checkId(players) || console.log("Wrong id in players: ", players) && error.error.adfsdsfas.asads

  const predPlayers = R.mapObjIndexed(
    player => calcNewPlayer(player),
    players)

  checkId(predPlayers) || console.log("Wrong id in predPlayers", predPlayers) && error.error.eradasdsadsdsa.asd

  // Collisions

  // Combat
  // Move bullets
	const predBullets = bullets.map(bullet => moveBullet(bullet))

  // Create new bullets
  const newBullets = Object.keys(predPlayers)
		.map(id => (
			predPlayers[id].held.bullet
				&& predPlayers[id].bulletCD <= Date.now()
				&& predPlayers[id].stun <= Date.now()
		    && combatUtils.createBullet(predPlayers, id)
		))
		.filter(bullet => bullet)


  // Merge bullets
  const allBullets = [...predBullets, ...newBullets]



  // Stun players shot

  // Remove bullets

	// Check collisions
	const collisionsWithBullets = collisionUtils.checkCollisionsWithBullets(predPlayers, allBullets)
	const collisionsWithPlayers = collisionUtils.checkCollisionsWithPlayers(predPlayers)
	const collisionsWithWalls = collisionUtils.checkCollisionsWithWalls(predPlayers)

	// Create sets for players
	const inCollisionWithBullets = new Set(collisionsWithBullets.flatMap(t => t[0]))
	const inCollisionWithPlayers = new Set(collisionsWithPlayers.map(t => t[0]))
	const inCollisionWithWalls = new Set(collisionsWithWalls.map(t => t[0]))
	const playersThatFiredABullet = new Set(newBullets.map(bullet => bullet.playerId))

	// Get bullets in Collision set
	const bulletsInCollision = new Set(collisionsWithBullets.map(t => t[1]))

	// Update players
  players = R.mapObjIndexed(
		// Collisions with players (last)
    (player, id) => (inCollisionWithPlayers.has(id)
      && getNewPlayerAfterPlayerCollision(players[id], predPlayers, collisionsWithPlayers)
      || player
		), R.mapObjIndexed(
			// Collisions with walls
      (player, id) => (inCollisionWithWalls.has(id)
        && getNewPlayerAfterWallCollision(players[player.id], predPlayers, collisionsWithWalls)
        || player
			), R.mapObjIndexed(
				// Collisions with bullets
				(player, id) => (inCollisionWithBullets.has(id)
					&& getNewPlayerAfterBulletCollision(player, allBullets, collisionsWithBullets)
					|| player
				), R.mapObjIndexed(
					// Update players bullet cooldown
					(player, id) => (playersThatFiredABullet.has(id)
						&& getNewPlayerAfterShot(player)
						|| player
					), predPlayers))))



	// Update and override bullets for next tick
	bullets = allBullets.filter(bullet => !bulletsInCollision.has(bullet))
	console.log(bullets)




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
  }, players)
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
