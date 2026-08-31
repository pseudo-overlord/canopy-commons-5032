<script setup>
import { computed, reactive, ref } from "vue";
import { validateInterest } from "../utils/validation.js";

const props = defineProps({
  opportunityTitle: { type: String, required: true },
});

const form = reactive({ name: "", email: "", partySize: "1" });
const submitted = ref(false);
const confirmation = ref(null);

const errors = computed(() => validateInterest(form));

const submitForm = () => {
  submitted.value = true;

  if (Object.keys(errors.value).length === 0) {
    confirmation.value = {
      name: form.name.trim(),
      email: form.email.trim(),
      partySize: Number(form.partySize),
    };
  }
};

const editDetails = () => {
  confirmation.value = null;
  submitted.value = false;
};
</script>

<template>
  <div class="card">
    <div class="card-body">
      <div v-if="confirmation">
        <h2 class="h4">Thanks, {{ confirmation.name }}!</h2>
        <p>
          You have registered interest in <strong>{{ opportunityTitle }}</strong> for
          {{ confirmation.partySize }}
          {{ confirmation.partySize === 1 ? "person" : "people" }}.
        </p>
        <p class="text-muted small">
          We would contact you at {{ confirmation.email }}. This is a demonstration, so
          nothing is actually sent or saved.
        </p>
        <button type="button" class="btn btn-secondary" @click="editDetails">
          Edit my details
        </button>
      </div>

      <div v-else>
        <h2 class="h4">Register your interest</h2>
        <p class="text-muted small">
          This is a demonstration form. Your details are only kept while this page is open.
        </p>

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
  </div>
</template>
