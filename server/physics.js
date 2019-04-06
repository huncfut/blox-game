// acceleration
// velocity
// vector oparations





const addVec = (a, b) => ({
  x: a.x + b.x,
  y: a.y + b.y
})

const subVec = (a, b) => ({
  x: a.x - b.x,
  y: a.y - b.y
})

const calcAcceleration = (held, acceleration) => ({
  x: (held.rigth ? (held.left ? 0 : 1) : (held.left ? -1 : 0)),
  y: (held.up ? (held.down ? 0 : 1) : (held.down ? -1 : 0))
})

// od czasu

const calcVelocity = (acceleration, velocity) => addVec(acceleration, velocity)

const calcPosition = (velocity, position) => addVec(velocity, position)

module.exports = {
  addVec,
  subVec,
  calcAcceleration,
  calcVelocity,
  calcPosition
}
