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

const checkCollisionsWithWalls = entities => (
  Object.values(entities)
    .map(entity => {
      const { position: { x, y }, r } = entity
      var walls = []
      y + r > GAME_HEIGHT && walls.push('N')
      x - r < 0 && walls.push('W')
      y - r < 0 && walls.push('S')
      x + r > GAME_WIDTH && walls.push('E')
      return [(typeof entity.id !== 'undefined') ? entity.id : entity, walls]
    })
    .filter(t => t[1].length>0)
)

const checkCollisionsWithBullets = (players, bullets) => (
  bullets.map(bullet => ([
		Object.values(players)
      .filter(player => physics.checkCollision(player, bullet) && player.id),
		bullet
    ]))
    .filter(t => t[0].length !== 0)
)

const getNewPlayerAfterWallCollision = (player, predPlayers, collisions) => {
  const {
    id, nick, held, lastCalcTime, position, velocity, r
  } = player
  const walls = collisions.filter(t => t[0] === id)[0][1]
  const newVelocity = walls.reduce((v, wall) => {
      const y = (wall === 'N' || wall === 'S') && -v.y*BOUNCE_COEFFICIENT || v.y
      const x = (wall === 'E' || wall === 'W') && -v.x*BOUNCE_COEFFICIENT || v.x
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
    stun: Date.now() + STUN_LENGTH,
    r
  }
}

const getNewPlayerAfterPlayerCollision = (player, predPlayers, collisions) => {
  const {
    id, nick, held, lastCalcTime, position, stun, r
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
    stun: Date.now() + STUN_LENGTH,
    r
  }
}

const getNewPlayerAfterBulletCollision = (player, bullets, collisions) => {
	const {
    id, nick, held, lastCalcTime, position, velocity, r
  } = player
	const newVelocity = collisions.map(t => ([t[0].filter(player => player.id === id), t[1]]))
		.filter(t => t[0].length)
		.reduce((acc, t) => physics.addVec(acc, t[1].velocity), velocity)
	return {
		id,
    nick,
    held,
    lastCalcTime,
    position,
    velocity: newVelocity,
    acceleration: {x:0, y:0},
    stun: Date.now() + STUN_LENGTH,
    r
	}
}
