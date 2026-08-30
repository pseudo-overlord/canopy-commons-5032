<script setup>
import { reactive } from "vue";

defineProps({
  opportunityTitle: { type: String, required: true },
});

const form = reactive({ name: "", email: "", partySize: "1" });

const submitForm = () => {
  console.log("Interest submitted", form);
};
</script>

<template>
  <div class="card">
    <div class="card-body">
      <h2 class="h4">Register your interest</h2>

      <form @submit.prevent="submitForm">
        <div class="mb-3">
          <label for="name" class="form-label">Your name</label>
          <input id="name" v-model="form.name" type="text" class="form-control" />
        </div>

        <div class="mb-3">
          <label for="email" class="form-label">Email address</label>
          <input id="email" v-model="form.email" type="email" class="form-control" />
        </div>

        <div class="mb-3">
          <label for="partySize" class="form-label">Number of people</label>
          <input id="partySize" v-model="form.partySize" type="number" class="form-control" />
        </div>

        <button type="submit" class="btn btn-primary">Register my interest</button>
      </form>
    </div>
  </div>
</template>
