import { app } from "/scripts/app.js";

import { MIN_NODE_WIDTH } from "./constants.js";

export function fitString(ctx, value, maxWidth) {
  const text = String(value ?? "");
  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }

  const ellipsis = "…";
  let output = text;
  while (output.length > 0 && ctx.measureText(output + ellipsis).width > maxWidth) {
    output = output.slice(0, -1);
  }
  return output ? output + ellipsis : ellipsis;
}

export function isLowQuality() {
  return (app.canvas?.ds?.scale ?? 1) <= 0.5;
}

export function roundValue(value, digits = 2) {
  const multiplier = 10 ** digits;
  return Math.round(Number(value) * multiplier) / multiplier;
}

export function getRowWidgets(node) {
  return (node.widgets || []).filter((widget) => widget?.__aliceControlNetRowWidget === true);
}

export function getImageInputNameForWidget(widget) {
  return widget?.value?.image_input || widget?.imageInputName || null;
}

export function updateNodeSize(node) {
  const computed = node.computeSize();
  const width = Math.max(MIN_NODE_WIDTH, node.size?.[0] ?? 0, computed[0]);
  const height = computed[1];
  if (typeof node.setSize === "function") {
    node.setSize([width, height]);
  } else {
    node.size = [width, height];
  }
}

export function moveWidget(node, widget, direction) {
  const rowWidgets = getRowWidgets(node);
  const rowIndex = rowWidgets.indexOf(widget);
  if (rowIndex === -1) {
    return;
  }

  const targetRowIndex = rowIndex + direction;
  if (targetRowIndex < 0 || targetRowIndex >= rowWidgets.length) {
    return;
  }

  const targetWidget = rowWidgets[targetRowIndex];
  const currentIndex = node.widgets.indexOf(widget);
  const targetIndex = node.widgets.indexOf(targetWidget);
  if (currentIndex === -1 || targetIndex === -1) {
    return;
  }

  node.widgets[currentIndex] = targetWidget;
  node.widgets[targetIndex] = widget;
  node._aliceSyncInputOrder?.();
  updateNodeSize(node);
  node.setDirtyCanvas?.(true, true);
}

export function getInputLinkStatus(node, inputName) {
  const input = node.inputs?.find((entry) => entry?.name === inputName);
  return Boolean(input?.link != null);
}
