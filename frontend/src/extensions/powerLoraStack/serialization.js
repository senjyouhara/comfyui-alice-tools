import { applyStrengthModeToRows, ensureStrengthMode } from "./state.js";
import { updateNodeSize } from "./layout.js";
import { AliceAddButtonWidget } from "./widgets/AliceAddButtonWidget.js";
import { AliceHeaderWidget } from "./widgets/AliceHeaderWidget.js";
import { AliceLoraRowWidget } from "./widgets/AliceLoraRowWidget.js";

export function isSerializedRow(value) {
  return value && typeof value === "object" && typeof value.lora === "string";
}

export function clearWidgets(node) {
  if (!Array.isArray(node.widgets)) {
    node.widgets = [];
    return;
  }
  node.widgets.length = 0;
}

export function rebuildWidgets(node, serializedValues = []) {
  clearWidgets(node);
  node._aliceRowCounter = 0;
  node.addCustomWidget(new AliceHeaderWidget());
  for (const value of serializedValues.filter(isSerializedRow)) {
    node._aliceAddRow(value, false);
  }
  node.addCustomWidget(new AliceAddButtonWidget());
  applyStrengthModeToRows(node);
  updateNodeSize(node);
}

export function ensureNodeHelpers(node) {
  if (node._alicePowerLoraReady) {
    return;
  }

  node._alicePowerLoraReady = true;
  node.serialize_widgets = true;
  ensureStrengthMode(node);
  node._aliceRowCounter = 0;

  node._aliceAddRow = function (initialValue = null, markDirty = true) {
    this._aliceRowCounter += 1;
    const widget = new AliceLoraRowWidget(`lora_${this._aliceRowCounter}`, initialValue);
    const addButtonIndex = this.widgets.findIndex((entry) => entry?.name === "__alice_add_button__");
    this.addCustomWidget(widget);
    if (addButtonIndex !== -1) {
      const widgetIndex = this.widgets.indexOf(widget);
      const addButton = this.widgets[addButtonIndex];
      this.widgets.splice(widgetIndex, 1);
      const refreshedAddButtonIndex = this.widgets.indexOf(addButton);
      this.widgets.splice(refreshedAddButtonIndex, 0, widget);
    }
    applyStrengthModeToRows(this);
    updateNodeSize(this);
    if (markDirty) {
      this.setDirtyCanvas(true, true);
    }
    return widget;
  };

  node._aliceRemoveRow = function (widget) {
    const index = this.widgets.indexOf(widget);
    if (index !== -1) {
      this.widgets.splice(index, 1);
      updateNodeSize(this);
      this.setDirtyCanvas(true, true);
    }
  };
}
