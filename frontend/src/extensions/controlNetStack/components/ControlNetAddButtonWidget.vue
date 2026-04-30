<script setup>
import StackAddButton from "../../shared/stackWidgets/StackAddButton.vue";

import { showControlNetChooser } from "../bridges/comfyDialogs.js";
import { getAvailableControlNets } from "../bridges/controlnetRegistry.js";
import { DEFAULT_ROW_VALUE } from "../constants.js";

const props = defineProps({
  node: {
    type: Object,
    required: true,
  },
});

function addRow(event) {
  const controlNets = getAvailableControlNets();
  if (!controlNets.length) {
    props.node._aliceAddRow?.();
    return;
  }

  showControlNetChooser(event, (value) => {
    if (value && value !== "None") {
      props.node._aliceAddRow?.({ ...DEFAULT_ROW_VALUE, controlnet: value });
    }
  });
}
</script>

<template>
  <StackAddButton label="Add ControlNet" @click="addRow" />
</template>
