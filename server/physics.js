// acceleration
// velocity
// vector oparations
const env = require('./env')

// const drag = (velocity) => ({
//   x: -(env.ACCELERATION * velocity.x / env.MAX_SPEED),
//   y: -(env.ACCELERATION * velocity.y / env.MAX_SPEED)
// })

const drag = (velocity, acceleration) => ({
  x: -(env.ACCELERATION * velocity.x / env.MAX_SPEED),
  y: -(env.ACCELERATION * velocity.y / env.MAX_SPEED)
})

const roundVec = v => ({
    x: Math.round(v.x * 1e6) / 1e6,
    y: Math.round(v.y * 1e6) / 1e6
})

const addVec = (v, u) => ({
  x: v.x + u.x,
  y: v.y + u.y
})

const subVec = (v, u) => ({
  x: v.x - u.x,
  y: v.y - u.y
})

const scalMultVec = (v, k) => ({
  x: v.x * k,
  y: v.y * k
})

const dotProduct = (v, u) => (v.x * u.x) + (v.y * u.y)



const vecLen = v => Math.sqrt(v.x**2 + v.y**2)

const limitAcceleration = acceleration => ({
  x: (vecLen(acceleration) === 0) ? 0 : ((acceleration.x / vecLen(acceleration)) * env.ACCELERATION),
  y: (vecLen(acceleration) === 0) ? 0 : ((acceleration.y / vecLen(acceleration)) * env.ACCELERATION)
})

const cropVelocity = (acceleration, velocity) => ({
  x: ((Math.abs(acceleration.x) < env.ACCELERATION/2) && (Math.abs(velocity.x) < 50)) ? 0 : velocity.x,
  y: ((Math.abs(acceleration.y) < env.ACCELERATION/2) && (Math.abs(velocity.y) < 50)) ? 0 : velocity.y
})

// od czasu

const calcAccFromHeld = (held) => limitAcceleration({
  x: (held.right ? (held.left ? 0 : env.ACCELERATION) : (held.left ? -env.ACCELERATION : 0)),
  y: (held.up ? (held.down ? 0 : env.ACCELERATION) : (held.down ? -env.ACCELERATION : 0))
})

const calcAcceleration = (held, velocity, dTime) => {
  const heldAcc = calcAccFromHeld(held)
  const acc = addVec(heldAcc, drag(velocity, heldAcc))
  return acc
}

const calcVelocity = (acceleration, velocity, dTime) => (
  cropVelocity(acceleration, addVec(scalMultVec(acceleration, dTime), velocity))
)

const calcPosition = (acceleration, velocity, position, dTime) => {
  const distFromVel = addVec(scalMultVec(velocity, dTime), position)
  const distFromAcc = scalMultVec(scalMultVec(scalMultVec(acceleration, dTime), dTime), 0.5)
  return addVec(distFromVel, distFromAcc)

}


// Collisions

const checkCollision = (playerA, playerB) => {
  return vecLen(subVec(playerA.position, playerB.position)) <= (playerA.r + playerB.r)
}

const doCollision = (playerA, playerB) => {
  const licznik = dotProduct(subVec(playerA.velocity, playerB.velocity), subVec(playerA.position, playerB.position))
  const mianownik = vecLen(subVec(playerA.position, playerB.position))**2
  const v = roundVec(subVec(playerA.position, playerB.position))
  return subVec(playerA.velocity, roundVec(scalMultVec(v, licznik / mianownik)))
}

module.exports = {
  addVec,
  subVec,
  vecLen,
  scalMultVec,
  calcAcceleration,
  calcVelocity,
  calcPosition,
  checkCollision,
  doCollision
}
