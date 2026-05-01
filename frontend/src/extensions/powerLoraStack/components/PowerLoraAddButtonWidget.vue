<script setup>
import StackAddButton from "../../shared/stackWidgets/StackAddButton.vue";

import { showLoraChooser } from "../bridges/comfyDialogs.js";
import { getAvailableLoras } from "../bridges/loraRegistry.js";
import { DEFAULT_ROW_VALUE } from "../constants.js";

const props = defineProps({
  node: {
    type: Object,
    required: true,
  },
});

function addRow(event) {
  const loras = getAvailableLoras();
  if (!loras.length) {
    props.node._aliceAddRow?.();
    return;
  }

  showLoraChooser(event, (value) => {
    if (value && value !== "None") {
      props.node._aliceAddRow?.({ ...DEFAULT_ROW_VALUE, lora: value });
    }
  });
}
</script>

<template>
  <StackAddButton label="Add Lora" @click="addRow" />
</template>
