<script setup>
const props = defineProps({
  node: {
    type: Object,
    required: true,
  },
});

function addRow() {
  props.node._aliceAddRow?.();
}
</script>

<template>
  <button class="power-lora-add-button" type="button" @pointerdown.stop @mousedown.stop @click.stop="addRow()">
    + Add Lora
  </button>
</template>

<style scoped>
.power-lora-add-button {
  width: 100%;
  min-height: 22px;
  padding: 0px 10px;
  border: 1px solid #447d49;
  border-radius: 8px;
  background: #305f34;
  color: #ffffff;
  font-size: 12px;
  cursor: pointer;
}
</style>
