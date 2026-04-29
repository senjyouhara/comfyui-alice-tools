import { isLowQuality } from "../layout.js";
import { AliceBaseWidget } from "./AliceBaseWidget.js";

export class AliceHeaderWidget extends AliceBaseWidget {
  constructor() {
    super("__alice_controlnet_header__", 28);
    this.options.serialize = false;
    this.serialize = false;
    this.value = "";
  }

  draw(ctx, _node, width, y) {
    this.last_y = y;

    const drawHeight = this._height;
    const margin = 10;
    const innerPaddingY = 3;
    const innerHeight = drawHeight - innerPaddingY * 2;
    const innerY = y + innerPaddingY;

    ctx.save();
    ctx.fillStyle = LiteGraph.WIDGET_BGCOLOR;
    ctx.strokeStyle = LiteGraph.WIDGET_OUTLINE_COLOR;
    ctx.beginPath();
    ctx.roundRect(margin, innerY, width - margin * 2, innerHeight, isLowQuality() ? [0] : [8]);
    ctx.fill();
    if (!isLowQuality()) {
      ctx.stroke();
    }

    ctx.fillStyle = LiteGraph.WIDGET_TEXT_COLOR;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("Alice ControlNet Stack", margin + 10, y + drawHeight / 2);
    ctx.restore();
  }
}
