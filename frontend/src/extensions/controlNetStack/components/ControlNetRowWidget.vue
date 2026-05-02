<script setup>
import { computed, onMounted, ref } from "vue";

import StackRowActions from "../../shared/stackWidgets/StackRowActions.vue";
import {
  getAvailableControlNets,
  getControlNetPath,
  loadControlNetPathMap,
} from "../bridges/controlnetRegistry.js";
import { moveWidget, roundValue } from "../layout.js";

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

const pathMapVersion = ref(0);
const controlNetOptions = computed(() => ["None", ...getAvailableControlNets()]);
const selectTitle = computed(() => getControlNetOptionTitle(props.value.controlnet));
const isEnabled = computed(() => props.value.on !== false);
const strengthDisplayValue = computed(() => Number(props.value.strength ?? 1).toFixed(2));
const startPercentDisplayValue = computed(() => Number(props.value.start_percent ?? 0).toFixed(3));
const endPercentDisplayValue = computed(() => Number(props.value.end_percent ?? 1).toFixed(3));

function getControlNetOptionTitle(option) {
  pathMapVersion.value;
  return getControlNetPath(option);
}

onMounted(async () => {
  await loadControlNetPathMap();
  pathMapVersion.value += 1;
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function markDirty() {
  props.node.setDirtyCanvas?.(true, true);
}

function setEnabled(nextValue) {
  props.value.on = Boolean(nextValue);
  markDirty();
}

function setControlNet(nextValue) {
  props.value.controlnet = typeof nextValue === "string" && nextValue ? nextValue : "None";
  markDirty();
}

function setStrength(nextValue) {
  const numericValue = Number(nextValue);
  if (Number.isFinite(numericValue)) {
    props.value.strength = roundValue(Math.max(0, numericValue), 2);
  } else {
    props.value.strength = roundValue(Number(props.value.strength ?? 1), 2);
  }
  markDirty();
}

function setStartPercent(nextValue) {
  const numericValue = Number(nextValue);
  const nextStartPercent = Number.isFinite(numericValue) ? numericValue : Number(props.value.start_percent ?? 0);
  props.value.start_percent = roundValue(clamp(nextStartPercent, 0, Number(props.value.end_percent ?? 1)), 3);
  markDirty();
}

function setEndPercent(nextValue) {
  const numericValue = Number(nextValue);
  const nextEndPercent = Number.isFinite(numericValue) ? numericValue : Number(props.value.end_percent ?? 1);
  props.value.end_percent = roundValue(clamp(nextEndPercent, Number(props.value.start_percent ?? 0), 1), 3);
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
  <div class="controlnet-row" @pointerdown.stop @mousedown.stop @click.stop>
    <div class="top-row">
      <button
        class="toggle"
        type="button"
        :class="{ 'is-off': !isEnabled }"
        :aria-pressed="isEnabled"
        aria-label="Toggle ControlNet row"
        @pointerdown.stop
        @mousedown.stop
        @click.stop="setEnabled(!isEnabled)"
      />

      <select
        class="controlnet-select"
        :value="value.controlnet || 'None'"
        :title="selectTitle"
        @pointerdown.stop
        @mousedown.stop
        @click.stop
        @change="setControlNet($event.target.value)"
      >
        <option v-for="option in controlNetOptions" :key="option" :value="option" :title="getControlNetOptionTitle(option)">
          {{ option }}
        </option>
      </select>

      <StackRowActions @move-up="move(-1)" @move-down="move(1)" @remove="removeRow" />
    </div>

    <div class="metrics-row">
      <label class="metric-field">
        <span>Strength</span>
        <input
          class="metric-input"
          type="number"
          step="0.05"
          min="0"
          :value="strengthDisplayValue"
          @pointerdown.stop
          @mousedown.stop
          @click.stop
          @change="setStrength($event.target.value)"
        />
      </label>

      <label class="metric-field">
        <span>Start</span>
        <input
          class="metric-input"
          type="number"
          step="0.01"
          min="0"
          max="1"
          :value="startPercentDisplayValue"
          @pointerdown.stop
          @mousedown.stop
          @click.stop
          @change="setStartPercent($event.target.value)"
        />
      </label>

      <label class="metric-field">
        <span>End</span>
        <input
          class="metric-input"
          type="number"
          step="0.01"
          min="0"
          max="1"
          :value="endPercentDisplayValue"
          @pointerdown.stop
          @mousedown.stop
          @click.stop
          @change="setEndPercent($event.target.value)"
        />
      </label>
    </div>
  </div>
</template>

<style scoped>
.metric-input::-webkit-outer-spin-button,
.metric-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.metric-input {
  -moz-appearance: textfield;
}

.controlnet-row {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  min-height: 70px;
  padding: 4px 10px 10px;
  border: 1px solid #4a5568;
  border-radius: 8px;
  background: #1f2937;
  color: #e5e7eb;
  font-size: 12px;
}

.top-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.metrics-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.toggle,
.controlnet-select,
.metric-input {
  border: 1px solid #4a5568;
  border-radius: 6px;
  background: #111827;
  color: inherit;
  font: inherit;
}

.toggle {
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

.controlnet-select {
  flex: 1 1 auto;
  min-width: 0;
  height: 24px;
  padding: 2px 4px;
}

.metric-field {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.metric-field span {
  min-width: 34px;
  flex-shrink: 0;
  color: #9ca3af;
}

.metric-input {
  width: 100%;
  min-width: 0;
  height: 24px;
  padding: 4px 6px;
  text-align: center;
}
</style>
