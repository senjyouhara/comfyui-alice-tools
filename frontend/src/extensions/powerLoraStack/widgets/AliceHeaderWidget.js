import { getStrengthMode, toggleStrengthMode } from "../state.js";
import { STRENGTH_MODE_SEPARATE } from "../constants.js";
import { isLowQuality } from "../layout.js";
import { AliceBaseWidget } from "./AliceBaseWidget.js";

export class AliceHeaderWidget extends AliceBaseWidget {
  constructor() {
    super("__alice_header__", 28);
    this.options.serialize = false;
    this.serialize = false;
    this.value = "";
  }

  draw(ctx, node, width, y) {
    this.last_y = y;

    const drawHeight = this._height;
    const margin = 10;
    const innerPaddingY = 3;
    const innerHeight = drawHeight - innerPaddingY * 2;
    const innerY = y + innerPaddingY;
    const buttonWidth = 126;
    const buttonX = width - margin - buttonWidth;

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
    ctx.fillText("Alice Power Lora Stack", margin + 10, y + drawHeight / 2);

    ctx.fillStyle = "#2f6fed";
    ctx.beginPath();
    ctx.roundRect(buttonX, innerY + 2, buttonWidth, innerHeight - 4, isLowQuality() ? [0] : [6]);
    ctx.fill();

    const modeLabel = getStrengthMode(node) === STRENGTH_MODE_SEPARATE ? "Mode: Split" : "Mode: Single";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(modeLabel, buttonX + buttonWidth / 2, y + drawHeight / 2);
    ctx.restore();

    this.hitAreas.mode = {
      bounds: [buttonX, buttonWidth],
      onClick: (_event, _pos, currentNode) => toggleStrengthMode(currentNode),
    };
  }
}
