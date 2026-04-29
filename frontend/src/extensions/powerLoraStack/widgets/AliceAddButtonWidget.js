import { showLoraChooser } from "../bridges/comfyDialogs.js";
import { getAvailableLoras } from "../bridges/loraRegistry.js";
import { DEFAULT_ROW_VALUE } from "../constants.js";
import { isLowQuality } from "../layout.js";
import { AliceBaseWidget } from "./AliceBaseWidget.js";

export class AliceAddButtonWidget extends AliceBaseWidget {
  constructor() {
    super("__alice_add_button__", 30);
    this.options.serialize = false;
    this.serialize = false;
    this.value = "";
  }

  draw(ctx, node, width, y) {
    this.last_y = y;

    const drawHeight = this._height;
    const margin = 10;
    const innerPaddingY = 3;
    const innerY = y + innerPaddingY;
    const innerHeight = drawHeight - innerPaddingY * 2;
    const buttonX = margin;
    const buttonWidth = width - margin * 2;

    ctx.save();
    ctx.fillStyle = "#305f34";
    ctx.strokeStyle = "#447d49";
    ctx.beginPath();
    ctx.roundRect(buttonX, innerY, buttonWidth, innerHeight, isLowQuality() ? [0] : [8]);
    ctx.fill();
    if (!isLowQuality()) {
      ctx.stroke();
    }
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("+ Add Lora", buttonX + buttonWidth / 2, y + drawHeight / 2);
    ctx.restore();

    this.hitAreas.add = {
      bounds: [buttonX, buttonWidth],
      onClick: (event, _pos, currentNode) => {
        const loras = getAvailableLoras();
        if (!loras.length) {
          currentNode._aliceAddRow();
          return;
        }
        showLoraChooser(event, (value) => {
          if (value && value !== "None") {
            currentNode._aliceAddRow({ ...DEFAULT_ROW_VALUE, lora: value });
          }
        });
      },
    };
  }
}
