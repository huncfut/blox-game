var players = {}, newPlayers = {}, shapes = {}, stage, ws, myId, fireHeld = false, bullets = []

const drawShape = (shape, type, color, size) => {
  shape.graphics[type](color).drawRect(shape.x, shape.y, size, size)
  shape.regX = shape.regY = size / 2
  stage.addChild(shape)
}

const calcNewPlayer = player => {
  const {
    id, nick, lastCalcTime, position, velocity, acceleration, bulletCD, stun, r
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
    bulletCD,
    stun,
    r,
  } || {
    id,
    nick,
    lastCalcTime: now,
    position: physics.calcPosition(acceleration, velocity, position, dTime),
    velocity: physics.calcVelocity(acceleration, velocity, dTime),
    acceleration: physics.calcAcceleration(held, velocity, dTime, (stun > now)),
    bulletCD,
    stun,
    r,
  }
}

const checkCollisionsWithPlayers = players => {
  var collisions = []
  for(let id in players) {
    for(let enemyId in players) {
      (id !== enemyId)
      && physics.checkCollision(players[id], players[enemyId])
      && collisions.push([id, enemyId])
    }
  }
  return collisions
}

const checkCollisionsWithWalls = players => (
  Object.values(players)
    .map(player => {
      const { position: { x, y }, r } = player
      var walls = []
      y + r > 512 && walls.push('N')
      x - r < 0 && walls.push('W')
      y - r < 0 && walls.push('S')
      x + r > 512 && walls.push('E')
      return [player.id, walls]
    })
    .filter(t => t[1].length>0)
)

const getCollisionWithPlayers = collisionsWithPlayers => {
  return new Set(collisionsWithPlayers.map(t => t[0]))
}

const getCollisionWithWalls = collisionsWithWalls => {
  return new Set(collisionsWithWalls.map(t => t[0]))
}

const getNewPlayerAfterWallCollision = (player, newPlayers, collisions) => {
  const {
    id, nick, held, lastCalcTime, position, velocity, bulletCD, stun, r
  } = player
  const walls = collisions.filter(t => t[0] === id)[0][1]

  const newVelocity = walls.reduce(
    (v, wall) => {
      const y = (wall === 'N' || wall === 'S') && -v.y*2/3 || v.y
      const x = (wall === 'E' || wall === 'W') && -v.x*2/3 || v.x
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
    stun: Date.now() + STUN_LENGTH,
    r
  }
}

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
    stun: Date.now() + STUN_LENGTH,
    r
  }
}

const clientSidePrediction = () => {
	console.log("siema")
	const newPlayers = R.mapObjIndexed(
		player => calcNewPlayer(player),
		players
	)

	const collisionsWithPlayers = checkCollisionsWithPlayers(newPlayers)
	const collisionsWithWalls = checkCollisionsWithWalls(newPlayers)
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

	// Update shapes
	for(id in shapes) {
		const vecDist = physics.subVec(players[id].position, {x: shapes[id].x, y: shapes[id].y})
		shapes[id].rotation = shapes[id].rotation + 2 + physics.vecLen(players[id].velocity)/35 || 0
		//If distance between shape and actual position is 2 times greater than actual velocity
		//and greater than maximum speed
		if((physics.scalMultVec(vecDist, .5) > players[id].velocity) && (physics.vecLen(vecDist) > 0)) {
			createjs.Tween.get(shapes[data.id], {loop: false})
			.to({
				x: player[id].position.x,
				y: 512 - player[id].position.y
			}, 1000 / (TICK/3), createjs.Ease.Linear)
		} else {
			shapes[id].x = players[id].position.x
			shapes[id].y = players[id].position.y
		}
	}
}

const directServerDisplaying = () => {
	console.log("ELo")
	for(id in shapes) {
		shapes[id].rotation = shapes[id].rotation + 2 + physics.vecLen(players[id].velocity)/35 || 0
		shapes[id].x = players[id].position.x
		shapes[id].y = players[id].position.y
	}
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
        console.log(data)
        shapes[data.id] = new createjs.Shape()
        players[data.id] = newPlayer(data.id, data.nick, Date.now(), data.position)
        if(data.isMe) {
          myId = data.id
          drawShape(shapes[myId], 'beginStroke', 'black', 28)
        } else {
          drawShape(shapes[data.id], 'beginFill', 'black', 28)
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
      if(data.opcode === "newBullets") {
        bullets.filter(bullet => bullet)
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
