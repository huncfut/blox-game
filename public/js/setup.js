var init = () => {
  const conButton = document.getElementById('connect')
  const disButton = document.getElementById('disconnect')
  conButton.onclick = connect
  disButton.onclick = disconnect
  stage = new createjs.Stage("demoCanvas")
  createjs.Ticker.framerate = TICK
  createjs.Ticker.addEventListener("tick", onTick)
  document.addEventListener('keyup', e => {
		e.preventDefault()
		handleKeyUp(e)
	})
  document.addEventListener('keydown', e => {
		e.preventDefault()
		e.repeat || handleKeyDown(e)
	})
}
