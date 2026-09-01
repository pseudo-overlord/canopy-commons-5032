<script setup>
// The header and footer stay on every page; RouterView shows the current page.
</script>

<template>
  <nav class="navbar navbar-expand-sm navbar-light bg-light border-bottom">
    <div class="container">
      <RouterLink to="/" class="navbar-brand">
        Canopy Commons
      </RouterLink>
      <div class="navbar-nav">
        <RouterLink to="/" class="nav-link">Home</RouterLink>
        <RouterLink to="/discover" class="nav-link">Discover</RouterLink>
      </div>
    </div>
  </nav>

  <main class="container my-4">
    <RouterView />
  </main>

  <footer class="bg-light border-top py-3 mt-5">
    <div class="container text-muted small">
      <p class="mb-0">Canopy Commons Melbourne &middot; FIT5032 Assignment 2</p>
    </div>
  </footer>
</template>
