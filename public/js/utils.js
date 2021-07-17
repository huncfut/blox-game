const utils = {
  pointOnLine: (obj1, obj2, dist) => {
    const d = distance(obj1, obj2)
    [x, y] = [obj1.x - (dist * (obj1.x - obj2.x)) / d, obj1.y - (dist * (obj1.y - obj2.y)) / d]
    return [x, y]
  },

  distance: (obj1, obj2) => ((obj1.x - obj2.x) ** 2 + (obj1.y - obj2.y) ** 2) ** 0.5,

  random: (min, max) => min + Math.random() * (max - min),

	bulletParticles: (start, finish) => {
		var particles = []
		const time = 150
		const numOfParticles = utils.random(1, 3)
		for (var i = 0; i < numOfParticles; i++) {
			particles[i] = new createjs.Shape()
			const partSize = utils.random(3, 5)
			particles[i].graphics.beginStroke("#696969").drawRoundRect(0, 0, partSize, partSize, 1)
			particles[i].regX = particles[i].regY = partSize / 2
			particles[i].x = start.x
			particles[i].y = start.y
			stage.addChild(particles[i])

			createjs.Tween.get(particles[i], {loop: true})
	      .to({
	        rotation: Math.random() > 0.5 ? 360 : -360
	      }, utils.random(500, 1000), createjs.Ease.linear)
			createjs.Tween.get(particles[i], {loop: false})
	      .to({
	        x: finish.x + utils.random(-8, 8),
	        y: finish.y + utils.random(-8, 8)
	      }, time, createjs.Ease.getPowOut(3))
	    createjs.Tween.get(particles[i], {loop: false})
	      .to({
	        alpha: 0
	      }, time - 20, createjs.Ease.getPowOut(1))
		}
		setTimeout(() => {
			particles.forEach(particle => stage.removeChild(particle))
		}, time)
	}
}
