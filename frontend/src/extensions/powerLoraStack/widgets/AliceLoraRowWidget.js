import { promptForNumber, showLoraChooser } from "../bridges/comfyDialogs.js";
import { DEFAULT_ROW_VALUE } from "../constants.js";
import { fitString, getRowWidgets, isLowQuality, moveWidget, roundStrength } from "../layout.js";
import { AliceBaseWidget } from "./AliceBaseWidget.js";

export class AliceLoraRowWidget extends AliceBaseWidget {
  constructor(name, initialValue) {
    super(name, 28);
    this.__aliceRowWidget = true;
    this.value = {
      ...DEFAULT_ROW_VALUE,
      ...(initialValue || {}),
    };
    this.value.strengthTwo = null;
  }

  _changeStrength(node, key, delta) {
    const nextValue = roundStrength((this.value[key] ?? 1) + delta);
    this.value[key] = nextValue;
    node.setDirtyCanvas(true, true);
  }

  _promptStrength(event, node, key) {
    promptForNumber(event, this.value[key] ?? 1, (value) => {
      this.value[key] = value;
      node.setDirtyCanvas(true, true);
    });
  }

  _drawNumberControl(ctx, x, y, height, value) {
    const arrowWidth = 14;
    const valueWidth = 42;
    const innerGap = 3;
    const totalWidth = arrowWidth + innerGap + valueWidth + innerGap + arrowWidth;
    const middleY = y + height / 2;

    ctx.save();
    ctx.fillStyle = LiteGraph.WIDGET_TEXT_COLOR;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("◀", x + arrowWidth / 2, middleY);
    ctx.fillText(fitString(ctx, Number(value ?? 1).toFixed(2), valueWidth), x + arrowWidth + innerGap + valueWidth / 2, middleY);
    ctx.fillText("▶", x + arrowWidth + innerGap + valueWidth + innerGap + arrowWidth / 2, middleY);
    ctx.restore();

    return {
      totalWidth,
      dec: [x, arrowWidth],
      value: [x + arrowWidth + innerGap, valueWidth],
      inc: [x + arrowWidth + innerGap + valueWidth + innerGap, arrowWidth],
    };
  }

  draw(ctx, node, width, y) {
    this.last_y = y;

    const drawHeight = this._height;
    const margin = 10;
    const innerPaddingY = 3;
    const innerY = y + innerPaddingY;
    const innerHeight = drawHeight - innerPaddingY * 2;
    const toggleX = margin + 10;
    const toggleWidth = 24;
    const toggleHeight = 12;
    const toggleKnobSize = 8;
    const actionsWidth = 66;
    const actionX = width - margin - actionsWidth;
    const controlsWidth = 76;
    const controlsX = actionX - 8 - controlsWidth;
    const nameX = toggleX + toggleWidth + 12;
    const nameWidth = Math.max(60, controlsX - 10 - nameX);
    const middleY = y + drawHeight / 2;
    const toggleY = middleY - toggleHeight / 2;
    const toggleKnobX = this.value.on ? toggleX + toggleWidth - toggleKnobSize - 2 : toggleX + 2;
    const toggleKnobY = middleY - toggleKnobSize / 2;

    this.value.strengthTwo = null;

    ctx.save();
    ctx.fillStyle = LiteGraph.WIDGET_BGCOLOR;
    ctx.strokeStyle = LiteGraph.WIDGET_OUTLINE_COLOR;
    ctx.beginPath();
    ctx.roundRect(margin, innerY, width - margin * 2, innerHeight, isLowQuality() ? [0] : [8]);
    ctx.fill();
    if (!isLowQuality()) {
      ctx.stroke();
    }

    ctx.fillStyle = this.value.on ? "#4f8df7" : "#626b78";
    ctx.beginPath();
    ctx.roundRect(toggleX, toggleY, toggleWidth, toggleHeight, isLowQuality() ? [0] : [toggleHeight / 2]);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(toggleKnobX, toggleKnobY, toggleKnobSize, toggleKnobSize, isLowQuality() ? [0] : [toggleKnobSize / 2]);
    ctx.fill();

    ctx.fillStyle = this.value.on ? LiteGraph.WIDGET_TEXT_COLOR : LiteGraph.WIDGET_SECONDARY_TEXT_COLOR;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(fitString(ctx, this.value.lora || "None", nameWidth), nameX, middleY);

    this.hitAreas = {};

    ctx.fillStyle = LiteGraph.WIDGET_SECONDARY_TEXT_COLOR;
    ctx.fillText("S", controlsX - 12, middleY);
    const strengthControl = this._drawNumberControl(ctx, controlsX, y, drawHeight, this.value.strength);
    this.hitAreas.modelDec = {
      bounds: strengthControl.dec,
      onClick: (_event, _pos, currentNode) => this._changeStrength(currentNode, "strength", -0.05),
    };
    this.hitAreas.modelValue = {
      bounds: strengthControl.value,
      onClick: (event, _pos, currentNode) => this._promptStrength(event, currentNode, "strength"),
    };
    this.hitAreas.modelInc = {
      bounds: strengthControl.inc,
      onClick: (_event, _pos, currentNode) => this._changeStrength(currentNode, "strength", 0.05),
    };

    const actionWidth = 18;
    const actionGap = 4;
    const actions = [
      { key: "up", label: "↑" },
      { key: "down", label: "↓" },
      { key: "remove", label: "×" },
    ];
    ctx.fillStyle = LiteGraph.WIDGET_TEXT_COLOR;
    ctx.textAlign = "center";
    actions.forEach((action, index) => {
      const x = actionX + index * (actionWidth + actionGap);
      ctx.fillText(action.label, x + actionWidth / 2, middleY);
      this.hitAreas[action.key] = {
        bounds: [x, actionWidth],
        onClick: (_event, _pos, currentNode) => {
          if (action.key === "up") {
            moveWidget(currentNode, this, -1);
          } else if (action.key === "down") {
            moveWidget(currentNode, this, 1);
          } else {
            currentNode._aliceRemoveRow(this);
          }
        },
      };
    });

    ctx.restore();

    this.hitAreas.toggle = {
      bounds: [toggleX, toggleWidth],
      onClick: (_event, _pos, currentNode) => {
        this.value.on = !this.value.on;
        currentNode.setDirtyCanvas(true, true);
      },
    };
    this.hitAreas.lora = {
      bounds: [nameX, nameWidth],
      onClick: (event, _pos, currentNode) => {
        showLoraChooser(event, (value) => {
          this.value.lora = value;
          currentNode.setDirtyCanvas(true, true);
        });
      },
    };
  }

  serializeValue(node) {
    return {
      on: this.value.on !== false,
      lora: this.value.lora || "None",
      strength: Number(this.value.strength ?? 1),
      order: getRowWidgets(node).indexOf(this),
    };
  }
}
