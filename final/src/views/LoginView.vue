<script setup>
import { computed, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { login } from "../identity.js";
import { focusFirstError } from "../utils/focus.js";
import { validateAccount } from "../utils/validation.js";
import PasswordField from "../components/PasswordField.vue";

const route = useRoute();
const router = useRouter();
const form = reactive({ email: "", password: "" });
const submitted = ref(false);
const serverError = ref("");
const busy = ref(false);

const errors = computed(() => validateAccount(form, false));

const submitForm = async (event) => {
  if (busy.value) return;

  submitted.value = true;
  serverError.value = "";

  if (Object.keys(errors.value).length > 0) {
    await focusFirstError(event);
    return;
  }

  busy.value = true;
  try {
    await login(form.email, form.password);
    // Go back to the page they wanted, or to their account page.
    router.push(route.query.redirect || "/account");
  } catch (error) {
    serverError.value = error.message;
  } finally {
    busy.value = false;
  }
};
</script>

<template>
  <div class="row">
    <div class="col-md-6 offset-md-3">
      <h1>Log in</h1>

      <div v-if="route.query.registered === '1'" class="alert alert-success">
        Account created. You can log in now.
      </div>
      <div v-if="route.query.denied === '1'" class="alert alert-warning">
        Please log in to view that page.
      </div>
      <div v-if="serverError" class="alert alert-warning" role="alert">
        {{ serverError }}
      </div>

      <form novalidate @submit.prevent="submitForm">
        <div class="mb-3">
          <label for="email" class="form-label">Email address</label>
          <input
            id="email"
            v-model="form.email"
            :aria-invalid="submitted && !!errors.email"
            :aria-describedby="
              submitted && errors.email ? 'email-error' : undefined
            "
            type="email"
            class="form-control"
            :class="{ 'is-invalid': submitted && errors.email }"
          />
          <div
            v-if="submitted && errors.email"
            id="email-error"
            class="invalid-feedback"
          >
            {{ errors.email }}
          </div>
        </div>

        <PasswordField
          id="password"
          v-model="form.password"
          label="Password"
          hint="Use at least 8 characters and no more than 72 UTF-8 bytes. Some characters, including emoji, use more than one byte. Previously accepted passwords longer than 72 bytes can no longer be used."
          :error="submitted ? errors.password : ''"
        />

        <button type="submit" class="btn btn-primary" :disabled="busy">
          {{ busy ? "Logging in..." : "Log in" }}
        </button>
      </form>

      <p class="mt-3">
        New here? <RouterLink to="/register">Create an account</RouterLink>
      </p>
    </div>
  </div>
</template>
