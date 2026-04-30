import { moveRowWidget, updateNodeSize as updateSharedNodeSize } from "../shared/stackWidgets/layout.js";

import { MIN_NODE_WIDTH } from "./constants.js";

export function roundStrength(value) {
  return Math.round(Number(value) * 100) / 100;
}

export function updateNodeSize(node) {
  updateSharedNodeSize(node, MIN_NODE_WIDTH);
}

export function moveWidget(node, widget, direction) {
  moveRowWidget(node, widget, direction, getRowWidgets, {
    updateNodeSize,
  });
}

export function getRowWidgets(node) {
  return (node.widgets || []).filter((widget) => widget?.__aliceRowWidget === true);
}
