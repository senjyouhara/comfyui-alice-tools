export function updateNodeSize(node, minNodeWidth) {
  const computed = node.computeSize();
  const width = Math.max(minNodeWidth, node.size?.[0] ?? 0, computed[0]);
  const height = computed[1];
  if (typeof node.setSize === "function") {
    node.setSize([width, height]);
  } else {
    node.size = [width, height];
  }
}

export function moveRowWidget(node, widget, direction, getRowWidgets, options = {}) {
  const widgets = Array.isArray(node.widgets) ? node.widgets : null;
  if (!widgets) {
    return;
  }

  const rowWidgets = typeof getRowWidgets === "function" ? getRowWidgets(node) : [];
  const rowIndex = rowWidgets.indexOf(widget);
  if (rowIndex === -1) {
    return;
  }

  const targetRowIndex = rowIndex + direction;
  if (targetRowIndex < 0 || targetRowIndex >= rowWidgets.length) {
    return;
  }

  const targetWidget = rowWidgets[targetRowIndex];
  const currentIndex = widgets.indexOf(widget);
  const targetIndex = widgets.indexOf(targetWidget);
  if (currentIndex === -1 || targetIndex === -1) {
    return;
  }

  widgets[currentIndex] = targetWidget;
  widgets[targetIndex] = widget;
  options.afterMove?.(node, widget, targetWidget);
  options.updateNodeSize?.(node);
  node.setDirtyCanvas?.(true, true);
}
