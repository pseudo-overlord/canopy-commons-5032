<script setup>
import { computed, reactive, ref } from "vue";
import { validateInterest } from "../utils/validation.js";

defineProps({
  opportunityTitle: { type: String, required: true },
});

const form = reactive({ name: "", email: "", partySize: "1" });
const submitted = ref(false);

const errors = computed(() => validateInterest(form));

const submitForm = () => {
  submitted.value = true;
};
</script>

<template>
  <div class="card">
    <div class="card-body">
      <h2 class="h4">Register your interest</h2>

      <form novalidate @submit.prevent="submitForm">
        <div class="mb-3">
          <label for="name" class="form-label">Your name</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            class="form-control"
            :class="{ 'is-invalid': submitted && errors.name }"
          />
          <div v-if="submitted && errors.name" class="invalid-feedback">
            {{ errors.name }}
          </div>
        </div>

        <div class="mb-3">
          <label for="email" class="form-label">Email address</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            class="form-control"
            :class="{ 'is-invalid': submitted && errors.email }"
            placeholder="maya@example.com"
          />
          <div v-if="submitted && errors.email" class="invalid-feedback">
            {{ errors.email }}
          </div>
        </div>

        <div class="mb-3">
          <label for="partySize" class="form-label">Number of people</label>
          <input
            id="partySize"
            v-model="form.partySize"
            type="number"
            class="form-control"
            :class="{ 'is-invalid': submitted && errors.partySize }"
          />
          <div class="form-text">From 1 to 10 people, including you.</div>
          <div v-if="submitted && errors.partySize" class="invalid-feedback">
            {{ errors.partySize }}
          </div>
        </div>

        <button type="submit" class="btn btn-primary">Register my interest</button>
      </form>
    </div>
  </div>
</template>
