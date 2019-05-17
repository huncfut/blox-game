// acceleration
// velocity
// vector oparations
const env = require('./env')

// const drag = (velocity) => ({
//   x: -(env.ACCELERATION * velocity.x / env.MAX_SPEED),
//   y: -(env.ACCELERATION * velocity.y / env.MAX_SPEED)
// })

const drag = (velocity) => ({
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

const scalMultVec = (v, k) => ({
  x: v.x * k,
  y: v.y * k
})

const vecLen = v => Math.sqrt(v.x**2 + v.y**2)

const limitAcceleration = acceleration => ({
  x: (vecLen(acceleration) === 0) ? 0 : ((acceleration.x / vecLen(acceleration)) * env.ACCELERATION),
  y: (vecLen(acceleration) === 0) ? 0 : ((acceleration.y / vecLen(acceleration)) * env.ACCELERATION)
})

const cropVelocity = (acceleration, velocity) => ({
  x: (Math.abs(velocity.x) < 50 && acceleration.x == 0) ? 0 : velocity.x,
  y: (Math.abs(velocity.y) < 50 && acceleration.y == 0) ? 0 : velocity.y
})

// od czasu

const calcAccFromHeld = (held) => ({
  x: (held.right ? (held.left ? 0 : env.ACCELERATION) : (held.left ? -env.ACCELERATION : 0)),
  y: (held.up ? (held.down ? 0 : env.ACCELERATION) : (held.down ? -env.ACCELERATION : 0))
})

const calcAcceleration = (held, velocity, dTime) => {
  return addVec(calcAccFromHeld(held), drag(velocity))
}

const calcVelocity = (acceleration, velocity, dTime) => (
  cropVelocity(acceleration, addVec(scalMultVec(acceleration, dTime), velocity))
)

const calcPosition = (acceleration, velocity, position, dTime) => {
  const distFromVel = addVec(scalMultVec(velocity, dTime), position)
  const distFromAcc = scalMultVec(scalMultVec(scalMultVec(acceleration, dTime), dTime), 0.5)

  return addVec(distFromVel, distFromAcc)

}

module.exports = {
  addVec,
  scalMultVec,
  calcAcceleration,
  calcVelocity,
  calcPosition,
  vecLen
}
