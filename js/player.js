// Przepisać!!!

class Player {
  constructor(position) {
    this.position = position
    this.size = 28
    this.regX = this.regY = this.size / 2
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
}
