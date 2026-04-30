export function toNumberOrDefault(value, fallback) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

export function removeWidget(node, widget) {
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

export function clearWidgets(node) {
  if (!Array.isArray(node.widgets)) {
    node.widgets = [];
    return;
  }

  while (node.widgets.length) {
    removeWidget(node, node.widgets[node.widgets.length - 1]);
  }
}

export function moveWidgetBeforeNamedWidget(node, widget, targetName) {
  if (!Array.isArray(node.widgets) || !widget || !targetName) {
    return;
  }

  const targetIndex = node.widgets.findIndex((entry) => entry?.name === targetName);
  if (targetIndex === -1) {
    return;
  }

  const widgetIndex = node.widgets.indexOf(widget);
  if (widgetIndex === -1 || widgetIndex < targetIndex) {
    return;
  }

  node.widgets.splice(widgetIndex, 1);
  const refreshedTargetIndex = node.widgets.findIndex((entry) => entry?.name === targetName);
  if (refreshedTargetIndex === -1) {
    node.widgets.push(widget);
    return;
  }

  node.widgets.splice(refreshedTargetIndex, 0, widget);
}

export function getOrderedSerializedRows(serializedValues = [], isSerializedRow) {
  const values = Array.isArray(serializedValues) ? serializedValues : [];

  return values
    .filter((value, index) => (typeof isSerializedRow === "function" ? isSerializedRow(value, index) : true))
    .map((value, index) => ({ value, index }))
    .sort((left, right) => {
      const leftOrder = Number.isFinite(Number(left.value?.order)) ? Number(left.value.order) : left.index;
      const rightOrder = Number.isFinite(Number(right.value?.order)) ? Number(right.value.order) : right.index;
      return leftOrder - rightOrder;
    })
    .map((entry) => entry.value);
}
