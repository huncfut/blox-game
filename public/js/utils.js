class utils {
  static pointOnLine(obj1, obj2, dist) {
    var d = distance(obj1, obj2)
    [x, y] = [obj1.x - (dist * (obj1.x - obj2.x)) / d, obj1.y - (dist * (obj1.y - obj2.y)) / d]
    return [x, y]
  }

  static distance(obj1, obj2) {
    return ((obj1.x - obj2.x) ** 2 + (obj1.y - obj2.y) ** 2) ** 0.5
  }

  static random(min, max) {
    return min + Math.random() * (max - min)
  }
}
