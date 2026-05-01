# PowerLora Add Chooser

## Goal

将 `PowerLoraStack` 的 Add Lora 操作改成与 `AliceControlNetStack` 一致的选择式添加体验：点击 Add Lora 时展示 LoRA 列表选择框，用户选择具体 LoRA 后新增对应行。

## What I already know

* 用户要求 PowerLoraStack 添加操作与 AliceControlNetStack 一样，点击时展示 LoRA 列表选择框。
* 选择后应新增对应 LoRA 行。
* 必须保留 PowerLoraStack 的 strength mode 与序列化行为。
* 不改 Python 后端。
* `ControlNetAddButtonWidget.vue` 当前通过 `StackAddButton` 接收 click event，再调用 `showControlNetChooser(event, callback)`。
* PowerLora 已有 `getAvailableLoras()` 可从 `LiteGraph.registered_node_types.LoraLoader` 读取 LoRA 列表。
* PowerLora 已有 `DEFAULT_ROW_VALUE`，可用于构造新增行初始值。

## Assumptions (temporary)

* 选择框应使用与 ControlNet 相同的 `LiteGraph.ContextMenu` 展示机制。
* 无可用 LoRA 时，为保持现有可用性，仍直接新增默认行。
* 选择 `None` 时不新增行，与 ControlNet 当前选择 `None` 不新增的行为保持一致。

## Open Questions

* None.

## Requirements (evolving)

* MVP 只修改 PowerLoraStack 的 Add Lora 入口，不修改行内 LoRA 选择器。
* 点击 PowerLoraStack 的 Add Lora 按钮时展示 LoRA 列表选择框。
* 有可用 LoRA 时，选择具体 LoRA 后新增一行，行的 `lora` 初始值为选择项。
* 无可用 LoRA 时保留当前行为，直接新增默认行。
* 不改变 row 编辑、strength、strength mode、序列化、后端数据结构。
* 复用现有共享 `StackAddButton`，不新增重复按钮壳。

## Acceptance Criteria (evolving)

* [ ] 点击 Add Lora 时可看到 LoRA 列表选择框。
* [ ] 选择某个 LoRA 后新增一行且该行选中对应 LoRA。
* [ ] 无 LoRA 可用时点击 Add Lora 仍新增默认行。
* [ ] 选择 `None` 不新增行。
* [ ] PowerLoraStack 的 move/remove/strength 编辑和 strength mode 不回归。
* [ ] 保存/重新打开 workflow 后新增行数据恢复正常。
* [ ] `npm run build` 通过。

## Definition of Done (team quality bar)

* Tests added/updated where repository supports it.
* Lint / typecheck / build green.
* No unrelated refactor or backend changes.
* Behavior changes are limited to PowerLoraStack add flow.

## Technical Approach

* Reuse the existing `StackAddButton` wrapper for DOM and event stop behavior.
* Add a PowerLora chooser helper next to `loraRegistry.js`, mirroring ControlNet's `showControlNetChooser` pattern and reusing `LiteGraph.ContextMenu` through the existing `showChooser` helper where possible.
* Update only `PowerLoraAddButtonWidget.vue` business logic: if no LoRA is available, keep direct default add; otherwise show chooser and add `{ ...DEFAULT_ROW_VALUE, lora: value }` for selected non-`None` values.

## Decision (ADR-lite)

**Context**: PowerLora add flow should match AliceControlNetStack without broadening the recent shared widget refactor.  
**Decision**: Implement chooser behavior only in the PowerLora add wrapper and keep row editing / serialization / strength mode unchanged.  
**Consequences**: Minimal behavioral change and low regression risk; chooser helper duplication can be revisited only if more stacks need it.

## Out of Scope (explicit)

* 不改行内 LoRA 选择器。
* 不改 Python 后端。
* 不改 widgets_values 数据结构。
* 不抽象 PowerLora 行组件或 numeric input。
* 不修改 AliceControlNetStack 行为。
* 不修改 lifecycle / registerExtension。

## Technical Notes

* `frontend/src/extensions/controlNetStack/components/ControlNetAddButtonWidget.vue` is the parity reference.
* `frontend/src/extensions/controlNetStack/bridges/comfyDialogs.js` has generic `showChooser(event, options, title, callback)` and ControlNet-specific `showControlNetChooser`.
* `frontend/src/extensions/powerLoraStack/bridges/loraRegistry.js` exposes `getAvailableLoras()`.
* `frontend/src/extensions/powerLoraStack/components/PowerLoraAddButtonWidget.vue` currently calls `node._aliceAddRow?.()` directly.
* `frontend/src/extensions/powerLoraStack/constants.js` exposes `DEFAULT_ROW_VALUE`.
