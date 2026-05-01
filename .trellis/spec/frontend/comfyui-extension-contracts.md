# ComfyUI Extension Contracts

> Executable contracts for the Vue/ComfyUI frontend extension layer.

---

## Scenario: Frontend extensions and serialized dynamic row widgets

### 1. Scope / Trigger

Use this spec whenever a change touches:

- `frontend/src/extensions/**` registration, lifecycle hooks, layout, serialization, or bridge code.
- Vue-backed dynamic widgets created with `createVueNodeWidget()`.
- Serialized row fields consumed by Python stack nodes.
- `frontend/vite.config.js` build output or ComfyUI external imports.
- Root `WEB_DIRECTORY` behavior through frontend bundle directory names.

These changes are cross-layer because ComfyUI UI state becomes Python node input payloads.

---

### 2. Signatures

#### Extension registration

```javascript
import { app } from "/scripts/app.js";

app.registerExtension({
  name: "Alice.PowerLoraStack",
  beforeRegisterNodeDef,
});
```

Current extension names:

- `Alice.PowerLoraStack`
- `Alice.ControlNetStack`
- `Alice.ModelLoaderResolution`

#### Lifecycle hook

```javascript
function beforeRegisterNodeDef(nodeType, nodeData) {
  if (nodeData.name !== NODE_NAME) {
    return;
  }

  const onNodeCreated = nodeType.prototype.onNodeCreated;
  nodeType.prototype.onNodeCreated = function () {
    const result = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;
    ensureNodeHelpers(this);
    return result;
  };
}
```

Rules:

- Check `nodeData.name` before mutating prototypes.
- Preserve original lifecycle methods.
- Call the original method first.
- Return the original result.

#### Vue DOM widget bridge

```javascript
createVueNodeWidget({
  node,
  name,
  type,
  component,
  props,
  getValue,
  setValue,
  serializeValue,
  getMinHeight,
  getMaxHeight,
  widgetProps,
});
```

The bridge must:

- Create a DOM container.
- Call `node.addDOMWidget()`.
- Mount a Vue app into the container.
- Assign `widget.serializeValue` when provided.
- Unmount Vue in `widget.onRemove()`.

---

### 3. Contracts

#### Build output

`frontend/vite.config.js` currently defines:

| Mode | Output directory | Minify | Entry file |
|------|------------------|--------|------------|
| `dev` | `../web_version/dev` | `false` | `alice-tools.js` |
| default/prod | `../web_version/v1` | `terser` | `alice-tools.js` |

Other required build settings:

- `base: "./"`.
- Externalize `"/scripts/app.js"` so ComfyUI provides it at runtime.
- Inject CSS into JS with `vite-plugin-css-injected-by-js`.
- Alias `@` to `frontend/src`.

The root Python package selects `./web_version/v1` by default and may select `./web_version/<COMFYUI_ALICE_TOOLS_WEB_VERSION>` when that directory exists.

#### Frontend entrypoints

- `frontend/src/main.js` imports `@/extensions`, creates the Vue app, installs PrimeVue and Pinia, and mounts into `#comfyui-alice-tools-root`.
- `frontend/src/extensions/index.js` imports extension modules for side effects.

#### LoRA row widget payload

Frontend serialization in `frontend/src/extensions/powerLoraStack/serialization.js` emits:

| Field | Type | Backend expectation |
|-------|------|---------------------|
| `on` | boolean | Required boolean |
| `lora` | string | Required non-empty filename or `"None"` when disabled |
| `strength` | number | Required model strength |
| `order` | number | Used for row ordering |

Current UI state also tracks `strengthTwo`, and backend accepts `strength_clip`, then `strengthTwo`, then falls back to `strength` for CLIP strength. If frontend emits a separate CLIP strength field later, prefer `strength_clip` and update backend + spec together.

#### ControlNet row widget payload

Frontend serialization in `frontend/src/extensions/controlNetStack/serialization.js` emits:

| Field | Type | Backend expectation |
|-------|------|---------------------|
| `on` | boolean | Required boolean |
| `controlnet` | string | Required non-empty filename or `"None"` when disabled |
| `strength` | number | Required strength |
| `start_percent` | number | Required, clamped in UI to `[0, 1]`, revalidated in Python |
| `end_percent` | number | Required, clamped in UI to `[0, 1]`, revalidated in Python |
| `order` | number | Used for row ordering |
| `image_input` | string | Binds serialized row to dynamic IMAGE input name |

ControlNet row helpers must create/remove matching `IMAGE` inputs and keep input order synchronized with row order.

#### Dynamic node helpers

Stack extension helpers currently attach Alice-specific methods/properties to ComfyUI node instances:

