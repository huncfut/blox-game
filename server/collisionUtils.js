const physics = require('./physics')
const R = require('ramda')
const env = require('./env')

const checkCollisionWithPlayers = players => {
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

const checkCollisionWithWalls = players => {
  // const result =  players ? R.R.map(
  //   (table, player) => {
  //     const { position: { x, y } } = player
  //     const walls = []
  //     y > env.GAME_HEIGHT && walls.push('N')
  //     x < 0 && walls.push('W')
  //     y < 0 && walls.push('S')
  //     x > env.GAME_WIDTH && walls.push('E')
  //     return walls;
  //   }
  //   , players
  // ) : [];
  // console.log("Collisions", result, "Players", players);
  // return result;s
  return Object.values(players)
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
}

module.exports = {
  checkCollisionWithPlayers,
  checkCollisionWithWalls
}
