const init = () => {
  // Creating stage (scene)
  var stage = new createjs.Stage("demoCanvas")
  // Creating circle
  var circle = new createjs.Shape()
  // Circle is going to be drawn filled with color DeepSkyBlue
  // with xOffset = 10, yOffset = 20, r = 50
  circle.graphics.beginFill("DeepSkyBlue").drawCircle(10, 20, 50)
  // Circle possition (without offset)
  circle.x = 100
  circle.y = 100
  // Adding circle to the stage
  stage.addChild(circle)
  // Rendering stage
  stage.update()
}
