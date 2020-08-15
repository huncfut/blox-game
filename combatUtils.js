const physics = require('./physics')
const R = require('ramda')
const env = require('./env')

const createBullet = (players, id) => {
  let target = Object.values(players)
    .filter(player => player.id !== id)
    .map(player => ({id: player.id, d: physics.vecLen(physics.subVec(players[id].position, player.position))}))
    .reduce((prev, curr) => prev.d > curr.d && curr || prev)
  return {
    playerId: id,
    position: physics.addVec(
      players[id].position,
      physics.scalMultVec(
        physics.subVec(players[target.id].position, players[id].position.x),
        (players[id].r + 5)/target.d
    )),
    // position: physics.addVec(players[id].position, physics.radialToEuc({
    //   len: players[id].r + 5,
    //   angle: physics.angleOfVec(physics.subVec(players[id].position, players[targetId].position)),
    // })),
    // velocity: physics.radialToEuc({
    //   len: 1000,
    //   angle: physics.angleOfVec(physics.subVec(players[id].position, players[targetId].position)),
    // }),
    velocity: physics.scalMultVec(physics.subVec(players[target.id].position, players[id].position), bulletSpeed/target.d),
    r: 4
  }
}

module.exports = {
  createBullet
}
