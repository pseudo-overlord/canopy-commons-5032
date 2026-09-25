<script setup>
import { onUnmounted, ref } from "vue";

defineProps({
  modelValue: { type: String, default: "" },
  id: { type: String, required: true },
  label: { type: String, required: true },
  hint: { type: String, default: "" },
  error: { type: String, default: "" },
});

defineEmits(["update:modelValue"]);

// Show the password for a few seconds, then hide it again on its own so it
// is not left readable on screen if the user walks away.
const SHOW_FOR_MS = 10000;

const visible = ref(false);
let hideTimer = null;

const toggle = () => {
  clearTimeout(hideTimer);
  visible.value = !visible.value;

  if (visible.value) {
    hideTimer = setTimeout(() => {
      visible.value = false;
    }, SHOW_FOR_MS);
  }
};

onUnmounted(() => clearTimeout(hideTimer));
</script>

<template>
  <div class="mb-3">
    <label :for="id" class="form-label">{{ label }}</label>

    <div class="input-group">
      <input
        :id="id"
        :type="visible ? 'text' : 'password'"
        :value="modelValue"
        class="form-control"
        :class="{ 'is-invalid': error }"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="
          [hint ? `${id}-hint` : '', error ? `${id}-error` : '']
            .filter(Boolean)
            .join(' ') || undefined
        "
        @input="$emit('update:modelValue', $event.target.value)"
      />
      <button
        type="button"
        class="btn btn-outline-secondary"
        :aria-label="visible ? 'Hide password' : 'Show password'"
        :aria-pressed="visible"
        @click="toggle"
      >
        {{ visible ? "Hide" : "Show" }}
      </button>
      <div v-if="error" :id="`${id}-error`" class="invalid-feedback">
        {{ error }}
      </div>
    </div>

    <div v-if="hint" :id="`${id}-hint`" class="form-text">{{ hint }}</div>
    <p v-if="visible" class="form-text mb-0">
      Hiding again in {{ SHOW_FOR_MS / 1000 }} seconds.
    </p>
  </div>
</template>
