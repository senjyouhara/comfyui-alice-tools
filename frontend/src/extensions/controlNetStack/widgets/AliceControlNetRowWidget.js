import { promptForNumber, showControlNetChooser } from "../bridges/comfyDialogs.js";
import { DEFAULT_ROW_VALUE } from "../constants.js";
import {
  fitString,
  getImageInputNameForWidget,
  getRowWidgets,
  isLowQuality,
  moveWidget,
  roundValue,
} from "../layout.js";
import { AliceBaseWidget } from "./AliceBaseWidget.js";

const ROW_HEIGHT = 108;
const NUMBER_CONTROL_TOTAL_WIDTH = 82;
const CONTROL_ROW_HEIGHT = 18;
const ACTION_BUTTON_WIDTH = 18;
const ACTION_BUTTON_GAP = 4;
const ACTIONS_WIDTH = ACTION_BUTTON_WIDTH * 3 + ACTION_BUTTON_GAP * 2;

export class AliceControlNetRowWidget extends AliceBaseWidget {
  constructor(name, imageInputName, initialValue) {
    super(name, ROW_HEIGHT);
    this.__aliceControlNetRowWidget = true;
    this.imageInputName = imageInputName;
    this.value = {
      ...DEFAULT_ROW_VALUE,
      image_input: imageInputName,
      ...(initialValue || {}),
    };
  }

  _changeValue(node, key, delta, digits, min, max) {
    const current = Number(this.value[key] ?? 0);
    const nextValue = roundValue(Math.min(max, Math.max(min, current + delta)), digits);
    this.value[key] = nextValue;
    node.setDirtyCanvas(true, true);
  }

  _promptValue(event, node, key, digits, min, max) {
    promptForNumber(event, this.value[key] ?? 0, digits, (value) => {
      this.value[key] = roundValue(Math.min(max, Math.max(min, value)), digits);
      node.setDirtyCanvas(true, true);
    });
  }

  _drawNumberControl(ctx, x, centerY, value, digits = 2) {
    const arrowWidth = 14;
    const valueWidth = 48;
    const innerGap = 3;
    const totalWidth = arrowWidth + innerGap + valueWidth + innerGap + arrowWidth;

    ctx.save();
    ctx.fillStyle = LiteGraph.WIDGET_TEXT_COLOR;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("◀", x + arrowWidth / 2, centerY);
    ctx.fillText(
      fitString(ctx, Number(value ?? 0).toFixed(digits), valueWidth),
      x + arrowWidth + innerGap + valueWidth / 2,
      centerY,
    );
    ctx.fillText("▶", x + arrowWidth + innerGap + valueWidth + innerGap + arrowWidth / 2, centerY);
    ctx.restore();

    return {
      totalWidth,
      dec: [x, arrowWidth],
      value: [x + arrowWidth + innerGap, valueWidth],
      inc: [x + arrowWidth + innerGap + valueWidth + innerGap, arrowWidth],
    };
  }

  _drawLabeledNumberRow(ctx, label, labelX, controlX, centerY, value, digits = 2) {
    ctx.save();
    ctx.fillStyle = LiteGraph.WIDGET_SECONDARY_TEXT_COLOR;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(label, labelX, centerY);
    ctx.restore();

    return this._drawNumberControl(ctx, controlX, centerY, value, digits);
  }

  _buildNumberHitAreas(prefix, bounds, centerY, height, key, digits, min, max, step) {
    const boxY = centerY - height / 2;
    return {
      [`${prefix}Dec`]: {
        bounds: [bounds.dec[0], bounds.dec[1], boxY, height],
        onClick: (_event, _pos, currentNode) => this._changeValue(currentNode, key, -step, digits, min, max),
      },
      [`${prefix}Value`]: {
        bounds: [bounds.value[0], bounds.value[1], boxY, height],
        onClick: (event, _pos, currentNode) => this._promptValue(event, currentNode, key, digits, min, max),
      },
      [`${prefix}Inc`]: {
        bounds: [bounds.inc[0], bounds.inc[1], boxY, height],
        onClick: (_event, _pos, currentNode) => this._changeValue(currentNode, key, step, digits, min, max),
      },
    };
  }

