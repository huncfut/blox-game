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
