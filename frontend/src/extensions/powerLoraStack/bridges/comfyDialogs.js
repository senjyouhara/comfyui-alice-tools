import { app } from "/scripts/app.js";

import { getAvailableLoras } from "./loraRegistry.js";

function showChooser(event, options, title, callback) {
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
  showChooser(event, loras, "Choose a Lora", (value) => {
    if (typeof value === "string") {
      callback(value);
    }
  });
}
