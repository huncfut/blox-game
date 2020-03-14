const physics = require('./physics')
const R = require('ramda')
const env = require('./env')

const checkCollisionsWithBullets = (players, bullets) => {
  return bullets.map(bullet => ([
    bullet,
    Object.values(players).map(player => physics.checkCollision(player, bullet)
      && player.id
    )
  ]))
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
      y + r > env.GAME_HEIGHT && walls.push('N')
      x - r < 0 && walls.push('W')
      y - r < 0 && walls.push('S')
      x + r > env.GAME_WIDTH && walls.push('E')
      return [player.id, walls]
    })
    .filter(t => t[1].length>0)
)

module.exports = {
  checkCollisionsWithBullets,
  checkCollisionsWithPlayers,
  checkCollisionsWithWalls
}
