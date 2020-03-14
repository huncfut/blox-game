const physics = require('./physics')
const R = require('ramda')

const createBullet = (players, id) => {
  let targetId = Object.values(players)
    .filter(player => player.id !== id)
    .map(player => ({id: player.id, d: physics.vecLen(physics.subVec(players[id].position, player.position))}))
    .reduce((prev, curr) => prev.d > curr.d && curr || prev).id
  return {
    playerId: id,
    position: physics.addVec(players[id].position, physics.radialToEuc({
      len: players[id].r + 5,
      angle: physics.angleOfVec(physics.subVec(players[id].position, players[targetId].position)),
    })),
    velocity: physics.radialToEuc({
      len: 1000,
      angle: physics.angleOfVec(physics.subVec(players[id].position, players[targetId].position)),
    }),
    r: 4
  }
}

module.exports = {
  createBullet
}
