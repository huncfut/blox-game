// Przepisać!!!

class Player {
  constructor(position) {
    this.ticks = 0;
    this.shape = new createjs.Shape();
    this.shape.x = position.x
    this.shape.y = position.y
    this.shape.rotation = 0
    this.position = position
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
  update(data) {
    this.v = data.v
    this.position = data.position
    this.rotate()
    createjs.Tween.get(this.shape, {loop: false})
      .to({
        x: 0,
        y: 0
      }, 1000 / TICK, createjs.Ease.Linear)
  }
  changeColor(color) {
    this.graphics.clear();
    this.graphics.beginStroke(color).drawRect(0, 0, this.size, this.size);
  }
  destroy() {
    for(let i = 0; i < 30; i++) {
      makeParticle(
        this.position.x, this.position.y,
        utils.random(this.position.x-150, this.position.x+150),
        utils.random(this.position.y-150, this.position.y+150), 12)
    }
    this.graphics.clear();
  }
  draw(type, color) {
    this.shape.graphics[type](color).drawRect(this.position.x, this.position.y, this.size, this.size);
    this.shape.regX = this.shape.regY = this.size / 2;
    stage.addChild(this.shape);
  }
}
