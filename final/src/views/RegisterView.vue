<script setup>
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { register } from "../identity.js";
import { focusFirstError } from "../utils/focus.js";
import { validateAccount } from "../utils/validation.js";
import PasswordField from "../components/PasswordField.vue";

const router = useRouter();
const form = reactive({
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
});
const submitted = ref(false);
const serverError = ref("");
const busy = ref(false);

const errors = computed(() => validateAccount(form, true));

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
    await register(form.name, form.email, form.password);
    router.push({ path: "/login", query: { registered: "1" } });
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
      <h1>Create an account</h1>
      <p class="text-muted">
        Use a display name and an email address you can verify. Activities are
        fictional coursework examples.
      </p>

      <div v-if="serverError" class="alert alert-warning" role="alert">
        {{ serverError }}
      </div>

      <form novalidate @submit.prevent="submitForm">
        <div class="mb-3">
          <label for="name" class="form-label">Your name</label>
          <input
            id="name"
            v-model="form.name"
            :aria-invalid="submitted && !!errors.name"
            :aria-describedby="
              submitted && errors.name ? 'name-error' : undefined
            "
            type="text"
            class="form-control"
            :class="{ 'is-invalid': submitted && errors.name }"
          />
          <div
            v-if="submitted && errors.name"
            id="name-error"
            class="invalid-feedback"
          >
            {{ errors.name }}
          </div>
        </div>

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
            placeholder="alexmurphy@example.com"
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
          hint="Use at least 8 characters and no more than 72 UTF-8 bytes. Some characters, including emoji, use more than one byte."
          :error="submitted ? errors.password : ''"
        />

        <PasswordField
          id="confirmPassword"
          v-model="form.confirmPassword"
          label="Confirm password"
          :error="submitted ? errors.confirmPassword : ''"
        />

        <button type="submit" class="btn btn-primary" :disabled="busy">
          {{ busy ? "Creating account..." : "Create account" }}
        </button>
      </form>

      <p class="mt-3">
        Already have an account? <RouterLink to="/login">Log in</RouterLink>
      </p>
    </div>
  </div>
</template>
