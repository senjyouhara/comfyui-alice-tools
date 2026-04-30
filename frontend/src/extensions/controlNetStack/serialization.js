import { reactive } from "vue";

import { createVueNodeWidget } from "../../composables/createVueNodeWidget.js";
import {
  clearWidgets as clearStackWidgets,
  getOrderedSerializedRows,
  moveWidgetBeforeNamedWidget,
  removeWidget,
  toNumberOrDefault,
} from "../shared/stackWidgets/serialization.js";
import { DEFAULT_ROW_VALUE } from "./constants.js";
import { getImageInputNameForWidget, getRowWidgets, updateNodeSize } from "./layout.js";
import ControlNetAddButtonWidget from "./components/ControlNetAddButtonWidget.vue";
import ControlNetRowWidget from "./components/ControlNetRowWidget.vue";

const ADD_BUTTON_NAME = "__alice_controlnet_add_button__";
const ROW_WIDGET_HEIGHT = 80;
const ADD_BUTTON_WIDGET_HEIGHT = 34;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeRowValue(initialValue = null, imageInputName = null) {
  const startPercent = clamp(
    toNumberOrDefault(initialValue?.start_percent, DEFAULT_ROW_VALUE.start_percent),
    0,
    1,
  );
  const endPercent = clamp(
    toNumberOrDefault(initialValue?.end_percent, DEFAULT_ROW_VALUE.end_percent),
    0,
    1,
  );
  const resolvedImageInputName =
    typeof initialValue?.image_input === "string" && initialValue.image_input
      ? initialValue.image_input
      : imageInputName;

  return {
    on: initialValue?.on !== false,
    controlnet:
      typeof initialValue?.controlnet === "string" ? initialValue.controlnet : DEFAULT_ROW_VALUE.controlnet,
    strength: toNumberOrDefault(initialValue?.strength, DEFAULT_ROW_VALUE.strength),
    start_percent: Math.min(startPercent, endPercent),
    end_percent: Math.max(startPercent, endPercent),
    image_input: resolvedImageInputName,
  };
}

function replaceRowValue(target, nextValue) {
  Object.assign(target, normalizeRowValue(nextValue, target?.image_input || nextValue?.image_input || null));
}

function createRowWidget(node, name, imageInputName, initialValue) {
  const value = reactive(normalizeRowValue(initialValue, imageInputName));
  let widget = null;

  widget = createVueNodeWidget({
    node,
    name,
    type: "controlnet-row",
    component: ControlNetRowWidget,
    props: { value },
    getValue: () => value,
    setValue: (nextValue) => replaceRowValue(value, nextValue),
    serializeValue: (currentNode) => ({
      on: value.on !== false,
      controlnet: value.controlnet || "None",
      strength: Number(value.strength ?? 1),
      start_percent: Number(value.start_percent ?? 0),
      end_percent: Number(value.end_percent ?? 1),
      order: getRowWidgets(currentNode).indexOf(widget),
      image_input: getImageInputNameForWidget(widget) || imageInputName,
    }),
    getMinHeight: () => ROW_WIDGET_HEIGHT,
    getMaxHeight: () => ROW_WIDGET_HEIGHT,
    widgetProps: {
      __aliceControlNetRowWidget: true,
      imageInputName,
    },
  });

  return widget;
}

function createAddButtonWidget(node) {
  return createVueNodeWidget({
    node,
    name: ADD_BUTTON_NAME,
    type: "controlnet-add-button",
    component: ControlNetAddButtonWidget,
    serialize: false,
    getValue: () => "",
    setValue: () => {},
    getMinHeight: () => ADD_BUTTON_WIDGET_HEIGHT,
    getMaxHeight: () => ADD_BUTTON_WIDGET_HEIGHT,
  });
}

export function isSerializedRow(value) {
  return value && typeof value === "object" && typeof value.controlnet === "string";
}

export function clearWidgets(node) {
  clearStackWidgets(node);
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
    const imageInputName = getImageInputNameForWidget(widget);
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
  for (const value of getOrderedSerializedRows(serializedValues, isSerializedRow)) {
    node._aliceAddRow(value, false);
  }
  createAddButtonWidget(node);
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

    const widget = createRowWidget(
      this,
      `controlnet_${this._aliceRowCounter}`,
      imageInputName,
      initialValue,
    );
    moveWidgetBeforeNamedWidget(this, widget, ADD_BUTTON_NAME);

    this._aliceSyncInputOrder?.();
    updateNodeSize(this);
    if (markDirty) {
      this.setDirtyCanvas?.(true, true);
    }
    return widget;
  };

  node._aliceRemoveRow = function (widget) {
    const inputName = getImageInputNameForWidget(widget);
    if (inputName && Array.isArray(this.inputs)) {
      const inputIndex = this.inputs.findIndex((entry) => entry?.name === inputName);
      if (inputIndex !== -1) {
        this.removeInput?.(inputIndex);
      }
    }

    removeWidget(this, widget);
    syncInputOrderToRows(this);
    updateNodeSize(this);
    this.setDirtyCanvas?.(true, true);
  };
}
