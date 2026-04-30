<script setup>
import StackAddButton from "../../shared/stackWidgets/StackAddButton.vue";

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
  <StackAddButton label="Add Lora" @click="addRow" />
</template>
