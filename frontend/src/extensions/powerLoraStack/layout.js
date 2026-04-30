import { MIN_NODE_WIDTH } from "./constants.js";

export function roundStrength(value) {
  return Math.round(Number(value) * 100) / 100;
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
  updateNodeSize(node);
  node.setDirtyCanvas?.(true, true);
}

export function getRowWidgets(node) {
  return (node.widgets || []).filter((widget) => widget?.__aliceRowWidget === true);
}
