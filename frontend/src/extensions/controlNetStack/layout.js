import { app } from "/scripts/app.js";

import { moveRowWidget, updateNodeSize as updateSharedNodeSize } from "../shared/stackWidgets/layout.js";

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
  updateSharedNodeSize(node, MIN_NODE_WIDTH);
}

export function moveWidget(node, widget, direction) {
  moveRowWidget(node, widget, direction, getRowWidgets, {
    afterMove: (currentNode) => currentNode._aliceSyncInputOrder?.(),
    updateNodeSize,
  });
}

export function getInputLinkStatus(node, inputName) {
  const input = node.inputs?.find((entry) => entry?.name === inputName);
  return Boolean(input?.link != null);
}