  draw(ctx, node, width, y) {
    this.last_y = y;

    const margin = 10;
    const innerPaddingY = 6;
    const innerY = y + innerPaddingY;
    const innerHeight = this._height - innerPaddingY * 2;
    const topLineY = innerY + 12;
    const toggleX = margin + 10;
    const toggleWidth = 24;
    const toggleHeight = 12;
    const toggleKnobSize = 8;
    const toggleY = topLineY - toggleHeight / 2;
    const toggleKnobX = this.value.on ? toggleX + toggleWidth - toggleKnobSize - 2 : toggleX + 2;
    const toggleKnobY = topLineY - toggleKnobSize / 2;
    const actionsX = width - margin - ACTIONS_WIDTH;
    const nameX = toggleX + toggleWidth + 12;
    const nameWidth = Math.max(120, actionsX - 10 - nameX);

    const controlBoxX = margin + 8;
    const controlBoxY = innerY + 24;
    const controlBoxWidth = width - controlBoxX * 2;
    const controlBoxHeight = 60;
    const labelX = controlBoxX + 12;
    const controlX = controlBoxX + controlBoxWidth - 12 - NUMBER_CONTROL_TOTAL_WIDTH;
    const strengthLineY = controlBoxY + 13;
    const startLineY = strengthLineY + CONTROL_ROW_HEIGHT;
    const endLineY = startLineY + CONTROL_ROW_HEIGHT;

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
    ctx.fillText(fitString(ctx, this.value.controlnet || "None", nameWidth), nameX, topLineY);

    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    ctx.strokeStyle = LiteGraph.WIDGET_OUTLINE_COLOR;
    ctx.beginPath();
    ctx.roundRect(controlBoxX, controlBoxY, controlBoxWidth, controlBoxHeight, isLowQuality() ? [0] : [6]);
    ctx.fill();
    ctx.stroke();

    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(controlBoxX + 8, controlBoxY + 22);
    ctx.lineTo(controlBoxX + controlBoxWidth - 8, controlBoxY + 22);
    ctx.moveTo(controlBoxX + 8, controlBoxY + 40);
    ctx.lineTo(controlBoxX + controlBoxWidth - 8, controlBoxY + 40);
    ctx.stroke();
    ctx.restore();

    const strengthBounds = this._drawLabeledNumberRow(ctx, "Strength", labelX, controlX, strengthLineY, this.value.strength, 2);
    const startBounds = this._drawLabeledNumberRow(ctx, "Start", labelX, controlX, startLineY, this.value.start_percent, 3);
    const endBounds = this._drawLabeledNumberRow(ctx, "End", labelX, controlX, endLineY, this.value.end_percent, 3);

    this.hitAreas = {
      ...this._buildNumberHitAreas("strength", strengthBounds, strengthLineY, CONTROL_ROW_HEIGHT, "strength", 2, 0, 10, 0.05),
      ...this._buildNumberHitAreas("start", startBounds, startLineY, CONTROL_ROW_HEIGHT, "start_percent", 3, 0, this.value.end_percent, 0.01),
      ...this._buildNumberHitAreas("end", endBounds, endLineY, CONTROL_ROW_HEIGHT, "end_percent", 3, this.value.start_percent, 1, 0.01),
    };

    const actions = [
      { key: "up", label: "↑" },
      { key: "down", label: "↓" },
      { key: "remove", label: "×" },
    ];
    ctx.fillStyle = LiteGraph.WIDGET_TEXT_COLOR;
    ctx.textAlign = "center";
    actions.forEach((action, index) => {
      const x = actionsX + index * (ACTION_BUTTON_WIDTH + ACTION_BUTTON_GAP);
      ctx.fillText(action.label, x + ACTION_BUTTON_WIDTH / 2, topLineY);
      this.hitAreas[action.key] = {
        bounds: [x, ACTION_BUTTON_WIDTH, topLineY - 10, 20],
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
      bounds: [toggleX, toggleWidth, toggleY - 4, 20],
      onClick: (_event, _pos, currentNode) => {
        this.value.on = !this.value.on;
        currentNode.setDirtyCanvas(true, true);
      },
    };
    this.hitAreas.controlnet = {
      bounds: [nameX, nameWidth, topLineY - 10, 20],
      onClick: (event, _pos, currentNode) => {
        showControlNetChooser(event, (value) => {
          this.value.controlnet = value;
          currentNode.setDirtyCanvas(true, true);
        });
      },
    };
  }

  serializeValue(node) {
    return {
      on: this.value.on !== false,
      controlnet: this.value.controlnet || "None",
      strength: Number(this.value.strength ?? 1),
      start_percent: Number(this.value.start_percent ?? 0),
      end_percent: Number(this.value.end_percent ?? 1),
      order: getRowWidgets(node).indexOf(this),
      image_input: getImageInputNameForWidget(this),
    };
  }
}
