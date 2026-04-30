<script setup>
import { computed } from "vue";

import StackRowActions from "../../shared/stackWidgets/StackRowActions.vue";
import { getAvailableLoras } from "../bridges/loraRegistry.js";
import { moveWidget, roundStrength } from "../layout.js";

const props = defineProps({
  node: {
    type: Object,
    required: true,
  },
  widget: {
    type: Object,
    required: true,
  },
  value: {
    type: Object,
    required: true,
  },
});

const loraOptions = computed(() => ["None", ...getAvailableLoras()]);
const isEnabled = computed(() => props.value.on !== false);
const strengthDisplayValue = computed(() => Number(props.value.strength ?? 1).toFixed(2));

function markDirty() {
  props.node.setDirtyCanvas?.(true, true);
}

function setEnabled(nextValue) {
  props.value.on = Boolean(nextValue);
  markDirty();
}

function setLora(nextValue) {
  props.value.lora = typeof nextValue === "string" && nextValue ? nextValue : "None";
  markDirty();
}

function setStrength(nextValue) {
  const numericValue = Number(nextValue);
  if (Number.isFinite(numericValue)) {
    props.value.strength = roundStrength(numericValue);
  } else {
    props.value.strength = roundStrength(props.value.strength ?? 1);
  }
  markDirty();
}

function adjustStrength(delta) {
  const currentValue = Number(props.value.strength ?? 1);
  props.value.strength = roundStrength(currentValue + delta);
  markDirty();
}

function move(direction) {
  moveWidget(props.node, props.widget, direction);
}

function removeRow() {
  props.node._aliceRemoveRow?.(props.widget);
}
</script>

<template>
  <div class="power-lora-row" @pointerdown.stop @mousedown.stop @click.stop>
    <button
      class="toggle"
      type="button"
      :class="{ 'is-off': !isEnabled }"
      :aria-pressed="isEnabled"
      aria-label="Toggle LoRA row"
      @click="setEnabled(!isEnabled)"
    />

    <select class="lora-select" :value="value.lora || 'None'" @change="setLora($event.target.value)">
      <option v-for="option in loraOptions" :key="option" :value="option">
        {{ option }}
      </option>
    </select>

    <div class="strength-group">
      <button type="button" class="icon-button" aria-label="Decrease strength" @click="adjustStrength(-0.05)">
        <i class="pi pi-minus" aria-hidden="true"></i>
      </button>
      <input
        class="strength-input"
        type="number"
        step="0.05"
        :value="strengthDisplayValue"
        @change="setStrength($event.target.value)"
      />
      <button type="button" class="icon-button" aria-label="Increase strength" @click="adjustStrength(0.05)">
        <i class="pi pi-plus" aria-hidden="true"></i>
      </button>
    </div>

    <StackRowActions @move-up="move(-1)" @move-down="move(1)" @remove="removeRow" />
  </div>
</template>

<style scoped lang="scss">
.strength-input::-webkit-outer-spin-button,
.strength-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.strength-input {
  -moz-appearance: textfield; /* Firefox 兼容 */
}

.power-lora-row {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 34px;
  padding: 4px 10px;
  border: 1px solid #4a5568;
  border-radius: 8px;
  background: #1f2937;
  color: #e5e7eb;
  font-size: 12px;
}

.toggle,
.icon-button,
.lora-select,
.strength-input {
  border: 1px solid #4a5568;
  border-radius: 6px;
  background: #111827;
  color: inherit;
  font: inherit;
}

.toggle,
.icon-button {
  cursor: pointer;
}

.toggle {
  position: relative;
  width: 40px;
  height: 22px;
  flex-shrink: 0;
  padding: 0;
  border: none;
  border-radius: 999px;
  background: #2563eb;
  transition: background 0.2s ease;
}

.toggle::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ffffff;
  transform: translateX(18px);
  transition: transform 0.2s ease;
}

.toggle.is-off {
  background: #4b5563;
}

.toggle.is-off::after {
  transform: translateX(0);
}

.lora-select {
  flex: 1 1 auto;
  min-width: 0;
  padding: 2px 4px;
  height: 24px;
}

.strength-group {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.icon-button {
  width: 24px;
  height: 24px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.icon-button :deep(.pi) {
  font-size: 12px;
}

.strength-input {
  width: 60px;
  padding: 4px 6px;
  text-align: center;
}

.strength-input::-webkit-outer-spin-button,
.strength-input::-webkit-inner-spin-button {
  margin: 0;
}
</style>
