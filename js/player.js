// Przepisać!!!

class Player {
  constructor(position) {
    this.shape = new createjs.Shape();
    this.shape.x = position.x
    this.shape.y = position.y
    this.shape.rotation = 0
    this.position = position
    this.size = 28
    this.regX = this.regY = this.size / 2
  }
  update(data) {
    this.v = data.v
    this.position = data.position
    createjs.Tween.get(this.shape, {loop: false})
      .to({
        x: this.position.x,
        y: 512 - this.position.y
      }, 1000 / TICK, createjs.Ease.Linear)
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
