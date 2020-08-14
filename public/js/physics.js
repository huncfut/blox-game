// acceleration
// velocity
// vector oparations

const physics = {
  drag: velocity => ({
    x: -(ACCELERATION * velocity.x / MAX_SPEED),
    y: -(ACCELERATION * velocity.y / MAX_SPEED)
  }),

  angleOfVec: v => Math.atan2(v.y, v.x),

  radialToEuc: v => ({
    x: v.len * Math.cos(v.angle),
    y: v.len * Math.sin(v.angle)
  }),

  roundVec: (v, n) => ({
    x: Math.round(v.x * n) / n,
    y: Math.round(v.y * n) / n
  }),

  addVec: (v, u) => ({
    x: v.x + u.x,
    y: v.y + u.y
  }),

  subVec: (v, u) => ({
    x: v.x - u.x,
    y: v.y - u.y
  }),

  scalMultVec: (v, k) => ({
    x: v.x * k,
    y: v.y * k
  }),

  dotProduct: (v, u) => (v.x * u.x) + (v.y * u.y),

  vecLen: v => Math.sqrt(v.x**2 + v.y**2),

  limitAcceleration: acceleration => ({
    x: (physics.vecLen(acceleration) === 0) ? 0 : ((acceleration.x / physics.vecLen(acceleration)) * ACCELERATION),
    y: (physics.vecLen(acceleration) === 0) ? 0 : ((acceleration.y / physics.vecLen(acceleration)) * ACCELERATION)
  }),

  cropVelocity: (acceleration, velocity) => ({
    x: ((Math.abs(acceleration.x) < ACCELERATION/2) && (Math.abs(velocity.x) < 50)) ? 0 : velocity.x,
    y: ((Math.abs(acceleration.y) < ACCELERATION/2) && (Math.abs(velocity.y) < 50)) ? 0 : velocity.y
  }),

  // od czasu

  calcAccFromHeld: (held) => physics.limitAcceleration({
    x: (held.right ? (held.left ? 0 : ACCELERATION) : (held.left ? -ACCELERATION : 0)),
    y: (held.up ? (held.down ? 0 : -ACCELERATION) : (held.down ? ACCELERATION : 0))
  }),

  calcAcceleration: (held, velocity, dTime, isStunned) => {
    const heldAcc = isStunned && {x: 0, y: 0} || physics.calcAccFromHeld(held)
    return physics.addVec(heldAcc, physics.drag(velocity, heldAcc))
  },

  calcVelocity: (acceleration, velocity, dTime) => (
    physics.cropVelocity(acceleration, physics.addVec(physics.scalMultVec(acceleration, dTime), velocity))
  ),

  calcPosition: (acceleration, velocity, position, dTime) => {
    const distFromVel = physics.addVec(physics.scalMultVec(velocity, dTime), position)
    const distFromAcc = physics.scalMultVec(physics.scalMultVec(physics.scalMultVec(acceleration, dTime), dTime), 0.5)
    return physics.addVec(distFromVel, distFromAcc)
  },

  // Collisions

  checkCollision: (unitA, unitB) => {
    return physics.vecLen(physics.subVec(unitA.position, unitB.position)) <= (unitA.r + unitB.r)
  },

  doCollision: (unitA, unitB) => {
    const licznik = physics.dotProduct(physics.subVec(unitA.velocity, unitB.velocity), physics.subVec(unitA.position, unitB.position))
    const mianownik = physics.vecLen(physics.subVec(unitA.position, unitB.position))**2
    const v = physics.roundVec(physics.subVec(unitA.position, unitB.position), 1e6)
    return physics.subVec(unitA.velocity, physics.roundVec(physics.scalMultVec(v, licznik / mianownik), 1e6))
  }
}
