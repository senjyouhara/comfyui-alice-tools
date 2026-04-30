import { reactive } from "vue";

import { createVueNodeWidget } from "../../composables/createVueNodeWidget.js";
import { DEFAULT_ROW_VALUE } from "./constants.js";
import { getRowWidgets, updateNodeSize } from "./layout.js";
import { applyStrengthModeToRows, ensureStrengthMode } from "./state.js";
import PowerLoraAddButtonWidget from "./components/PowerLoraAddButtonWidget.vue";
import PowerLoraRowWidget from "./components/PowerLoraRowWidget.vue";

const ADD_BUTTON_NAME = "__alice_add_button__";
const ROW_WIDGET_HEIGHT = 42;
const ADD_BUTTON_WIDGET_HEIGHT = 35;

function toNumberOrDefault(value, fallback) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

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

function removeWidget(node, widget) {
  if (!widget) {
    return;
  }

  if (typeof node.removeWidget === "function") {
    try {
      node.removeWidget(widget);
      return;
    } catch {
      const index = node.widgets?.indexOf(widget) ?? -1;
      if (index !== -1) {
        node.removeWidget(index);
        return;
      }
    }
  }

  widget.onRemove?.();
  const index = node.widgets?.indexOf(widget) ?? -1;
  if (index !== -1) {
    node.widgets.splice(index, 1);
  }
}

function moveWidgetBeforeAddButton(node, widget) {
  const addButtonIndex = node.widgets.findIndex((entry) => entry?.name === ADD_BUTTON_NAME);
  if (addButtonIndex === -1) {
    return;
  }

  const widgetIndex = node.widgets.indexOf(widget);
  if (widgetIndex === -1 || widgetIndex < addButtonIndex) {
    return;
  }

  node.widgets.splice(widgetIndex, 1);
  const refreshedAddButtonIndex = node.widgets.findIndex((entry) => entry?.name === ADD_BUTTON_NAME);
  node.widgets.splice(refreshedAddButtonIndex, 0, widget);
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

function getSerializedRows(serializedValues = []) {
  return serializedValues
    .filter(isSerializedRow)
    .map((value, index) => ({ value, index }))
    .sort((left, right) => {
      const leftOrder = Number.isFinite(Number(left.value?.order)) ? Number(left.value.order) : left.index;
      const rightOrder = Number.isFinite(Number(right.value?.order)) ? Number(right.value.order) : right.index;
      return leftOrder - rightOrder;
    })
    .map((entry) => entry.value);
}

export function isSerializedRow(value) {
  return value && typeof value === "object" && typeof value.lora === "string";
}

export function clearWidgets(node) {
  if (!Array.isArray(node.widgets)) {
    node.widgets = [];
    return;
  }

  while (node.widgets.length) {
    removeWidget(node, node.widgets[node.widgets.length - 1]);
  }
}

export function rebuildWidgets(node, serializedValues = []) {
  clearWidgets(node);
  ensureStrengthMode(node);
  node._aliceRowCounter = 0;
  for (const value of getSerializedRows(serializedValues)) {
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
    moveWidgetBeforeAddButton(this, widget);
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
