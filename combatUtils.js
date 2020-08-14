const physics = require('./physics')
const R = require('ramda')
let bulletId = 0

const getBulletId = `${bulletId++}`

const createBullet = (players, id) => {
  const bulletSpeed = 100
  let target = Object.values(players)
    .filter(player => player.id !== id)
    .map(player => ({id: player.id, d: physics.vecLen(physics.subVec(players[id].position, player.position))}))
    .reduce((prev, curr) => prev.d > curr.d && curr || prev)
  return {
    playerId: id,
    position: {
      x: players[id].position.x + ((players[id].r + 5) * (players[target.id].position.x - players[id].position.x))/target.d,
      y: players[id].position.y + ((players[id].r + 5) * (players[target.id].position.y - players[id].position.y))/target.d
    },
    // position: physics.addVec(players[id].position, physics.radialToEuc({
    //   len: players[id].r + 5,
    //   angle: physics.angleOfVec(physics.subVec(players[id].position, players[targetId].position)),
    // })),
    // velocity: physics.radialToEuc({
    //   len: 1000,
    //   angle: physics.angleOfVec(physics.subVec(players[id].position, players[targetId].position)),
    // }),
    velocity: {
      x: (bulletSpeed) * (players[target.id].position.x - players[id].position.x)/target.d,
      y: (bulletSpeed) * (players[target.id].position.y - players[id].position.y)/target.d
    },
    r: 4
  }
}

module.exports = {
  createBullet
}
