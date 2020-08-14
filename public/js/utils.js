const utils = {
  pointOnLine: (obj1, obj2, dist) => {
    const d = distance(obj1, obj2)
    [x, y] = [obj1.x - (dist * (obj1.x - obj2.x)) / d, obj1.y - (dist * (obj1.y - obj2.y)) / d]
    return [x, y]
  },

  distance: (obj1, obj2) => ((obj1.x - obj2.x) ** 2 + (obj1.y - obj2.y) ** 2) ** 0.5,

  random: (min, max) => min + Math.random() * (max - min),

  makeParticle: (x, y, x1, y1, size) => {
    var particle = new createjs.Shape()
    particle.graphics.beginStroke("#696969").drawRoundRect(0, 0, size, size, 1)
    particle.regX = size / 2
    particle.regY = size / 2
    particle.x = x
    particle.y = x
    stage.addChild(particle)
    let time = utils.random(1000, 1500)
    createjs.Tween.get(particle, {loop: true})
      .to({
        rotation: Math.random() > 0.5 ? 360 : -360
      }, utils.random(500, 1000), createjs.Ease.linear)
    createjs.Tween.get(particle, {loop: false})
      .to({
        x: x1,
        y: y1
      }, time, createjs.Ease.getPowOut(3))
    createjs.Tween.get(particle, {loop: false})
      .to({
        alpha: 0
      }, time + 500, createjs.Ease.getPowOut(1))
  }
}
