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

export function roundStrength(value) {
  return Math.round(Number(value) * 100) / 100;
}

export function updateNodeSize(node) {
  const computed = node.computeSize();
  const width = Math.max(MIN_NODE_WIDTH, node.size?.[0] ?? 0, computed[0]);
  const height = Math.max(node.size?.[1] ?? 0, computed[1]);
  if (typeof node.setSize === "function") {
    node.setSize([width, height]);
  } else {
    node.size = [width, height];
  }
}

export function moveWidget(node, widget, direction) {
  const currentIndex = node.widgets.indexOf(widget);
  if (currentIndex === -1) {
    return;
  }

  let targetIndex = currentIndex + direction;
  while (targetIndex >= 0 && targetIndex < node.widgets.length) {
    if (node.widgets[targetIndex]?.__aliceRowWidget === true) {
      const targetWidget = node.widgets[targetIndex];
      node.widgets[targetIndex] = widget;
      node.widgets[currentIndex] = targetWidget;
      node.setDirtyCanvas(true, true);
      return;
    }
    targetIndex += direction;
  }
}

export function getRowWidgets(node) {
  return (node.widgets || []).filter((widget) => widget?.__aliceRowWidget === true);
}
