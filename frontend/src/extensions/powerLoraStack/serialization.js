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
import { getRowWidgets, updateNodeSize } from "./layout.js";
import { applyStrengthModeToRows, ensureStrengthMode } from "./state.js";
import PowerLoraAddButtonWidget from "./components/PowerLoraAddButtonWidget.vue";
import PowerLoraRowWidget from "./components/PowerLoraRowWidget.vue";

const ADD_BUTTON_NAME = "__alice_add_button__";
const ROW_WIDGET_HEIGHT = 42;
const ADD_BUTTON_WIDGET_HEIGHT = 35;

function normalizeRowValue(initialValue = null) {
  return {
    on: initialValue?.on !== false,
    lora: typeof initialValue?.lora === "string" ? initialValue.lora : DEFAULT_ROW_VALUE.lora,
    strength: toNumberOrDefault(initialValue?.strength, DEFAULT_ROW_VALUE.strength),
    strengthTwo: initialValue?.strengthTwo ?? DEFAULT_ROW_VALUE.strengthTwo,
  };
}

function replaceRowValue(target, nextValue) {
  Object.assign(target, normalizeRowValue(nextValue));
}

function createRowWidget(node, name, initialValue) {
  const value = reactive(normalizeRowValue(initialValue));
  let widget = null;

  widget = createVueNodeWidget({
    node,
    name,
    type: "power-lora-row",
    component: PowerLoraRowWidget,
    props: { value },
    getValue: () => value,
    setValue: (nextValue) => replaceRowValue(value, nextValue),
    serializeValue: (currentNode) => ({
      on: value.on !== false,
      lora: value.lora || "None",
      strength: Number(value.strength ?? 1),
      order: getRowWidgets(currentNode).indexOf(widget),
    }),
    getMinHeight: () => ROW_WIDGET_HEIGHT,
    getMaxHeight: () => ROW_WIDGET_HEIGHT,
    widgetProps: {
      __aliceRowWidget: true,
    },
  });

  return widget;
}

function createAddButtonWidget(node) {
  return createVueNodeWidget({
    node,
    name: ADD_BUTTON_NAME,
    type: "power-lora-add-button",
    component: PowerLoraAddButtonWidget,
    serialize: false,
    getValue: () => "",
    setValue: () => {},
    getMinHeight: () => ADD_BUTTON_WIDGET_HEIGHT,
    getMaxHeight: () => ADD_BUTTON_WIDGET_HEIGHT,
  });
}

export function isSerializedRow(value) {
  return value && typeof value === "object" && typeof value.lora === "string";
}

export function clearWidgets(node) {
  clearStackWidgets(node);
}

export function rebuildWidgets(node, serializedValues = []) {
  clearWidgets(node);
  ensureStrengthMode(node);
  node._aliceRowCounter = 0;
  for (const value of getOrderedSerializedRows(serializedValues, isSerializedRow)) {
    node._aliceAddRow(value, false);
  }
  createAddButtonWidget(node);
  applyStrengthModeToRows(node);
  updateNodeSize(node);
}

export function ensureNodeHelpers(node) {
  if (node._alicePowerLoraReady) {
    return;
  }

  node._alicePowerLoraReady = true;
  node.serialize_widgets = true;
  node._aliceRowCounter = 0;
  ensureStrengthMode(node);

  node._aliceAddRow = function (initialValue = null, markDirty = true) {
    this._aliceRowCounter += 1;
    const widget = createRowWidget(this, `lora_${this._aliceRowCounter}`, initialValue);
    moveWidgetBeforeNamedWidget(this, widget, ADD_BUTTON_NAME);
    applyStrengthModeToRows(this);
    updateNodeSize(this);
    if (markDirty) {
      this.setDirtyCanvas?.(true, true);
    }
    return widget;
  };

  node._aliceRemoveRow = function (widget) {
    removeWidget(this, widget);
    updateNodeSize(this);
    this.setDirtyCanvas?.(true, true);
  };
}
