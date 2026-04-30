<script setup>
const props = defineProps({
  label: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["click"]);

function handleClick(event) {
  emit("click", event);
}
</script>

<template>
  <button
    class="stack-add-button"
    type="button"
    @pointerdown.stop
    @mousedown.stop
    @click.stop="handleClick"
  >
    <i class="pi pi-plus" aria-hidden="true"></i>
    <span>{{ props.label }}</span>
  </button>
</template>

<style scoped>
.stack-add-button {
  width: 100%;
  min-height: 22px;
  padding: 0 10px;
  border: 1px solid #447d49;
  border-radius: 8px;
  background: #305f34;
  color: #ffffff;
  font-size: 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.stack-add-button :deep(.pi) {
  font-size: 12px;
}
</style>
