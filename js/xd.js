doCollision(player2) {
  console.log(this.vX);
  let dx = this.y-player2.y
  let dy = this.x-player2.x
  let collisionision_angle = Math.atan2(dy, dx)
  let magnitude_1 = Math.sqrt(this.vX*this.vX+this.vY*this.vY)
  let magnitude_2 = Math.sqrt(player2.vX*player2.vX+player2.vY*player2.vY)
  let direction_1 = Math.atan2(this.vY, this.vX)
  let direction_2 = Math.atan2(player2.vY, player2.vX)
  let new_xspeed_1 = magnitude_1*Math.cos(direction_1-collisionision_angle)
  let new_yspeed_1 = magnitude_1*Math.sin(direction_1-collisionision_angle)
  let new_xspeed_2 = magnitude_2*Math.cos(direction_2-collisionision_angle)
  let new_yspeed_2 = magnitude_2*Math.sin(direction_2-collisionision_angle)
  let final_xspeed_1 = ((this.mass-player2.mass)*new_xspeed_1+(player2.mass+player2.mass)*new_xspeed_2)/(this.mass+player2.mass)
  let final_xspeed_2 = ((this.mass+this.mass)*new_xspeed_1+(player2.mass-this.mass)*new_xspeed_2)/(this.mass+player2.mass)
  let final_yspeed_1 = new_yspeed_1
  let final_yspeed_2 = new_yspeed_2
  this.vX = Math.cos(collisionision_angle)*final_xspeed_1+Math.cos(collisionision_angle+Math.PI/2)*final_yspeed_1
  this.vY = Math.sin(collisionision_angle)*final_xspeed_1+Math.sin(collisionision_angle+Math.PI/2)*final_yspeed_1
  player2.vX = Math.cos(collisionision_angle)*final_xspeed_2+Math.cos(collisionision_angle+Math.PI/2)*final_yspeed_2
  player2.vY = Math.sin(collisionision_angle)*final_xspeed_2+Math.sin(collisionision_angle+Math.PI/2)*final_yspeed_2
  console.log(this.vX);
}
