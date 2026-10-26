import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { authStartupGuard } from "./build/auth-startup-guard.js";
import { offlineBundle } from "./build/offline-bundle.js";

export default defineConfig({
  plugins: [vue(), authStartupGuard(), offlineBundle()],
  build: {
    target: "es2022",
    rollupOptions: {
      input: { main: "index.html", offline: "offline.html" },
      output: {
        // The auth backends are awaited before the app mounts, so keep the
        // shared password check in a chunk of its own.
        manualChunks(id) {
          const path = id.replaceAll("\\", "/");
          if (path.endsWith("/src/utils/password.js"))
            return "password-validation";
          if (/\/node_modules\/(?:@vue\/|vue\/|vue-router\/)/.test(path))
            return "vue-runtime";
          if (
            /\/src\/(?:utils\/(?:format|opportunities|map|savedActivities)\.js|composables\/useSavedActivities\.js|components\/SaveActivity\.vue)$/.test(
              path,
            )
          )
            return "public-activities";
        },
      },
    },
  },
});
