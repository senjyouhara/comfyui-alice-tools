import { updateNodeSize } from "./layout.js";
import { AliceAddButtonWidget } from "./widgets/AliceAddButtonWidget.js";
import { AliceControlNetRowWidget } from "./widgets/AliceControlNetRowWidget.js";

export function isSerializedRow(value) {
  return value && typeof value === "object" && typeof value.controlnet === "string";
}

export function clearWidgets(node) {
  if (!Array.isArray(node.widgets)) {
    node.widgets = [];
    return;
  }
  node.widgets.length = 0;
}

export function clearDynamicInputs(node) {
  if (!Array.isArray(node.inputs)) {
    node.inputs = [];
    return;
  }

  for (let index = node.inputs.length - 1; index >= 0; index -= 1) {
    const input = node.inputs[index];
    if (input?.name?.startsWith("image_")) {
      node.removeInput?.(index);
    }
  }
}

function syncInputOrderToRows(node) {
  if (!Array.isArray(node.inputs)) {
    return;
  }

  const imageInputs = node.inputs.filter((input) => input?.name?.startsWith("image_"));
  const fixedInputs = node.inputs.filter((input) => !input?.name?.startsWith("image_"));
  const imageInputsByName = new Map(imageInputs.map((input) => [input.name, input]));
  const orderedImageInputs = [];
  for (const widget of node.widgets || []) {
    const imageInputName = widget?.value?.image_input || widget?.imageInputName;
    if (!imageInputName) {
      continue;
    }

    const input = imageInputsByName.get(imageInputName);
    if (input) {
      orderedImageInputs.push(input);
      imageInputsByName.delete(imageInputName);
    }
  }

  node.inputs = [...fixedInputs, ...orderedImageInputs, ...imageInputsByName.values()];
}

export function rebuildWidgets(node, serializedValues = []) {
  clearWidgets(node);
  clearDynamicInputs(node);
  node._aliceRowCounter = 0;
  for (const value of serializedValues.filter(isSerializedRow)) {
    node._aliceAddRow(value, false);
  }
  node.addCustomWidget(new AliceAddButtonWidget());
  syncInputOrderToRows(node);
  updateNodeSize(node);
}

export function ensureNodeHelpers(node) {
  if (node._aliceControlNetReady) {
    return;
  }

  node._aliceControlNetReady = true;
  node.serialize_widgets = true;
  node._aliceRowCounter = 0;
  node._aliceSyncInputOrder = () => syncInputOrderToRows(node);

  node._aliceAddRow = function (initialValue = null, markDirty = true) {
    this._aliceRowCounter += 1;
    const imageInputName = initialValue?.image_input || `image_${this._aliceRowCounter}`;
    this.addInput?.(imageInputName, "IMAGE");

    const widget = new AliceControlNetRowWidget(
      `controlnet_${this._aliceRowCounter}`,
      imageInputName,
      initialValue,
    );
    const addButtonIndex = this.widgets.findIndex((entry) => entry?.name === "__alice_controlnet_add_button__");
    this.addCustomWidget(widget);
    if (addButtonIndex !== -1) {
      const widgetIndex = this.widgets.indexOf(widget);
      const addButton = this.widgets[addButtonIndex];
      this.widgets.splice(widgetIndex, 1);
      const refreshedAddButtonIndex = this.widgets.indexOf(addButton);
      this.widgets.splice(refreshedAddButtonIndex, 0, widget);
    }

    this._aliceSyncInputOrder?.();
    updateNodeSize(this);
    if (markDirty) {
      this.setDirtyCanvas(true, true);
    }
    return widget;
  };

  node._aliceRemoveRow = function (widget) {
    const inputName = widget?.value?.image_input || widget?.imageInputName;
    if (inputName && Array.isArray(this.inputs)) {
      const inputIndex = this.inputs.findIndex((entry) => entry?.name === inputName);
      if (inputIndex !== -1) {
        this.removeInput?.(inputIndex);
      }
    }

    const widgetIndex = this.widgets.indexOf(widget);
    if (widgetIndex !== -1) {
      this.widgets.splice(widgetIndex, 1);
    }

    syncInputOrderToRows(this);
    updateNodeSize(this);
    this.setDirtyCanvas(true, true);
  };
};