- Power LoRA: `_alicePowerLoraReady`, `_aliceRowCounter`, `_aliceAddRow`, `_aliceRemoveRow`.
- ControlNet: `_aliceControlNetReady`, `_aliceRowCounter`, `_aliceSyncInputOrder`, `_aliceAddRow`, `_aliceRemoveRow`.
- Model loader resolution: `_aliceResolutionWidgetsReady`, `_aliceResolutionWidgetsUpdateQueued`, `_alicePendingResolutionValue`.

Use this prefix pattern for project-owned node state to avoid collisions with ComfyUI/LiteGraph internals.

---

### 4. Validation & Error Matrix

| Condition | Frontend behavior | Backend expectation |
|-----------|-------------------|---------------------|
| Extension sees unrelated `nodeData.name` | Return without mutation | No backend effect |
| Existing node lifecycle method exists | Call original first and return its result | Existing ComfyUI behavior preserved |
| `info.widgets_values` is missing/non-array | Rebuild dynamic widgets with `[]` | Empty stack is valid |
| Row value numeric field is invalid in UI state | Use `toNumberOrDefault()` fallback during UI normalization | Python still validates/coerces serialized values |
| ControlNet percent order is inverted in UI state | Normalize to `start_percent <= end_percent` | Python rejects inverted payload if it reaches backend |
| ControlNet row removed | Remove matching dynamic `IMAGE` input | Backend does not receive stale image binding |
| Widget removed | Vue app unmounts | No leaked Vue app in ComfyUI DOM widget lifecycle |
| Resolution widgets unavailable initially | Retry with `requestAnimationFrame` up to current limit | Backend still receives resolution/width/height inputs from ComfyUI |

---

### 5. Good/Base/Bad Cases

#### Good

- `Alice.PowerLoraStack` filters `nodeData.name === "AlicePowerLoraStack"`, wraps lifecycle hooks, installs helpers once, rebuilds serialized rows, and marks canvas dirty after row changes.
- `Alice.ControlNetStack` adds `image_N` inputs for rows, serializes `image_input`, and removes the matching input when a row is removed.
- `Alice.ModelLoaderResolution` hides width/height widgets for preset resolutions and shows them only when resolution is `"自定义"`.

#### Base

- New stack node with no serialized values creates only the Add button widget and returns an empty backend stack.
- Reloaded graph with serialized row values restores row order using `order` and falls back to original index when `order` is absent.
- Production build writes `web_version/v1/alice-tools.js`.

#### Bad

- Mutating every node type in `beforeRegisterNodeDef` instead of filtering by `NODE_NAME` breaks unrelated ComfyUI nodes.
- Serializing a row field that Python does not validate creates a hidden cross-layer drift.
- Removing a ControlNet row widget without removing its dynamic `IMAGE` input leaves stale graph inputs.

---

### 6. Tests Required

There is no configured frontend test runner today. Current available check is:

```text
cd frontend && npm run build
```

For changes to this layer, verify these assertion points manually or with future tests:

- Vite build succeeds and outputs `alice-tools.js` under the configured `web_version` directory.
- Extension registration names remain unique and use the `Alice.` prefix.
- Lifecycle wrappers preserve original `onNodeCreated` and `configure` behavior.
- Vue widgets unmount when removed.
- LoRA rows serialize fields expected by `py/lora_stack.py`.
- ControlNet rows serialize fields expected by `py/controlnet_stack.py` and keep dynamic `IMAGE` inputs synchronized.
- Resolution widget visibility updates on creation, configure, direct value assignment, and callback-triggered changes.

---

### 7. Wrong vs Correct

#### Wrong

```javascript
app.registerExtension({
  name: "Alice.PowerLoraStack",
  beforeRegisterNodeDef(nodeType) {
    nodeType.prototype.onNodeCreated = function () {
      rebuildWidgets(this, []);
    };
  },
});
```

This mutates every ComfyUI node type and discards original lifecycle behavior.

#### Correct

```javascript
export function beforeRegisterNodeDef(nodeType, nodeData) {
  if (nodeData.name !== NODE_NAME) {
    return;
  }

  const onNodeCreated = nodeType.prototype.onNodeCreated;
  nodeType.prototype.onNodeCreated = function () {
    const result = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;
    ensureNodeHelpers(this);
    return result;
  };
}
```

#### Wrong

```javascript
serializeValue: () => ({
  modelName: value.controlnet,
})
```

This creates a frontend payload Python does not understand.

#### Correct

```javascript
serializeValue: (currentNode) => ({
  on: value.on !== false,
  controlnet: value.controlnet || "None",
  strength: Number(value.strength ?? 1),
  start_percent: Number(value.start_percent ?? 0),
  end_percent: Number(value.end_percent ?? 1),
  order: getRowWidgets(currentNode).indexOf(widget),
  image_input: getImageInputNameForWidget(widget) || imageInputName,
})
```
