export class AliceBaseWidget {
  constructor(name, height = LiteGraph.NODE_WIDGET_HEIGHT) {
    this.name = name;
    this.type = "custom";
    this.options = {};
    this.value = null;
    this.y = 0;
    this.last_y = 0;
    this._height = height;
    this._pressedKey = null;
    this.hitAreas = {};
  }

  computeSize(width) {
    return [width, this._height];
  }

  serializeValue() {
    return this.value;
  }

  _inBounds(pos, bounds) {
    if (!bounds) {
      return false;
    }

    const [x, width] = bounds;
    return pos[0] >= x && pos[0] <= x + width && pos[1] >= this.last_y && pos[1] <= this.last_y + this._height;
  }

  _findHitArea(pos) {
    for (const [key, area] of Object.entries(this.hitAreas)) {
      if (this._inBounds(pos, area.bounds)) {
        return [key, area];
      }
    }
    return [null, null];
  }

  mouse(event, pos, node) {
    if (event.type === "pointerdown") {
      const [key] = this._findHitArea(pos);
      this._pressedKey = key;
      return key != null;
    }

    if (event.type === "pointerup") {
      const [key, area] = this._findHitArea(pos);
      const pressedKey = this._pressedKey;
      this._pressedKey = null;
      if (key != null && key === pressedKey) {
        area.onClick?.call(this, event, pos, node);
        return true;
      }
    }

    return false;
  }
}
