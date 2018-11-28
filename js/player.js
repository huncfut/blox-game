class Player {
  constructor(x, y) {
    this.ticks = 0;
    this.axisArray = [];
    this.shape = new createjs.Shape();
    this.shape.x = x
    this.shape.y = y
    this.shape.rotation = 0
    this.x = x
    this.y = y
    this.moveXAxis = this.moveYAxis = 0
    this.hasShield = false
    this.shotStream = []
    this.size = 30
    this.regX = this.regY = this.size / 2
    this.isStunned = false
    this.stunTime = 0
  }
  update() {
    this.ticks++;
    this.rotate()
    this.moveXAxis *= (11 / 12) ** (60 / TICK)
    this.moveYAxis *= (11 / 12) ** (60 / TICK)
    if(!this.isStunned) {
      if(rHeld === true) {
        this.moveXAxis = Math.min(this.moveXAxis + TICK / 6, TICK)
      }
      if(lHeld === true) {
        this.moveXAxis = Math.max(this.moveXAxis - TICK / 6, -TICK)
      }
      if(uHeld === true) {
        this.moveYAxis = Math.min(this.moveYAxis + TICK / 6, TICK)
      }
      if(dHeld === true) {
        this.moveYAxis = Math.max(this.moveYAxis - TICK / 6, -TICK)
      }
    }
    this.move()
    this.axisArray.push({xAxis: this.moveXAxis, yAxis: this.moveYAxis})
    if(this.ticks % 1 == 0) {
      sendAxis(this.axisArray)
      this.axisArray = []
    }
  }
  rotate() {
    if (!this.isStunned) {
      this.shape.rotation += 90 / TICK + 20 * Math.max(Math.abs(this.moveXAxis), Math.abs(this.moveYAxis)) / TICK
    } else {
      this.shape.rotation += 45 / TICK
    }
  }
  shoot() {
    if (!this.isStunned) {
      shot = fireShot(this.x, this.y, target)
      shotStream.push(shot)
    }
  }
  move() {
    if (!this.isStunned) {
      let angle = Math.atan2(this.moveYAxis, this.moveXAxis)
      // if (this.moveXAxis !== 0) {
      //   this.x += MAX_SPEED / TICK * 60 / TICK * Number(Math.cos(angle).toFixed(5)) * Math.abs(this.moveXAxis)
      //   this.shape.x = this.x;
      // }
      // if (this.moveYAxis !== 0) {
      //   this.y -= MAX_SPEED / TICK * 60 / TICK * Number(Math.sin(angle).toFixed(5)) * Math.abs(this.moveYAxis)
      //   this.shape.y = this.y;
      // }
    }
  }
  doEnemy(x, y, xAxis, yAxis) {
    this.moveXAxis = xAxis;
    this.moveYAxis = yAxis;
    this.x = x
    this.y = y
    createjs.Tween.get(this.shape, {loop: false})
      .to({
        x: x,
        y: y
      }, 1000 / 60, createjs.Ease.Linear)
  }
  // setCoords(x, y) {
  //   if(this.x + 20 < x && this.x - 20 > x) {
  //     this.x = x;
  //     createjs.Tween.get(this.shape, {
  //         loop: false
  //       })
  //       .to({
  //         x: x
  //       }, 1000 / 20, createjs.Ease.Linear)
  //   }
  //   if(this.y + 20 < y && this.y - 20 > y) {
  //     this.y = y;
  //     createjs.Tween.get(this.shape, {
  //         loop: false
  //       })
  //       .to({
  //         y: y
  //       }, 1000 / 20, createjs.Ease.Linear)
  //   }
  // }
  setCoords1(x, y) {
    console.log(Math.abs(this.x - x));
    this.x = x
    this.y = y
    createjs.Tween.get(this.shape, {loop: false})
      .to({
        x: x,
        y: y
      }, 1000 / 60, createjs.Ease.Linear)
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
