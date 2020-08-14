var held = {
  up: false,
  down: false,
  left: false,
  right: false,
  bullet: false,
  laser: false
}

const handleKeyDown = e => {
  switch (e.keyCode) {
    case KEYCODE_W:
    case KEYCODE_ARROW_UP:
      held.up = true;
      break
    case KEYCODE_S:
    case KEYCODE_ARROW_DOWN:
      held.down = true;
      break
    case KEYCODE_A:
    case KEYCODE_ARROW_LEFT:
      held.left = true
      break
    case KEYCODE_D:
    case KEYCODE_ARROW_RIGHT:
      held.right = true
      break;
    case KEYCODE_2:
    case KEYCODE_BRACKET_RIGHT:
      held.bullet = true
      break;
  }
}

const handleKeyUp = e => {
  switch (e.keyCode) {
    case KEYCODE_W:
    case KEYCODE_ARROW_UP:
      held.up = false
      break
    case KEYCODE_S:
    case KEYCODE_ARROW_DOWN:
      held.down = false
      break
    case KEYCODE_A:
    case KEYCODE_ARROW_LEFT:
      held.left = false
      break
    case KEYCODE_D:
    case KEYCODE_ARROW_RIGHT:
      held.right = false
      break
    case KEYCODE_2:
    case KEYCODE_BRACKET_RIGHT:
      held.bullet = false
      break;
  }
}
