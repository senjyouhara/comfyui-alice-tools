import {
  STRENGTH_MODE_KEY,
  STRENGTH_MODE_SEPARATE,
  STRENGTH_MODE_SINGLE,
} from "./constants.js";
import { getRowWidgets, updateNodeSize } from "./layout.js";

export function getStrengthMode(node) {
  const mode = node.properties?.[STRENGTH_MODE_KEY];
  return mode === STRENGTH_MODE_SEPARATE ? STRENGTH_MODE_SEPARATE : STRENGTH_MODE_SINGLE;
}

export function ensureStrengthMode(node) {
  node.properties = node.properties || {};
  if (node.properties[STRENGTH_MODE_KEY] !== STRENGTH_MODE_SEPARATE) {
    node.properties[STRENGTH_MODE_KEY] = STRENGTH_MODE_SINGLE;
  }
}

export function applyStrengthModeToRows(node) {
  for (const widget of getRowWidgets(node)) {
    if (getStrengthMode(node) === STRENGTH_MODE_SEPARATE) {
      widget.value.strengthTwo = widget.value.strengthTwo ?? widget.value.strength;
    }
  }
}

export function toggleStrengthMode(node) {
  ensureStrengthMode(node);
  node.properties[STRENGTH_MODE_KEY] =
    getStrengthMode(node) === STRENGTH_MODE_SEPARATE ? STRENGTH_MODE_SINGLE : STRENGTH_MODE_SEPARATE;
  applyStrengthModeToRows(node);
  updateNodeSize(node);
  node.setDirtyCanvas(true, true);
}
