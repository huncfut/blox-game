class canvas {
  constructor(ctx, fps) {
    this.ctx = ctx;
    this.objects = {
      players: [],
      arrows: [],
      particles: [],
    };
    setInterval(draw, fps/1000);
  }

  draw() {
    for(let type in objects) {
      switch(type) {
        case "players":
          for(let player of objects[type]) drawPlayer(player);
          break;
        case "arrows":
          for(let arrow of objects[type]) drawArrow(arrow);
          break;
        case "particles":
          for(let particle of objects[type]) drawParticle(particle);
          break;
      }
    }
  }

  drawPlayer(player) {

  }
}
