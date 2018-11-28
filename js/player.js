class Player {
  constructor(x, y) {
    this.ticks = 0;
    this.shape = new createjs.Shape();
    this.shape.x = x
    this.shape.y = y
    this.shape.rotation = 0
    this.x = x
    this.y = y
    this.v = 0
    this.hasShield = false
    this.shotStream = []
    this.size = 30
    this.regX = this.regY = this.size / 2
    this.isStunned = false
    this.stunTime = 0
  }
  rotate() {
    if (!this.isStunned) {
      this.shape.rotation += 90 / TICK + 20 * this.v / TICK
    } else {
      this.shape.rotation += 45 / TICK
    }
  }
  send() {
    sendHelds({
      uHeld,
      dHeld,
      lHeld,
      rHeld
    })
  }
  update(x, y, v) {
    this.v = v
    this.x = x
    this.y = y
    rotate()
    createjs.Tween.get(this.shape, {loop: false})
      .to({
        x: this.x,
        y: this.y
      }, 1000 / TICK, createjs.Ease.Linear)
  }
  changeColor(color) {
    this.graphics.clear();
    this.graphics.beginStroke(color).drawRect(0, 0, this.size, this.size);
  }
  destroy() {
    for(let i = 0; i < 30; i++) {
      makeParticle(this.x, this.y, utils.random(this.x-150, this.x+150), utils.random(this.y-150, this.y+150), 12)
    }
    this.graphics.clear();
  }
  draw(type, color) {
    this.shape.graphics[type](color).drawRect(0, 0, this.size, this.size);
    this.shape.regX = this.shape.regY = this.size / 2;
    stage.addChild(this.shape);
  }
}
