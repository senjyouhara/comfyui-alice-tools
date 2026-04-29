import { app } from "/scripts/app.js";

import { roundValue } from "../layout.js";
import { getAvailableControlNets } from "./controlnetRegistry.js";

export function promptForNumber(event, currentValue, digits, onSubmit) {
  app.canvas.prompt(
    "Value",
    currentValue,
    (value) => {
      const numericValue = Number(value);
      if (!Number.isNaN(numericValue) && Number.isFinite(numericValue)) {
        onSubmit(roundValue(numericValue, digits));
      }
    },
    event,
  );
}

export function showChooser(event, options, title, callback) {
  new LiteGraph.ContextMenu(options, {
    event,
    title,
    className: "dark",
    callback,
    scale: Math.max(1, app.canvas?.ds?.scale ?? 1),
  });
}

export function showControlNetChooser(event, callback) {
  const availableControlNets = getAvailableControlNets();
  if (!availableControlNets.length) {
    callback("None");
    return;
  }

  const controlNets = ["None", ...availableControlNets];
  showChooser(event, controlNets, "Choose a ControlNet", (value) => {
    if (typeof value === "string") {
      callback(value);
    }
  });
}
