<script setup>
const emit = defineEmits(["move-up", "move-down", "remove"]);
</script>

<template>
  <div class="action-group">
    <button
      type="button"
      class="icon-button"
      aria-label="Move row up"
      @pointerdown.stop
      @mousedown.stop
      @click.stop="emit('move-up')"
    >
      <i class="pi pi-arrow-up" aria-hidden="true"></i>
    </button>
    <button
      type="button"
      class="icon-button"
      aria-label="Move row down"
      @pointerdown.stop
      @mousedown.stop
      @click.stop="emit('move-down')"
    >
      <i class="pi pi-arrow-down" aria-hidden="true"></i>
    </button>
    <button
      type="button"
      class="icon-button danger"
      aria-label="Delete row"
      @pointerdown.stop
      @mousedown.stop
      @click.stop="emit('remove')"
    >
      <i class="pi pi-trash" aria-hidden="true"></i>
    </button>
  </div>
</template>

<style scoped>
.action-group {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.icon-button {
  width: 24px;
  height: 24px;
  padding: 0;
  border: 1px solid #4a5568;
  border-radius: 6px;
  background: #111827;
  color: inherit;
  font: inherit;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.icon-button :deep(.pi) {
  font-size: 12px;
}

.icon-button.danger {
  color: #fca5a5;
}
</style>
