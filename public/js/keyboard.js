var held = {
  up: false,
  down: false,
  left: false,
  right: false,
  bullet: false,
  laser: false
}

const handleKeyDown = e => {
  switch (e.key) {
    case "w":
    case "ArrowUp":
      held.up = true
      return 1
    case "s":
    case "ArrowDown":
      held.down = true
      return 1
    case "a":
    case "ArrowLeft":
      held.left = true
      return 1
    case "d":
    case "ArrowRight":
      held.right = true
      return 1
    case "2":
    case "]":
      held.bullet = true
      return 1
  }
}

const handleKeyUp = e => {
  switch (e.key) {
    case "w":
    case "ArrowUp":
      held.up = false
      break
    case "s":
    case "ArrowDown":
      held.down = false
      break
    case "a":
    case "ArrowLeft":
      held.left = false
      break
    case "d":
    case "ArrowRight":
      held.right = false
      break
    case "2":
    case "]":
      held.bullet = false
      break;
  }
}
