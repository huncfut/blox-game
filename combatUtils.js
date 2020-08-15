const physics = require('./physics')
const R = require('ramda')
const env = require('./env')
var id = 0

const getId = () => `${id++}`

const createBullet = (players, playerId) => {
  let target = Object.values(players)
    .filter(player => player.id !== playerId)
    .map(player => ({id: player.id, d: physics.vecLen(physics.subVec(players[playerId].position, player.position))}))
    .reduce((prev, curr) => prev.d > curr.d && curr || prev)
  return {
    id: getId(),
    playerId: playerId,
    position: physics.addVec(
      players[id].position,
      physics.scalMultVec(
        physics.subVec(players[target.id].position, players[playerId].position.x),
        (players[id].r + 5)/target.d
    )),
    velocity: physics.scalMultVec(physics.subVec(players[target.id].position, players[playerId].position), bulletSpeed/target.d),
    r: 4
  }
}

module.exports = {
  createBullet
}
