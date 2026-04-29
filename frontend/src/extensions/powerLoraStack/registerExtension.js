import { app } from "/scripts/app.js";

import { beforeRegisterNodeDef } from "./lifecycle.js";

app.registerExtension({
  name: "Alice.PowerLoraStack",
  beforeRegisterNodeDef,
});
