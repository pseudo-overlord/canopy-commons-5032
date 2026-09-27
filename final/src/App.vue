<script setup>
import { watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  authError,
  currentUser,
  initialiseAccounts,
  logout,
} from "./auth.js";

const router = useRouter();
const route = useRoute();
watch(
  currentUser,
  (user) => {
    if (route.meta.requiresAuth && !user)
      router.replace({
        path: "/login",
        query: { denied: "1", redirect: route.fullPath },
      });
    else if (route.meta.role && user?.role !== route.meta.role)
      router.replace("/access-denied");
  },
  { flush: "sync" },
);

const handleLogout = async () => {
  try {
    await logout();
    router.push("/");
  } catch {
    authError.value =
      "Could not sign out. Please retry before leaving a shared device.";
  }
};
</script>

<template>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <nav
    class="navbar navbar-expand-sm navbar-light bg-light border-bottom"
    aria-label="Main navigation"
  >
    <div class="container">
      <RouterLink to="/" class="navbar-brand">
        <img src="/leaf.svg" width="28" height="28" alt="" class="me-2" />
        Canopy Commons
      </RouterLink>
      <div class="navbar-nav">
        <RouterLink to="/" class="nav-link">Home</RouterLink>
        <RouterLink to="/discover" class="nav-link">Discover</RouterLink>

        <!-- Only coordinators are shown the overview link. -->
        <RouterLink
          v-if="currentUser?.role === 'coordinator'"
          to="/coordinator"
          class="nav-link"
        >
          Overview
        </RouterLink>

        <template v-if="currentUser">
          <RouterLink to="/account" class="nav-link">My account</RouterLink>
          <button
            type="button"
            class="btn btn-link nav-link"
            @click="handleLogout"
          >
            Log out
          </button>
        </template>
        <template v-else>
          <RouterLink to="/login" class="nav-link">Log in</RouterLink>
          <RouterLink to="/register" class="nav-link">Register</RouterLink>
        </template>
      </div>
    </div>
  </nav>

  <main id="main-content" tabindex="-1" class="container my-4">
    <div v-if="authError" class="alert alert-warning" role="alert">
      <p class="mb-2">{{ authError }}</p>
      <button
        type="button"
        class="btn btn-outline-secondary btn-sm"
        @click="initialiseAccounts"
      >
        Retry account storage
      </button>
    </div>
    <RouterView />
  </main>

  <footer class="bg-light border-top py-3 mt-5">
    <div class="container text-muted small">
      <p class="mb-0">Canopy Commons Melbourne &middot; 34231846</p>
    </div>
  </footer>
</template>
