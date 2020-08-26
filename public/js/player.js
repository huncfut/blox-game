const newPlayer = (id, nick, time, position, velocity, acceleration, r) => ({
  id: id,
  nick: nick || "",
  r: r || 16,
  lastCalcTime: time || Date.now(),
  position: position || {
    x: 0,
    y: 0
  },
  velocity: velocity || {
    x: 0,
    y: 0
  },
  rB: {
    timesLeft: 0,
    velocity: {
      x: 0,
      y:0
    }
  },
  acceleration: acceleration || {
    x: 0,
    y: 0
  },
  isStunned: false,
})
