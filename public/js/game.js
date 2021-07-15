var players = {}, predPlayers = {}, pShapes = {}, bShapes = [], stage, ws, myId, bullets = [], predBullets = []

const drawPlayer = (shape, type, color, size) => {
  shape.graphics[type](color).drawRect(shape.x, shape.y, size, size)
  shape.regX = shape.regY = size / 2
  stage.addChild(shape)
}

const drawBullet = (shape, type, color, size) => {
	shape.graphics[type](color).drawCircle(shape.x, shape.y, size)
	stage.addChild(shape)
}

const newBulletShape = () => {
	const shape = new createjs.Shape()
	drawBullet(shape, "beginFill", 'black', 6)
	return shape
}

const calcNewPlayer = player => {
  const {
    id, nick, lastCalcTime, position, velocity, acceleration, stun, r
  } = player
  const now = Date.now()
  const dTime = (now - lastCalcTime) / 1000
  return (id !== myId) && {
    id,
    nick,
    lastCalcTime: now,
    position: physics.calcPosition(acceleration, velocity, position, dTime),
    velocity: physics.calcVelocity(acceleration, velocity, dTime),
    acceleration,
    stun,
    r,
  } || {
    id,
    nick,
    lastCalcTime: now,
    position: physics.calcPosition(acceleration, velocity, position, dTime),
    velocity: physics.calcVelocity(acceleration, velocity, dTime),
    acceleration: physics.calcAcceleration(held, velocity, dTime, (stun > now)),
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

// CLIENT SIDE PREDICTION
// ---- OBSOLETE ----
const clientSidePrediction = () => {
	const predPlayers = R.mapObjIndexed(
		player => calcNewPlayer(player),
		players
	)

	const predBullets = bullets.map(bullet => moveBullet(bullet))

	// Get collisions
	const collisionsWithPlayers = checkCollisionsWithPlayers(predPlayers)
	const collisionsWithWalls = checkCollisionsWithWalls(predPlayers)
	const collisionsWithBullets = checkCollisionsWithBullets(predPlayers, predBullets)
	const bulletCollisionsWithWalls = checkCollisionsWithWalls(predBullets)

	// Create sets
	const inCollisionWithPlayers = new Set(collisionsWithPlayers.map(t => t[0]))
	const inCollisionWithWalls = new Set(collisionsWithWalls.map(t => t[0]))
	const inCollisionWithBullets = new Set(collisionsWithBullets.flatMap(t => t[0]).map(({ id }) => id))

	// Set up bullets to remove
	const bulletsInCollisionWithPlayers = new Set(collisionsWithBullets.map(t => t[1]))
	const bulletsInCollisionWithWalls = new Set(bulletCollisionsWithWalls.map(t => t[0]))
	const bulletsToRemove = new Set([...bulletsInCollisionWithWalls, ...bulletsInCollisionWithPlayers])

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
					&& getNewPlayerAfterBulletCollision(player, predBullets, collisionsWithBullets)
					|| player
				), predPlayers)))

	bullets = predBullets.filter(bullet => !bulletsToRemove.has(bullet))

	// Update pShapes
	for(id in pShapes) {
		const vecDist = physics.subVec(players[id].position, {x: pShapes[id].x, y: pShapes[id].y})
		pShapes[id].rotation = pShapes[id].rotation + 2 + physics.vecLen(players[id].velocity)/35 || 0
		//If distance between shape and actual position is 2 times greater than actual velocity
		//and greater than maximum speed
		// if((physics.scalMultVec(vecDist, .5) > players[id].velocity) && (physics.vecLen(vecDist) > 0)) {
		// 	createjs.Tween.get(pShapes[data.id], {loop: false})
		// 	.to({
		// 		x: player[id].position.x,
		// 		y: 512 - player[id].position.y
		// 	}, 1000 / (TICK/3), createjs.Ease.Linear)
		// } else {
		// 	pShapes[id].x = players[id].position.x
		// 	pShapes[id].y = players[id].position.y
		// }
		if(pShapes[id].x) {
      console.log(data)
			createjs.Tween.get(pShapes[id], {loop: false})
			.to({
				x: players[id].position.x,
				y: players[id].position.y
			}, 1000 / (TICK), createjs.Ease.Linear)
		} else {
			pShapes[id].x = players[id].position.x
			pShapes[id].y = players[id].position.y
		}
	}
	bullets.forEach((bullet, i) => {
		bShapes[i] = bShapes[i] ? bShapes[i] : newBulletShape()
		bShapes[i].x && utils.bulletParticles(bullet.position, {x: bShapes[i].x, y: bShapes[i].y})
		bShapes[i].x = bullet.position.x
		bShapes[i].y = bullet.position.y
	})
	bShapes = bShapes.filter((shape, i) => {
		if(i >= bullets.length) {
			stage.removeChild(shape)
			return 0
		}
		return 1
	})
}

// DIRECT SERVER DISPLAYING

const directServerDisplaying = () => {
	for(id in pShapes) {
		pShapes[id].rotation = pShapes[id].rotation + 2 + physics.vecLen(players[id].velocity)/35 || 0
		pShapes[id].x = players[id].position.x
		pShapes[id].y = players[id].position.y
	}
	// bullets.forEach((bullet, i) => {
	// 	bShapes[i] = bShapes[i] ? bShapes[i] : newBulletShape()
	// 	bShapes[i].x && utils.bulletParticles(bullet.position, {x: bShapes[i].x, y: bShapes[i].y})
	// 	bShapes[i].x = bullet.position.x
	// 	bShapes[i].y = bullet.position.y
	// })
	bShapes = bShapes.filter((shape, i) => {
		if(i >= bullets.length) {
			stage.removeChild(shape)
			return 0
		}
		return 1
	})
}

const onTick = () => {
  if(ws) {
    players[myId] && sendHelds({ held })
		const render = DIRECT_SERVER_DISPLAYING && directServerDisplaying || clientSidePrediction
		render()
  }
  stage.update()
}

const connect = () => {
  if(ws) return
  wsTMP = new WebSocket(`ws://${IP}:${PORT}`)
  wsTMP.onopen = () => {
    wsTMP.send(JSON.stringify({
      opcode: 'spawn',
      data: {
        nick: "xd"
      }
    }))
    ws = wsTMP

    ws.onmessage = event => {
      data = JSON.parse(event.data)
      if(data.opcode === "spawned") {
        pShapes[data.id] = new createjs.Shape()
        players[data.id] = newPlayer(data.id, data.nick, Date.now(), data.position)
        if(data.isMe) {
          myId = data.id
          drawPlayer(pShapes[myId], 'beginStroke', 'black', 28)
        } else {
          drawPlayer(pShapes[data.id], 'beginFill', 'black', 28)
        }
      }
      if (data.opcode === "player") {
        players[data.id].position = data.position
        players[data.id].velocity = data.velocity
        players[data.id].acceleration = data.acceleration
      }
      if(data.opcode === "newBullets") {
        bullets.push(...data.newBullets)
      }
      if(data.opcode === "bullets") {
        bullets = data.bullets
      }
    }
  }
}

const sendHelds = data => {
  ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify({
    opcode: 'helds',
    data
  }))
}

const disconnect = () => ws.close()
