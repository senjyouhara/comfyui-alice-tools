import { app } from "/scripts/app.js";

import { roundStrength } from "../layout.js";
import { getAvailableLoras } from "./loraRegistry.js";

export function promptForNumber(event, currentValue, onSubmit) {
  app.canvas.prompt(
    "Value",
    currentValue,
    (value) => {
      const numericValue = Number(value);
      if (!Number.isNaN(numericValue) && Number.isFinite(numericValue)) {
        onSubmit(roundStrength(numericValue));
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

export function showLoraChooser(event, callback) {
  const availableLoras = getAvailableLoras();
  if (!availableLoras.length) {
    callback("None");
    return;
  }

  const loras = ["None", ...availableLoras];
  showChooser(event, loras, "Choose a LoRA", (value) => {
    if (typeof value === "string") {
      callback(value);
    }
  });
}
